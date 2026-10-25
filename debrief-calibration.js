/* =====================================================================
   DÉBRIEF EN DEUX TEMPS + CALIBRATION DU COACH
   Se charge APRÈS le script principal de closing-copilot.html :
     <script src="./debrief-calibration.js"></script>   juste avant </body>

   Ce qu'il change :
   1. Le débrief de fin de roleplay/sparring et « Le coach lit mon call »
      ne reçoivent plus toute la méthode d'un bloc. Le coach lit d'abord
      l'échange SANS fiches, rend son jugement, puis va chercher dans ta
      méthode seulement ce qui répond à ses fautes. Réponses plus longues
      autorisées, relance automatique si la réponse est coupée, et plus
      jamais de « undefined/10 » ni de faux « tu es passé à côté ».
   2. La calibration : on mesure si le coach juge juste.
      - pronostic à l'aveugle sur tes vrais calls (il ne connaît pas l'issue) ;
      - sessions marquées « sérieuse » ou « volontairement mauvaise » ;
      - re-notation du même exercice pour mesurer le bruit de la note.
      Le tableau de bord est dans « Ma progression ».
   ===================================================================== */
(function(){

/* =====================================================================
   0. LE SPARRING S'APPELLE DÉSORMAIS « ROLEPLAY »
   On renomme tout ce qui s'affiche, y compris les messages créés plus tard.
   Les noms internes et les clés de stockage ne bougent pas : tes quotas,
   ton historique et ton fichier acces.json continuent de marcher.
   ===================================================================== */
const renomme = t => t
  .replace(/\bSPARRINGS?\b/g, m => m.length > 8 ? "ROLEPLAYS" : "ROLEPLAY")
  .replace(/\bSparrings\b/g, "Roleplays").replace(/\bsparrings\b/g, "roleplays")
  .replace(/\bSparring\b/g, "Roleplay").replace(/\bsparring\b/g, "roleplay");
function renommeNoeud(n){
  if(n.nodeType === 3){
    const p = n.parentNode;
    if(p && /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) return;
    if(/sparring/i.test(n.nodeValue)){ const v = renomme(n.nodeValue); if(v !== n.nodeValue) n.nodeValue = v; }
    return;
  }
  if(n.nodeType === 1){
    if(/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.nodeName)) return;
    if(n.placeholder && /sparring/i.test(n.placeholder)) n.placeholder = renomme(n.placeholder);
    n.childNodes.forEach(renommeNoeud);
  }
}
renommeNoeud(document.body);
new MutationObserver(ms => ms.forEach(m => {
  if(m.type === "characterData") renommeNoeud(m.target);
  else m.addedNodes.forEach(renommeNoeud);
})).observe(document.body, {childList:true, subtree:true, characterData:true});

const esc = s => escapeHTML(s);
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const CLE_PRONOS = "calib_pronostics";
const CLE_SESSIONS = "calib_sessions";

function manque(j, champs){
  return champs.filter(k => !j || j[k] === undefined || j[k] === null || j[k] === "" ||
                            (Array.isArray(j[k]) && !j[k].length && k !== "moments"));
}

/* Un appel qui doit rendre un JSON complet. Si des champs manquent, la réponse
   a presque toujours été coupée : on redemande une fois, plus court, plus long. */
async function appelJson(prompt, max, requis, o){
  // avec des options (doctrine, effort), on passe par le cerveau 5.5 ; sinon, l'ancien chemin
  const appel = (p, mx) => o ? appelCerveau(p, Object.assign({}, o, {max: mx})) : callClaude(p, mx);
  let j = null, m = requis.slice();
  try{ j = parseModelJson(await appel(prompt, max)); m = manque(j, requis); }catch(e){ if(!/illisible|invalide/i.test(e.message)) throw e; }
  if(m.length){
    try{
      const j2 = parseModelJson(await appel(prompt +
        "\n\nIMPORTANT : ta réponse précédente a été coupée avant la fin. Sois plus bref dans chaque champ, mais remplis-les TOUS, jusqu'à la dernière accolade.",
        Math.round(max * 1.4)));
      const m2 = manque(j2, requis);
      if(!j || m2.length < m.length){ j = j2; m = m2; }
    }catch(e){ if(!j) throw e; }
  }
  j.__manque = m;
  return j;
}

/* Les fiches qui répondent aux besoins exprimés par le coach, sans doublon. */
function fichesPour(requetes, n, terrain){
  const vues = new Set(), out = [];
  (requetes || []).filter(Boolean).forEach(q => {
    chercheFiches(String(q), {n:5, dicible:true, terrain}).forEach(f => {
      const k = ficheCle(f);
      if(!vues.has(k) && out.length < (n || 8)){ vues.add(k); out.push(f); }
    });
  });
  return out;
}
const listeFiches = l => l.length
  ? l.map((f,i)=>`${i+1}. [${f.ecole||"?"}] ${f.situation||f.label||""} → « ${f.phrase} »${f.pourquoi ? " — pourquoi : "+f.pourquoi : ""}`).join("\n")
  : "aucune fiche ne correspond";
const ficheParNumero = (l, n) => { const k = num(n); return (k && k >= 1 && k <= l.length) ? l[k-1] : null; };

const REGLE_ADAPTATION = `RÈGLE SUR LA PHRASE QUE TU PROPOSES — TU ADAPTES, TU N'INVENTES PAS.
Tu pars du MÉCANISME d'une fiche ci-dessus (ce que son "pourquoi" explique), puis tu formules avec les mots, les chiffres et la situation de CE prospect. Tu gardes le levier, l'angle et le registre ; tu changes le prénom, les chiffres, l'exemple.
Si la phrase de la fiche colle déjà, reprends-la telle quelle. Ta phrase reste courte et parlée, comme celles des fiches.
Donne toujours le numéro de la fiche dont tu es parti. Si aucune ne s'applique vraiment, mets numero à null et dis-le : c'est un trou dans sa base, et c'est une information utile.`;

/* =====================================================================
   LE FIL : ce que les coachs gardent en tête de tout votre travail.
   Les roleplays y sont écrits à leur débrief ; les séances de coaching
   (analyses, questions, phases) sont relues depuis leur propre mémo.
   ===================================================================== */
const DEPART_FIL = new Date(2026, 9, 19, 11, 0).getTime();   // nouveau départ : le nouveau cerveau de Josh
function cleFil(){
  let p = "woidih";
  try{ p = localStorage.getItem("woidih_profil_actif") || "woidih"; }catch(_){}
  if(modeTesteur()) p = "t";
  return "coach_fil" + (p === "woidih" ? "" : "__" + p);
}
async function filLit(){ const l = await Store.get(cleFil()); return Array.isArray(l) ? l : []; }
async function filEcrit(e){
  const l = await filLit();
  const i = l.findIndex(x => x.id === e.id);
  if(i >= 0) Object.assign(l[i], e); else l.push(e);
  await Store.set(cleFil(), l.slice(-200));
}
// une ligne de roleplay, telle que le coach la relira
function ligneRoleplay(e){
  return [e.vu, e.joue ? "Là où ça a basculé : " + e.joue : "", e.faute ? "Sa faute : " + e.faute : "",
          e.aurait_du ? "Il fallait dire : « " + e.aurait_du + " »" : "", e.a_travailler ? "À corriger : " + e.a_travailler : "",
          e.note != null ? "Note " + e.note + "/10." : ""].filter(Boolean).join(" ").slice(0, 700);
}
let filSeances = null;      // la section 7 y branche les séances de coaching : (sauf) => [{t, txt}]
let FIL_DEBRIEF = "";       // le fil lu juste avant un débrief de roleplay
// tout le travail fait, du plus ancien au plus récent (les n derniers), sauf la séance en cours
async function texteFil(n, sauf){
  const rp = (await filLit()).filter(e => e.type === "roleplay" && (e.t || 0) > DEPART_FIL)
    .map(e => ({t: e.t, txt: e.titre + (e.coach ? " (avec " + e.coach + ")" : "") + " : " + ligneRoleplay(e)}));
  let se = []; try{ se = filSeances ? filSeances(sauf) : []; }catch(_){}
  return rp.concat(se).sort((a, b) => a.t - b.t).slice(-n)
    .map(x => "  - " + new Date(x.t).toLocaleDateString("fr-FR", {weekday: "long", day: "numeric", month: "long"}) + " · " + x.txt).join("\n");
}

/* =====================================================================
   1A. LE DÉBRIEF DU ROLEPLAY / SPARRING
   ===================================================================== */
const REQUIS_SPAR = ["lecture","note","faute","trouve","criteres","une_chose"];

function promptDebrief1(){
  const p = SPAR.p, seg = segmentCourant();
  const b2b = ((SPAR && SPAR.marche) || sparMarche) === "b2b";
  const criteres = (SEGMENTS_CHOISIS.length > 1
    ? SEGMENTS_CHOISIS.flatMap(k => {
        const v = (b2b && SEGMENTS_B2B[k]) ? Object.assign({}, SEGMENTS[k], SEGMENTS_B2B[k]) : SEGMENTS[k];
        return [v.nom.toUpperCase()].concat(v.criteres.map(c => "  - " + c));
      })
    : seg.criteres.map((c,i) => (i+1) + ". " + c)).join("\n");
  const sansCouche3 = !p.douleur_intime || /jamais|non atteinte/i.test(p.douleur_intime || "");

  return `Tu es ${manniereDuCoach().nom}. Tu débriefes un élève qui vient de s'entraîner contre un prospect joué par une IA.

${manniereDuCoach().ton}

Écris ce débrief dans cette manière-là, pas comme un rapport neutre. Tutoie-le, parle-lui directement.

CE QUE LE CLOSER NE SAVAIT PAS :
Le vrai blocage du prospect était : ${p.vrai}
La question qui le débloquait ressemblait à : ${p.cle}
Sa capacité à payer : ${p.budget_reel}
${SPAR.reel && sansCouche3 ? "Lors du vrai call, la couche profonde n'avait jamais été atteinte. S'il l'a obtenue cette fois, dis-le-lui : c'est un progrès réel." : ""}
${SPAR.reel ? `CE CALL A VRAIMENT EU LIEU. Dans la réalité : ${{vendu:"le prospect a signé",perdu:"le prospect n'a pas signé",relance:"le call s'est terminé en relance"}[p.issue]||"issue inconnue"}.
Ce que le closer avait raté ce jour-là : ${p.rate||"non renseigné"}.
Dis-lui clairement s'il a corrigé son erreur ou s'il l'a refaite.` : ""}

L'ÉCHANGE :
${SPAR.tours.map(t => (t.qui === "MOI" ? "CLOSER" : "PROSPECT") + " : " + t.txt).join("\n")}
${souvenirs(SPAR.tours.slice(-12).map(t => t.txt).join(" ") + " " + (p.vrai || "") + " " + seg.objectif, [seg.terrain], b2b ? "b2b" : "b2c", 8)}
${b2b ? `CE CALL EST EN B2B. Ne lui reproche jamais de ne pas avoir cherché l'émotion. Ce qu'on attend : des chiffres, la propagation du problème aux autres équipes, le circuit de décision, le déclencheur, l'enjeu personnel abordé par le côté.` : ""}

LE MOMENT TRAVAILLÉ : ${seg.nom}
OBJECTIF DE CET EXERCICE : ${seg.objectif}
JUGE-LE SUR CES CRITÈRES-LÀ, ET SUR RIEN D'AUTRE :
${criteres}

${notesDuCoach()}
${FIL_DEBRIEF ? `CE QU'IL A DÉJÀ TRAVAILLÉ AVEC SES COACHS (le plus récent en dernier) :
${FIL_DEBRIEF}
C'est un fil, pas un exercice isolé. Si sa faute d'aujourd'hui est déjà apparue là-dedans, dis-le-lui clairement dans "lecture" (« c'est la même chose que sur… »). S'il a corrigé quelque chose qui revenait, dis-le aussi. La note, elle, ne juge que cet exercice.
` : ""}
${SPAR.finRaison ? "L'EXERCICE S'EST TERMINÉ : " + SPAR.finRaison + "." : ""}
${sparMode === "coach" ? `MODE COACHING : le coach a dû l'arrêter ${SPAR.arrets||0} fois pendant l'exercice.` : ""}
${(SPAR.silencesTotal||0) > 0 ? `Il a tenu le silence ${SPAR.silencesTotal} fois après ses questions.` : "Il n'a jamais tenu le silence après une question forte."}
Qui menait à la fin : ${SPAR.etat.lead === "prospect" ? "le prospect" : "le closer"}. Il a perdu le lead ${SPAR.pertesLead||0} fois.
État du prospect à la fin : confiance ${SPAR.etat.confiance}/10, patience ${SPAR.etat.patience}/10, couche ${SPAR.etat.couche}/3 (le plus profond atteint : ${SPAR.coucheMax||1}/3).
Ce qu'il venait chercher sans le dire : ${p.son_but || "non renseigné"} — ${SPAR.etat.but_obtenu ? "il l'a obtenu" : "il ne l'a jamais obtenu"}.

TU N'AS PAS SA MÉTHODE SOUS LES YEUX, ET C'EST VOULU.
D'abord tu comprends ce qui s'est passé, comme un coach qui écoute un enregistrement. La méthode viendra après, et ce sera toi qui iras la chercher.

1. Relis l'échange du début à la fin. Raconte ce que tu as vu, deux ou trois phrases, avec tes mots.
2. Choisis toi-même les moments qui ont compté (deux à six). Pour chacun : ce que le prospect venait d'offrir, ce que le closer en a fait, ce que ça a coûté. Cite les mots.
3. Remonte à la cause : où le call a vraiment basculé.
4. Nomme le mécanisme avec une image.
5. Dis ce qu'il n'a pas entendu, et compte ses questions qui rebondissaient sur la dernière phrase du prospect et celles qui ouvraient un sujet neuf.
6. Dans "recherches", écris une à trois phrases qui décrivent ce que tu irais chercher dans sa méthode pour corriger sa faute principale, avec les mots du métier. Pas de mots-clés : des phrases.
7. Termine sur UNE seule chose à corriger.

LA NOTE : elle doit être reproductible. Si tu relisais ce même échange demain, tu devrais donner la même. Ancre-la sur les critères : chaque critère clairement raté coûte des points, chaque critère clairement réussi en rapporte. Pas d'indulgence, pas de sévérité de principe.

Sans flatterie. Tout en français, dans son vocabulaire de closer francophone.

Réponds uniquement avec ce JSON, sans markdown, et sois concis dans chaque champ :
{"lecture":"deux ou trois phrases",
 "moments":[{"quand":"le moment, cite les mots","offert":"ce que le prospect venait d offrir","fait":"ce que le closer en a fait","coute":"ce que ca a coute"}],
 "bascule":"le moment ou ca a bascule et pourquoi, ou null",
 "mecanique":"le mecanisme avec une image, une ou deux phrases",
 "ecoute":{"rebonds":nombre,"neufs":nombre,"rates":["ce qu il n a pas entendu, cite"]},
 "criteres":[{"c":"le critere, recopie","ok":true ou false,"note":"une phrase, cite ses mots"}],
 "trouve":true ou false selon qu il a trouve le vrai blocage,
 "quand":"a quel moment il aurait pu le trouver, cite ses mots, ou null",
 "note":un entier sur 10,
 "fort":"la meilleure chose qu il a faite, cite-la",
 "faute":"sa faute principale, cite-la",
 "une_chose":"LA seule chose a corriger la prochaine fois",
 "recherches":["ce que tu irais chercher dans sa methode, en une phrase"]${SPAR.reel ? ',\n "corrige":"a-t-il corrige l erreur du vrai call, ou refaite : une phrase franche"' : ""}}`;
}

function promptDebrief2(j, fiches){
  const p = SPAR.p;
  return `Tu es ${manniereDuCoach().nom}. Tu viens de débriefer un exercice de closing. Voici ce que tu as conclu :
- Sa faute principale : ${j.faute || ""}
- La chose à corriger : ${j.une_chose || ""}
- Le moment où il aurait pu trouver le blocage : ${j.quand || "non précisé"}
Le prospect : ${p.prenom}, ${p.metier || ""}. Son vrai blocage : ${p.vrai}

LA FIN DE L'ÉCHANGE :
${SPAR.tours.slice(-10).map(t => (t.qui === "MOI" ? "CLOSER" : "PROSPECT") + " : " + t.txt).join("\n")}

MAINTENANT tu ouvres sa méthode. Voici les fiches que tu es allé chercher pour corriger sa faute :
${listeFiches(fiches)}
${souvenirs((j.faute || "") + " " + (j.une_chose || "") + " " + (j.quand || ""), [segmentCourant().terrain], (SPAR && SPAR.marche) || sparMarche, 6)}

${REGLE_ADAPTATION}

Réponds uniquement avec ce JSON, sans markdown :
{"aurait_du":"la phrase exacte qu il aurait du dire, adaptee a ce prospect, ou null",
 "moment":"a quel moment precis la dire",
 "numero":le numero de la fiche dont tu es parti ou null,
 "methode":"pourquoi cette fiche repond a sa faute, ou, si aucune ne convient, ce qui manque dans sa base",
 "exercice":"l exercice prioritaire pour la prochaine fois, une phrase",
 "exercices":[{"titre":"nom court","consigne":"ce qu il fait exactement, seul a voix haute ou en roleplay, avec quel moment du call travailler","repetitions":"combien de fois, ou combien de sessions","reussi_si":"a quoi il reconnait que c est acquis, concretement"}]}
Donne exactement trois exercices, tous tournes vers SA faute principale et LA chose a corriger. Du plus simple au plus exigeant. Pas d exercice generique : chacun doit pouvoir se faire des demain.`;
}

function htmlCouches(p){
  if(segmentCourant().couches === false) return "";
  const l = [["1. Ce qu'il disait", p.douleur_dite],["2. Ce qui se passait vraiment", p.douleur_reelle],["3. Ce que ça lui faisait", p.douleur_intime]];
  if(!l.some(x => x[1])) return "";
  return `<div class="block"><h3>Ses trois couches de douleur</h3>
    ${l.map((x,i) => {
      if(!x[1]) return "";
      const ok = (SPAR.coucheMax||1) >= i+1;
      return `<div style="border-left:2px solid ${ok?"var(--sage)":"var(--clay)"};padding-left:12px;margin-bottom:12px">
        <div class="eyebrow" style="color:${ok?"var(--sage)":"var(--clay)"}">${x[0]} — ${ok?"atteinte":"jamais atteinte"}</div>
        <p style="font-size:14px;margin-top:3px">${esc(x[1])}</p></div>`;
    }).join("")}
    ${p.rationalisation ? `<p style="font-size:13px;color:var(--muted);margin-top:12px"><b style="color:var(--ink)">Son explication à lui :</b> ${esc(p.rationalisation)}</p>` : ""}
    ${p.contradiction ? `<p style="font-size:13px;color:var(--muted);margin-top:6px"><b style="color:var(--ink)">La contradiction que tu pouvais lui renvoyer :</b> ${esc(p.contradiction)}</p>` : ""}
  </div>`;
}

function htmlMethode(m){
  if(!m) return `<div class="block" style="border-left:2px solid var(--steel)"><h3>Dans ta méthode</h3><p style="color:var(--muted)">Le coach va chercher dans ta méthode ce qui répond à ta faute…</p></div>`;
  if(m.erreur) return `<div class="block" style="border-left:2px solid var(--clay)"><h3>Dans ta méthode</h3><p style="color:var(--clay)">Recherche impossible : ${esc(m.erreur)}</p></div>`;
  const f = m.fiche;
  const meme = f && String(f.phrase||"").trim().toLowerCase() === String(m.aurait_du||"").trim().toLowerCase();
  return `<div class="block" style="border-left:2px solid var(--amber)">
    <h3>Ce qu'il fallait dire</h3>
    ${m.aurait_du ? `<p style="font-size:16px;line-height:1.45"><em>« ${esc(m.aurait_du)} »</em></p>
      ${m.moment ? `<p style="font-size:13px;color:var(--muted);margin-top:5px">${esc(m.moment)}</p>` : ""}
      ${f ? `<p style="font-size:12px;color:var(--muted);margin-top:9px">D'après ${esc(f.ecole||"ta base")}${meme ? "" : ` — fiche d'origine : « ${esc(f.phrase)} »`}</p>`
          : `<p style="font-size:12px;color:var(--clay);margin-top:9px">Formulation du coach : aucune fiche de ta méthode ne couvre ce moment.</p>`}`
      : `<p style="color:var(--muted)">Aucune phrase proposée.</p>`}
    ${m.methode ? `<p style="margin-top:12px;font-size:14px">${esc(m.methode)}</p>` : ""}
    ${(m.exercices||[]).length ? `<p style="margin-top:14px"><strong>Tes exercices pour retravailler ça</strong></p>
      ${m.exercices.map((x,i) => `<div style="border-left:2px solid var(--steel);padding-left:12px;margin-top:10px">
        <div style="font-weight:600">${i+1}. ${esc(x.titre||"")}</div>
        <p style="font-size:13.5px;margin-top:3px">${esc(x.consigne||"")}</p>
        ${x.repetitions ? `<p style="font-size:12.5px;color:var(--muted);margin-top:3px">Combien : ${esc(x.repetitions)}</p>` : ""}
        ${x.reussi_si ? `<p style="font-size:12.5px;color:var(--sage);margin-top:3px">Réussi si : ${esc(x.reussi_si)}</p>` : ""}
      </div>`).join("")}`
      : (m.exercice ? `<p style="margin-top:12px"><strong>Exercice pour la prochaine fois</strong><br>${esc(m.exercice)}</p>` : "")}
  </div>`;
}

function rendDebriefSpar(j, m){
  const p = SPAR.p, note = num(j.note);
  const tr = j.trouve === true ? ["Tu l'as trouvé.","var(--sage)"]
           : j.trouve === false ? ["Tu es passé à côté.","var(--clay)"]
           : ["Le coach n'a pas tranché sur ce point.","var(--amber)"];
  const e = j.ecoute;
  const manquent = (j.__manque || []);

  $("sparDebrief").innerHTML = `
    ${manquent.length ? `<div class="block" style="border-left:2px solid var(--amber)"><p style="font-size:13.5px">Réponse du coach incomplète (manque : ${esc(manquent.join(", "))}). Relance avec « Re-noter ce même exercice » plus bas.</p></div>` : ""}
    ${htmlCouches(p)}
    ${j.lecture ? `<div class="block" style="border-left:2px solid var(--amber)">
      <h3>Ce que ${esc(manniereDuCoach().nom)} a vu</h3>
      <p style="font-size:16px;line-height:1.55">${esc(j.lecture)}</p>
      ${j.bascule ? `<p style="font-size:14px;color:var(--muted);margin-top:12px"><b style="color:var(--ink)">Là où ça a basculé :</b> ${esc(j.bascule)}</p>` : ""}
      ${j.mecanique ? `<p style="font-size:14px;margin-top:12px;padding:11px 13px;border-radius:9px;background:rgba(232,163,61,.07)">${esc(j.mecanique)}</p>` : ""}
    </div>` : ""}
    ${(j.moments||[]).length ? `<div class="block"><h3>Les moments qui ont compté</h3>
      ${j.moments.map((x,i) => `<div style="border-left:2px solid var(--line);padding-left:13px;margin-bottom:16px">
        <div class="eyebrow" style="color:var(--amber)">${i+1}. ${esc(x.quand||"")}</div>
        ${x.offert ? `<p style="font-size:13.5px;margin-top:6px"><span style="color:var(--muted)">Il t'offrait —</span> ${esc(x.offert)}</p>` : ""}
        ${x.fait ? `<p style="font-size:13.5px;margin-top:3px"><span style="color:var(--muted)">Tu en as fait —</span> ${esc(x.fait)}</p>` : ""}
        ${x.coute ? `<p style="font-size:13.5px;margin-top:3px;color:#E9B9AE"><span style="color:var(--muted)">Ça t'a coûté —</span> ${esc(x.coute)}</p>` : ""}
      </div>`).join("")}</div>` : ""}
    ${e ? `<div class="block"><h3>Ton écoute</h3>
      <p style="font-size:15px">${num(e.rebonds)||0} question(s) qui rebondissaient sur sa dernière phrase, ${num(e.neufs)||0} qui ouvraient un sujet neuf.</p>
      ${(e.rates||[]).length ? `<p style="font-size:13px;color:var(--muted);margin-top:12px">Ce que tu n'as pas entendu :</p>
        ${e.rates.map(x => `<p style="font-size:13.5px;margin-top:5px;padding-left:11px;border-left:2px solid var(--clay)">${esc(x)}</p>`).join("")}` : ""}
    </div>` : ""}
    <div class="block" style="border-left:2px solid ${tr[1]}">
      <h3>Son vrai blocage</h3>
      <p style="font-size:17px;line-height:1.45">${esc(p.vrai||"")}</p>
      <p style="margin-top:10px;color:${tr[1]};font-weight:600">${tr[0]}</p>
      ${j.quand ? `<p style="font-size:13.5px;color:var(--muted);margin-top:6px">${esc(j.quand)}</p>` : ""}
    </div>
    <div class="block">
      <h3>${esc(segmentCourant().nom)} — vu par ${esc(manniereDuCoach().nom)}</h3>
      <p style="font-family:'Archivo Narrow';font-weight:700;font-size:40px">${note === null ? "—" : note + "/10"}</p>
      ${(j.criteres||[]).map(c => `<div style="display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--line)">
        <span style="color:${c.ok?"var(--sage)":"var(--clay)"};font-weight:700;flex:none">${c.ok?"✓":"✕"}</span>
        <div><div style="font-size:13.5px">${esc(c.c)}</div><div style="font-size:12.5px;color:var(--muted);margin-top:2px">${esc(c.note)}</div></div></div>`).join("")}
      ${j.fort ? `<p style="margin-top:14px"><strong>Ce qui était bon</strong><br>${esc(j.fort)}</p>` : ""}
      ${j.faute ? `<p style="margin-top:12px"><strong>Ta faute principale</strong><br>${esc(j.faute)}</p>` : ""}
      ${j.une_chose ? `<p style="margin-top:12px"><strong>LA chose à corriger</strong><br>${esc(j.une_chose)}</p>` : ""}
      ${j.corrige ? `<p style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)"><strong>Par rapport au vrai call</strong><br>${esc(j.corrige)}</p>` : ""}
      ${SPAR.indices ? `<p style="font-size:12.5px;color:var(--muted);margin-top:14px">${SPAR.indices} indice(s) utilisé(s). En vrai call, personne ne t'en donne.</p>` : ""}
    </div>
    ${htmlMethode(m)}
    <div class="block" style="border-left:2px solid var(--steel)">
      <h3>Tester la fiabilité du coach</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:10px">Dis-lui honnêtement ce que tu as joué. Sur plusieurs sessions, on verra si sa note fait vraiment la différence entre un bon et un mauvais closer.</p>
      <div class="row" id="calibTag">
        <button class="pill" data-tag="serieux">Session sérieuse</button>
        <button class="pill" data-tag="sabote">Volontairement mauvaise</button>
      </div>
      <div class="row" style="margin-top:10px"><button class="pill" id="btnRenoter">Re-noter ce même exercice</button></div>
      <p id="calibSparEtat" style="font-size:13px;margin-top:10px"></p>
    </div>
    <div class="row">
      <button class="pill" id="btnEcouteDebrief" style="border-color:var(--amber);color:var(--amber)">Écouter le débrief</button>
      <button class="pill" id="btnPdfDebrief">Télécharger en PDF</button>
      <button class="pill" id="btnRejouerMeme" style="border-color:var(--amber);color:var(--amber)">Refaire le même exercice</button>
      <button class="pill" id="btnAutreProspect">Changer de réglages</button>
    </div>`;

  $("btnEcouteDebrief").onclick = () => ecouteDebrief();
  $("btnPdfDebrief").onclick = () => pdfDebrief();
  $("btnRejouerMeme").onclick = () => {
    $("sparDebrief").innerHTML = "";
    $("sparSetup").style.display = "none"; $("sparJeu").style.display = "block";
    $("btnSparGo").disabled = false; $("btnSparGo").onclick();
  };
  $("btnAutreProspect").onclick = () => $("btnSpar").click();
  branchCalibSpar();
}

/* ---- sessions de calibration ---- */
async function sessions(){ const s = await Store.get(CLE_SESSIONS); return Array.isArray(s) ? s : []; }
async function majSession(id, fn){
  const l = await sessions();
  let s = l.find(x => x.id === id);
  if(!s){
    s = {id, date:new Date().toISOString().slice(0,10),
         segment:segmentCourant().nom, prospect:(SPAR.p||{}).prenom || "", notes:[], tag:null};
    l.push(s);
  }
  fn(s);
  await Store.set(CLE_SESSIONS, l.slice(-300));
  return s;
}

function branchCalibSpar(){
  const id = SPAR.debut;
  sessions().then(l => {
    const s = l.find(x => x.id === id);
    if(s && s.tag) document.querySelectorAll("#calibTag .pill").forEach(b => b.classList.toggle("on", b.dataset.tag === s.tag));
  });
  document.querySelectorAll("#calibTag [data-tag]").forEach(b => {
    b.onclick = async () => {
      await majSession(id, s => { s.tag = b.dataset.tag; });
      document.querySelectorAll("#calibTag .pill").forEach(x => x.classList.toggle("on", x === b));
      $("calibSparEtat").innerHTML = '<span style="color:var(--sage)">Noté. Le résultat cumulé est dans Ma progression.</span>';
    };
  });
  $("btnRenoter").onclick = async () => {
    const btn = $("btnRenoter"); btn.disabled = true;
    $("calibSparEtat").innerHTML = '<span style="color:var(--muted)">Le coach relit le même échange, sans savoir qu\'il l\'a déjà noté…</span>';
    try{
      const j2 = await appelJson(promptDebrief1(), 2800, REQUIS_SPAR, optsDebrief());
      const j1 = SPAR.dernierDebrief || {};
      const n1 = num(j1.note), n2 = num(j2.note);
      const s = await majSession(SPAR.debut, x => { if(n2 !== null) x.notes.push(n2); });
      const c1 = j1.criteres || [], c2 = j2.criteres || [];
      const k = Math.min(c1.length, c2.length);
      let accord = 0; for(let i = 0; i < k; i++) if(!!c1[i].ok === !!c2[i].ok) accord++;
      const ecart = (n1 !== null && n2 !== null) ? Math.abs(n1 - n2) : null;
      const coul = ecart === null ? "var(--muted)" : ecart <= 1 ? "var(--sage)" : ecart <= 2 ? "var(--amber)" : "var(--clay)";
      $("calibSparEtat").innerHTML = `<span style="color:${coul}">Notes de ce même exercice : ${s.notes.join(" · ")}.
        ${ecart !== null ? "Écart avec la première : " + ecart + " point" + (ecart>1?"s":"") + "." : ""}
        ${k ? " Critères jugés pareil : " + accord + "/" + k + "." : ""}
        Blocage trouvé : ${j1.trouve===true?"oui":j1.trouve===false?"non":"?"} puis ${j2.trouve===true?"oui":j2.trouve===false?"non":"?"}.</span>
        <br><span style="color:var(--muted)">${ecart !== null && ecart >= 2 ? "Écart important : une variation de cette taille entre deux sessions ne prouve rien." : "Sur un même échange, la note doit rester à un point près."}</span>`;
    }catch(e){
      $("calibSparEtat").innerHTML = '<span style="color:var(--clay)">' + esc(e.message) + '</span>';
    }
    btn.disabled = false;
  };
}

$("btnSparFin").onclick = async () => {
  if(!SPAR || DEBRIEF_EN_COURS) return;
  DEBRIEF_EN_COURS = true;
  boutonFinAppuye(true);
  arreteSparMicro(); coupeAudio();
  phase("terminé", "var(--line)", false);
  $("sparDebrief").innerHTML = '<div class="block"><p style="color:var(--muted)">Le coach relit ton exercice…</p></div>';
  $("sparDebrief").scrollIntoView({block:"start"});

  let j;
  try{ FIL_DEBRIEF = await texteFil(8); }catch(_){ FIL_DEBRIEF = ""; }
  try{
    j = await appelJson(promptDebrief1(), 2800, REQUIS_SPAR, optsDebrief());
  }catch(e){
    DEBRIEF_EN_COURS = false; boutonFinAppuye(false);
    $("sparDebrief").innerHTML = '<div class="block"><p style="color:var(--clay)">Débrief impossible : ' + esc(e.message) +
      '</p><button class="pill" id="btnReDebrief" style="margin-top:10px">Réessayer</button></div>';
    $("btnReDebrief").onclick = () => $("btnSparFin").click();
    return;
  }
  SPAR.dernierDebrief = j;
  SPAR.dernierMethode = null;
  $("sparJeu").style.display = "none";
  rendDebriefSpar(j, null);
  $("spar").scrollTop = 0;

  const note = num(j.note);
  HISTO = HISTO.filter(h => h.id !== SPAR.debut);
  HISTO.push({id:SPAR.debut, date:new Date().toISOString().slice(0,10),
              prospect:"Roleplay · " + segmentCourant().nom + " · " + SPAR.p.prenom,
              duree:Math.round((Date.now() - SPAR.debut)/60000),
              resultat: j.trouve === true ? "relance" : j.trouve === false ? "perdu" : "inconnu",
              sparring:true, note,
              objections:[SPAR.p.surface||""].filter(Boolean), faites:[], bons:0, mauvais:0});
  if(HISTO.length > 300) HISTO = HISTO.slice(-300);
  Store.set("historique", HISTO);
  if(note !== null) majSession(SPAR.debut, s => { if(!s.notes.length) s.notes.push(note); });
  // le fil : ce roleplay restera en tête du coach pour les séances suivantes
  const idFil = "r" + SPAR.debut;
  filEcrit({id: idFil, t: Date.now(), type: "roleplay", coach: manniereDuCoach().nom,
            titre: "Roleplay « " + segmentCourant().nom + " »" + (SPAR.p.metier ? " contre un prospect " + SPAR.p.metier : "") + (SPAR.reel ? " (rejeu d'un vrai call)" : ""),
            vu: j.lecture || "", joue: j.bascule || "", faute: j.faute || "", a_travailler: j.une_chose || "", note, trouve: j.trouve}).catch(() => {});

  // Deuxième temps : il va chercher dans ta méthode ce qui répond à SA lecture.
  let m;
  try{
    const fiches = fichesPour([].concat(j.recherches || [], j.faute, j.une_chose), 8, segmentCourant().terrain);
    const r = await appelJson(promptDebrief2(j, fiches), 1800, ["exercice","exercices"], optsDebrief());
    m = Object.assign({}, r, {fiche: ficheParNumero(fiches, r.numero)});
  }catch(e){ m = {erreur: e.message}; }
  if(m && m.aurait_du) filEcrit({id: idFil, aurait_du: m.aurait_du}).catch(() => {});
  DEBRIEF_EN_COURS = false; boutonFinAppuye(false);
  if(SPAR && SPAR.dernierDebrief === j){
    SPAR.dernierMethode = m;
    const box = document.querySelector("#sparDebrief");
    const blocs = box ? [...box.querySelectorAll(".block")] : [];
    const cible = blocs.find(b => /Dans ta méthode|Ce qu'il fallait dire/.test(b.textContent));
    if(cible){ const d = document.createElement("div"); d.innerHTML = htmlMethode(m); cible.replaceWith(d.firstElementChild); }
    // en mains libres, le coach te lit le débrief tout seul
    if(sparCanal === "vocal") ecouteDebrief();
  }
};

/* ---- le débrief à voix haute ---- */
let DEBRIEF_EN_COURS = false, LECTURE_DEBRIEF = false;
function texteDebriefVocal(){
  const j = SPAR.dernierDebrief || {}, m = SPAR.dernierMethode || {};
  const b = [];
  if(j.lecture) b.push("Alors. " + j.lecture);
  if(num(j.note) !== null) b.push("Je te mets " + num(j.note) + " sur 10.");
  if(j.trouve === true) b.push("Tu as trouvé son vrai blocage.");
  if(j.trouve === false) b.push("Tu es passé à côté de son vrai blocage. C'était : " + (SPAR.p.vrai || "") + ".");
  if(j.fort) b.push("Ce qui était bon : " + j.fort);
  if(j.faute) b.push("Ta faute principale : " + j.faute);
  if(j.bascule) b.push("Là où ça a basculé : " + j.bascule);
  if(m.aurait_du) b.push("Ce qu'il fallait dire : " + m.aurait_du);
  if(j.une_chose) b.push("La seule chose à corriger la prochaine fois : " + j.une_chose);
  if((m.exercices||[]).length){
    b.push("Tes exercices.");
    m.exercices.forEach((x,i) => b.push((i+1) + ". " + (x.titre||"") + ". " + (x.consigne||"") + (x.repetitions ? " " + x.repetitions + "." : "")));
  }
  return b.join(" ");
}
function ecouteDebrief(){
  const btn = $("btnEcouteDebrief");
  if(LECTURE_DEBRIEF){ coupeAudio(); LECTURE_DEBRIEF = false; if(btn) btn.textContent = "Écouter le débrief"; return; }
  if(!SPAR || !SPAR.dernierDebrief) return;
  debloqueSon();
  LECTURE_DEBRIEF = true; if(btn) btn.textContent = "Arrêter la lecture";
  const avant = VOIX_TOUJOURS; VOIX_TOUJOURS = true;
  faisParlerCoach(texteDebriefVocal(), () => {
    VOIX_TOUJOURS = avant; LECTURE_DEBRIEF = false;
    const b2 = $("btnEcouteDebrief"); if(b2) b2.textContent = "Écouter le débrief";
    phase("terminé", "var(--line)", false);
  });
}

/* ---- le débrief en PDF, avec les exercices ---- */
function pdfDebrief(){
  if(!SPAR || !SPAR.dernierDebrief) return;
  const j = SPAR.dernierDebrief, m = SPAR.dernierMethode || {}, p = SPAR.p;
  const d = new Date().toLocaleDateString("fr-FR");
  const bloc = (t, c) => c ? `<h2>${t}</h2>${c}` : "";
  const para = t => t ? `<p>${esc(t)}</p>` : "";
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Débrief roleplay ${esc(d)}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;color:#1d1d1d;margin:32px;line-height:1.5;font-size:12.5pt}
    h1{font-size:20pt;margin:0 0 4px} .meta{color:#666;font-size:10.5pt;margin-bottom:18px}
    h2{font-size:12pt;text-transform:uppercase;letter-spacing:.08em;color:#a8671b;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:22px}
    .note{font-size:28pt;font-weight:bold} .cite{font-style:italic} .ok{color:#2e7d4f} .ko{color:#b23a26}
    .ex{border-left:3px solid #4a7fa5;padding-left:10px;margin:10px 0;page-break-inside:avoid}
    .case{display:inline-block;width:12px;height:12px;border:1px solid #333;margin-right:6px;vertical-align:middle}
  </style></head><body>
  <h1>Débrief roleplay — ${esc(segmentCourant().nom)}</h1>
  <div class="meta">${esc(d)} · Prospect : ${esc(p.prenom||"")}${p.metier ? ", " + esc(p.metier) : ""} · Coach : ${esc(manniereDuCoach().nom)}</div>
  <div class="note">${num(j.note) === null ? "—" : num(j.note) + "/10"}</div>
  ${bloc("Ce que le coach a vu", para(j.lecture) + (j.bascule ? `<p><b>Là où ça a basculé :</b> ${esc(j.bascule)}</p>` : "") + para(j.mecanique))}
  ${bloc("Son vrai blocage", para(p.vrai) + `<p class="${j.trouve===true?"ok":"ko"}">${j.trouve===true?"Trouvé.":j.trouve===false?"Pas trouvé.":"Non tranché."}</p>` + para(j.quand))}
  ${bloc("Les moments qui ont compté", (j.moments||[]).map((x,i) => `<p><b>${i+1}. ${esc(x.quand||"")}</b><br>Il t'offrait : ${esc(x.offert||"")}<br>Tu en as fait : ${esc(x.fait||"")}<br>Ça t'a coûté : ${esc(x.coute||"")}</p>`).join(""))}
  ${bloc("Les critères", (j.criteres||[]).map(c => `<p><span class="${c.ok?"ok":"ko"}">${c.ok?"✓":"✕"}</span> ${esc(c.c)}<br><small>${esc(c.note)}</small></p>`).join(""))}
  ${bloc("Ce qui était bon", para(j.fort))}
  ${bloc("Ta faute principale", para(j.faute))}
  ${bloc("Ce qu'il fallait dire", m.aurait_du ? `<p class="cite">« ${esc(m.aurait_du)} »</p>${para(m.moment)}${m.fiche ? `<p><small>D'après ${esc(m.fiche.ecole||"ta base")} — « ${esc(m.fiche.phrase)} »</small></p>` : ""}${para(m.methode)}` : "")}
  ${bloc("La seule chose à corriger", para(j.une_chose))}
  ${bloc("Tes exercices", (m.exercices||[]).length
      ? m.exercices.map((x,i) => `<div class="ex"><b>${i+1}. ${esc(x.titre||"")}</b><p>${esc(x.consigne||"")}</p>${x.repetitions ? `<p><small>Combien : ${esc(x.repetitions)}</small></p>` : ""}${x.reussi_si ? `<p><small>Réussi si : ${esc(x.reussi_si)}</small></p>` : ""}<p><span class="case"></span>fait&nbsp;&nbsp;<span class="case"></span>refait&nbsp;&nbsp;<span class="case"></span>acquis</p></div>`).join("")
      : para(m.exercice))}
  </body></html>`;
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(() => {
    try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ toast("Impression bloquée par le navigateur"); }
    setTimeout(() => f.remove(), 60000);
  }, 300);
  toast("Choisis « Enregistrer au format PDF » comme imprimante");
}

/* ---- le bouton « Terminer et débriefer » : toujours visible, et il reste appuyé ---- */
(function(){
  const st = document.createElement("style");
  st.textContent = `
    #btnSparFin{position:fixed;right:18px;bottom:18px;z-index:65;background:var(--amber);color:#0E1216;
      border-color:var(--amber);font-weight:700;padding:12px 20px;box-shadow:0 8px 24px -8px rgba(0,0,0,.6)}
    #btnSparFin:hover{color:#0E1216;filter:brightness(1.08)}
    #btnSparFin.appuye{background:#8a5f22;border-color:#8a5f22;color:var(--ink);transform:translateY(2px);
      box-shadow:inset 0 2px 6px rgba(0,0,0,.5);cursor:wait}
    #coachCarte{box-shadow:0 0 0 1px rgba(217,85,63,.35)}`;
  document.head.appendChild(st);
})();
function boutonFinAppuye(oui){
  const b = $("btnSparFin"); if(!b) return;
  b.classList.toggle("appuye", oui);
  b.disabled = oui;
  b.textContent = oui ? "Débrief en cours…" : "Terminer et débriefer";
}

/* =====================================================================
   LE PERSONNAGE DICTÉ, ET LE PASSAGE DU MICRO
   La dictée du personnage ne s'arrêtait jamais toute seule : elle se
   relançait en boucle pendant le roleplay. Chrome n'accepte qu'une seule
   écoute à la fois, donc la dictée et le micro du roleplay se volaient
   le micro. Désormais, au lancement, toute dictée s'arrête et c'est le
   micro du roleplay qui prend la main.
   La description dictée est aussi rendue prioritaire sur les réglages
   (profil, couleur, température) et rappelée au prospect à chaque tour.
   ===================================================================== */
function coupeDictees(){
  ["btnDescMicro","btnCtxMicro"].forEach(id => {
    const b = $(id);
    if(b && b._rec){ const r = b._rec; b._rec = null; r.onend = null; try{ r.stop(); }catch(e){} b.textContent = "Dicter"; }
  });
}

let DESC_SPAR = "";
const callClaudeOrigine = callClaude;
callClaude = function(prompt, max){
  if(typeof prompt === "string"){
    if(DESC_SPAR && /^Fabrique un prospect francophone/.test(prompt)){
      prompt = `LE CLOSER A DÉCRIT LUI-MÊME LE PERSONNAGE QU'IL VEUT AFFRONTER. C'EST TA CONSIGNE PRINCIPALE :
« ${DESC_SPAR} »
Reprends EXACTEMENT ce qu'il a donné : prénom, âge, métier, situation, chiffres, entourage, et son blocage s'il l'a dit. N'invente que ce qu'il n'a pas précisé, et de façon cohérente avec sa description.
Si les réglages plus bas (profil, couleur, température) contredisent sa description, c'est SA DESCRIPTION qui gagne.

` + prompt;
    } else if(SPAR && SPAR.description && /^Tu joues un prospect dans un entraînement/.test(prompt)){
      prompt = prompt.replace("QUI TU ES", `CE QUE LE CLOSER A DÉCRIT DE TOI — tu le respectes à chaque réplique : « ${SPAR.description} »\n\nQUI TU ES`);
    }
    // Le coach du roleplay raisonne avec le cerveau de tes coachs, sur le modèle 5.5
    if(/Tu observes un entraînement en direct/.test(prompt)){
      prompt = conduiteJeu(prompt);
      const marche = (SPAR && SPAR.marche) || sparMarche, seg = segmentCourant();
      const sys = doctrinePour([seg.terrain], marche);
      const recent = ((SPAR && SPAR.tours) || []).slice(-4).map(t => t.txt).join(" ");
      const mem = souvenirs(recent + " " + seg.objectif, [seg.terrain], marche, 6);
      if(mem) prompt = prompt.replace("LE MOMENT TRAVAILLÉ", mem + "\nLE MOMENT TRAVAILLÉ");
      return appelCerveau(prompt, {max, systeme: sys, effort: "low", facultatif: true});
    }
    // Le prospect et sa fabrication : modèle 5.5, effort léger pour rester rapide
    if(/^(Tu joues un prospect|Fabrique un prospect|LE CLOSER A DÉCRIT)/.test(prompt)){
      return appelCerveau(prompt, {max, effort: "low"});
    }
  }
  return callClaudeOrigine(prompt, max);
};
// un testeur : aucun nom de coach réel dans ce qui part, ni dans ce qui revient
const callClaudeNomme = callClaude;
callClaude = async function(prompt, max){
  if(!modeTesteur()) return callClaudeNomme(prompt, max);
  return anonymise(await callClaudeNomme(anonymise(prompt), max));
};

const lancerOrigine = $("btnSparGo").onclick;
$("btnSparGo").onclick = async function(){
  DESC_SPAR = (typeof sparSource !== "undefined" && sparSource === "reel") ? "" : ($("sparDesc").value || "").trim();
  coupeDictees();                                   // la dictée rend le micro au roleplay
  const ancien = SPAR;
  const r = await lancerOrigine.apply(this, arguments);
  if(SPAR && SPAR !== ancien && DESC_SPAR){
    SPAR.description = DESC_SPAR;
    const inf = $("sparInfo");
    if(inf && !inf.textContent) inf.innerHTML = '<span style="color:var(--sage)">Personnage créé d\'après ta description.</span>';
  }
  boutonFinAppuye(false);
  return r;
};

/* ---- le coach passe en premier ----
   Quand il t'arrête, sa carte passe au-dessus du prospect et reste affichée
   après qu'il a parlé, pour que tu puisses la relire en reprenant. */
(function(){
  const c = $("coachCarte"), p = $("sparCarte");
  if(c && p && p.parentNode) p.parentNode.insertBefore(c, p);
})();
/* ---- le jeu de rôle conduit comme Josh ----
   Une carte « où on va » au-dessus du prospect : les quatre accords qui font
   une vente (cochés au fil du jeu par le coach), et le chrono de la découverte.
   Le coach sait où on en est, et il t'arrête quand tu pars dans un détail
   avant d'avoir posé le problème. */
const ACCORDS_JEU = [["probleme", "Un problème qui le brûle"], ["desir", "Un vrai désir de le régler"], ["seul", "Il ne peut pas seul"], ["confiance", "Il croit en l'offre, et pourquoi maintenant"]];
const minutesDeJeu = () => SPAR && SPAR.debut ? Math.max(0, Math.round((Date.now() - SPAR.debut) / 60000)) : 0;
function conduiteJeu(prompt){
  if(!SPAR) return prompt;
  const acq = SPAR.jrAccords || {};
  const obtenus = ACCORDS_JEU.filter(([k]) => acq[k] != null).map(([, n]) => n + " (vers la minute " + acq[k] + ")");
  const bloc = `LA DESTINATION DE CETTE DÉCOUVERTE : les quatre accords qui font une vente. Un problème qui le brûle ; un vrai désir de le régler ; il admet qu'il ne peut pas le régler seul ; il croit que l'offre peut l'aider, et il sait pourquoi maintenant.
Déjà obtenus d'après l'échange : ${obtenus.length ? obtenus.join(" ; ") : "aucun pour l'instant"}.
Temps de jeu : ${minutesDeJeu()} minute${minutesDeJeu() > 1 ? "s" : ""}. Une découverte complète tient en général en une vingtaine de minutes : si le closer y passe beaucoup de temps sans avancer vers ces accords, c'est un coût.
COMME JOSH EN JEU DE RÔLE : quand le closer part dans un détail (le budget, les chiffres du business, le taux de conversion, la technique du métier) avant d'avoir posé le problème et ce qu'il lui coûte, ça coûte vraiment. Il démonte un problème dont on ne sait pas encore s'il est grave, et la conversation perd sa gravité. Quand tu l'arrêtes, ta phrase « quoi » dit ce qu'on cherche à obtenir à cet endroit du call, et « pourquoi » la relie à l'accord qui manque. Le bon coup peut être de revenir quelques questions en arrière.

`;
  let p = prompt.replace("LE MOMENT TRAVAILLÉ", bloc + "LE MOMENT TRAVAILLÉ");
  // le premier temps du coach dit aussi quels accords le prospect vient de donner
  if(/\{"plan":"ou va ce closer/.test(p))
    p = p.replace('{"plan":"ou va ce closer', '{"accords":{"probleme":true ou false,"desir":true ou false,"seul":true ou false,"confiance":true ou false} (vrai seulement si le prospect l a clairement donne, avec ses mots, a un moment de l echange),\n "plan":"ou va ce closer');
  return p;
}
function majCarteJeu(){
  const jeu = $("sparJeu"); if(!jeu) return;
  let el = $("jrCarte");
  if(!el){
    el = document.createElement("div"); el.id = "jrCarte"; el.className = "block";
    el.style.cssText = "border-left:2px solid var(--amber);padding-top:14px;padding-bottom:14px";
    const rap = $("sparRappel");
    if(rap && rap.parentNode === jeu) rap.insertAdjacentElement("afterend", el); else jeu.insertBefore(el, jeu.firstChild);
  }
  if(!SPAR){ el.style.display = "none"; return; }
  el.style.display = "block";
  const acq = SPAR.jrAccords || {}, mn = minutesDeJeu(), coach = typeof sparMode !== "undefined" && sparMode === "coach";
  const tous = ACCORDS_JEU.every(([k]) => acq[k] != null);
  const alerte = mn >= 20 && !tous;
  el.innerHTML = `<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline">
      <h3 style="margin:0">Où on va</h3>
      <span style="font-size:12.5px;color:${alerte ? "var(--clay)" : "var(--muted)"}">${mn} min de jeu · une découverte tient en une vingtaine de minutes${alerte ? " : ça traîne" : ""}</span></div>
    <p style="font-size:13px;color:var(--muted);margin:8px 0 10px">Obtenir les quatre accords qui font une vente${coach ? ". Le coach les coche quand le prospect te les donne." : ". (En mode Coaching, le coach les coche au fil du jeu.)"}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${ACCORDS_JEU.map(([k, n]) => {
      const ok = acq[k] != null;
      return `<span style="font-size:12.5px;padding:4px 9px;border-radius:7px;border:1px solid ${ok ? "var(--amber)" : "var(--line)"};color:${ok ? "var(--amber)" : "var(--muted)"}">${ok ? "✓" : "○"} ${escapeHTML(n)}${ok ? " · " + acq[k] + " min" : ""}</span>`;
    }).join("")}</div>
    ${SPAR.jrPiste ? `<p style="font-size:12.5px;color:var(--muted);margin-top:10px">Là, tu creuses : ${escapeHTML(SPAR.jrPiste)}</p>` : ""}`;
}
// on récupère ce que le coach a vu à chaque tour, pour la carte
const coachAnalyseOrigine = coachAnalyse;
coachAnalyse = async function(m){
  const a = await coachAnalyseOrigine(m);
  try{
    if(a && SPAR){
      SPAR.jrAccords = SPAR.jrAccords || {};
      if(a.accords && typeof a.accords === "object")
        ACCORDS_JEU.forEach(([k]) => { if(a.accords[k] === true && SPAR.jrAccords[k] == null) SPAR.jrAccords[k] = minutesDeJeu(); });
      if(a.piste) SPAR.jrPiste = String(a.piste).slice(0, 140);
      majCarteJeu();
    }
  }catch(_){}
  return a;
};
// la carte apparaît dès que le jeu démarre, et le chrono avance tout seul
setInterval(() => { const j = $("sparJeu"); if(j && j.style.display !== "none" && SPAR) majCarteJeu(); }, 20000);
const lancerAvecCarte = $("btnSparGo").onclick;
$("btnSparGo").onclick = async function(){
  const r = await lancerAvecCarte.apply(this, arguments);
  majCarteJeu();
  return r;
};

const coachParleOrigine = faisParlerCoach;
faisParlerCoach = function(txt, apres){
  const carte = $("coachCarte");
  const visible = carte && carte.style.display === "block" && SPAR && $("sparJeu").style.display !== "none";
  if(visible) carte.scrollIntoView({block:"start", behavior:"smooth"});
  return coachParleOrigine(txt, function(){
    if(apres) apres();
    if(visible) carte.style.display = "block";      // il reste lisible jusqu'à ta prochaine réponse
  });
};


/* =====================================================================
   1B. « LE COACH LIT MON CALL » — PHASE PAR PHASE
   L'ancienne lecture demandait tout en un seul appel : « les moments
   décisifs » et « la phrase qui a fait basculer ». Le coach ne regardait
   donc que la fin du call. Désormais :
     1. il découpe le call selon la trame ;
     2. il juge chaque phase avec ses propres critères (B2C ou B2B),
        en deux appels parallèles : la découverte, puis la fin du call ;
     3. il fait la synthèse, remonte à la cause, va chercher dans ta
        méthode ce qu'il fallait dire, et te donne des exercices ;
     4. le pronostic à l'aveugle est un appel séparé, qui n'oriente plus
        la lecture.
   ===================================================================== */
const contexteRevele = t => /sign|vendu|perdu|relance|ne r[ée]pond plus|a pay[ée]|n'?a pas pris|ghost/i.test(t || "");
const hashTxt = t => { let h = 0; for(let i = 0; i < t.length; i++){ h = (h*31 + t.charCodeAt(i)) | 0; } return String(h); };
async function pronostics(){ const l = await Store.get(CLE_PRONOS); return Array.isArray(l) ? l : []; }

/* Les phases d'un call. Les critères viennent des moments du roleplay,
   pour qu'on soit jugé de la même façon en vrai et à l'entraînement. */
function critSeg(k, marche){
  const v = (marche === "b2b" && SEGMENTS_B2B[k]) ? Object.assign({}, SEGMENTS[k], SEGMENTS_B2B[k]) : SEGMENTS[k];
  return (v && v.criteres) ? v.criteres.slice() : [];
}
function phasesDuMarche(marche){
  const b2b = marche === "b2b";
  const l = [
    {k:"ouverture",  nom:"Ouverture et cadrage", groupe:"debut", seg:"ouverture", terrain:"cadrage",    crit:critSeg("ouverture", marche)},
    {k:"situation",  nom:"État des lieux",       groupe:"debut", seg:"situation", terrain:"decouverte", crit:critSeg("situation", marche)},
    {k:"douleur",    nom: b2b ? "Impact et enjeu personnel" : "Douleur", groupe:"debut", seg:"douleur", terrain:"decouverte", crit:critSeg("douleur", marche)},
    {k:"cout",       nom:"Coût de l'inaction",   groupe:"debut", seg:"cout",      terrain:"decouverte", crit:critSeg("cout", marche)}
  ];
  if(b2b) l.push({k:"circuit", nom:"Déclencheur, circuit de décision et budget", groupe:"debut", seg:"transition", terrain:"decouverte", crit:[
    "A-t-il trouvé le déclencheur : pourquoi maintenant et pas dans six mois ?",
    "A-t-il fait raconter comment une décision comme celle-là s'est déjà prise chez eux ?",
    "A-t-il identifié qui peut freiner, pas seulement qui signe ?",
    "A-t-il su comment un budget se débloque, sur quelle enveloppe et quel calendrier ?",
    "A-t-il cherché ce qui pourrait faire capoter le dossier en interne ?"]});
  l.push(
    {k:"vision",       nom: b2b ? "Résultat attendu" : "Vision et objectif", groupe:"debut", seg:"vision", terrain:"decouverte", crit:critSeg("vision", marche)},
    {k:"transition",   nom:"Bascule vers le pitch", groupe:"fin", seg:"transition", terrain:"decouverte", crit:critSeg("transition", marche)},
    {k:"presentation", nom:"Présentation et prix",  groupe:"fin", seg:"transition", terrain:"closing", crit:[
      "La présentation reprenait-elle les mots et les chiffres du prospect ?",
      "A-t-il présenté seulement ce qui répond à son problème, pas tout le catalogue ?",
      "A-t-il demandé son avis avant d'annoncer le prix ?",
      "Le prix a-t-il été annoncé sec, sans justification, puis suivi d'un silence ?"]
      .concat(b2b ? ["A-t-il relié la solution aux indicateurs que le prospect avait donnés ?"] : [])},
    {k:"objection",    nom:"Objections",            groupe:"fin", seg:"objection", terrain:"objection", crit:critSeg("objection", marche)},
    {k:"closing",      nom:"Closing et paiement",   groupe:"fin", seg:"closing",   terrain:"closing",   crit:critSeg("closing", marche).concat(critSeg("paiement", marche).slice(0,2))}
  );
  return l;
}

/* La manière du coach selon la phase et le marché */
function maniereFor(terrain, marche){
  const e = Object.entries(ECOLES).find(([k,v]) =>
    (v.terrains||[]).includes(terrain) && (!v.marches || v.marches.includes(marche)) && !["moi","sami"].includes(k) && MANIERE_COACH[k]);
  return e ? MANIERE_COACH[e[0]] : {nom:"Coach", ton:"Tu reprends de façon directe et concrète, sans faire de leçon. Tu tutoies."};
}

/* Les fiches qui conviennent au marché du call */
function fichesMarche(requetes, n, marche){
  const vues = new Set(), out = [];
  const okMarche = f => { const e = ECOLES[f.ecole]; return !e || !e.marches || e.marches.includes(marche); };
  (requetes || []).filter(Boolean).forEach(q => {
    chercheFiches(String(q), {n:8, dicible:true}).filter(okMarche).slice(0, 4).forEach(f => {
      const k = ficheCle(f);
      if(!vues.has(k) && out.length < (n || 14)){ vues.add(k); out.push(f); }
    });
  });
  return out;
}

const texteCall = (tours, nom) => tours.map((t,i) => `[${i+1}] ${t.moi ? "CLOSER" : nom.toUpperCase()} : ${t.text}`).join("\n");
const consigneMarche = m => m === "b2b"
  ? `MARCHÉ : B2B. Ton élève dit lui-même qu'il perd ses calls B2B. Sois particulièrement exigeant sur ce qui fait la différence en B2B :
${CONSIGNE_B2B}
Ne lui reproche jamais de ne pas avoir cherché l'émotion : en B2B, ça fait fuir un professionnel.`
  : "MARCHÉ : B2C haut de gamme, le prospect décide pour lui.";

/* ---- Passage 1 : découper le call ---- */
function promptDecoupage(tours, nom, phases){
  return `Tu es coach de closing. Avant de juger quoi que ce soit, tu découpes un vrai call en phases, comme quand on réécoute un enregistrement.

LES PHASES POSSIBLES, dans l'ordre habituel :
${phases.map(p => `- ${p.k} : ${p.nom}`).join("\n")}

Un call réel ne suit pas toujours cet ordre : une phase peut être absente, survolée, revenir plus tard. Une phase absente est une information importante : signale-la, ne l'invente pas.

LE CALL
${texteCall(tours, nom)}

Réponds uniquement avec ce JSON, sans markdown :
{"phases":[{"phase":"code de la phase","present":true ou false,"debut":numero de replique ou null,"fin":numero de replique ou null,"resume":"ce qui s y passe, une phrase, ou pourquoi elle manque"}]}
Donne TOUTES les phases de la liste, dans l'ordre, présentes ou non.`;
}

/* ---- Passage 2 : juger chaque phase ---- */
function promptPhases(tours, nom, ctx, marche, groupe, decoupage){
  const coach = maniereFor(groupe[0].terrain, marche);
  const reperes = decoupage
    ? groupe.map(p => { const d = decoupage.find(x => x.phase === p.k) || {};
        return `- ${p.nom} : ${d.present === false ? "ABSENTE d'après le découpage" : "répliques " + (d.debut||"?") + " à " + (d.fin||"?")}${d.resume ? " — " + d.resume : ""}`; }).join("\n")
    : "Découpage indisponible : repère toi-même les répliques de chaque phase.";
  return `Tu es ${coach.nom}, coach de closing. Tu réécoutes un vrai call de ton élève, phase par phase.

${coach.ton}

${ctx ? "CE QU'IL T'A DIT SUR CE CALL :\n" + ctx : ""}

${consigneMarche(marche)}

LE CALL ENTIER — pour le contexte. Tu ne juges que les phases demandées plus bas.
${texteCall(tours, nom)}

OÙ SE TROUVENT LES PHASES À JUGER :
${reperes}

LES PHASES À JUGER, avec leurs critères. Tu les juges TOUTES, une par une :
${groupe.map(p => `### ${p.k} — ${p.nom}\n${p.crit.map(c => "- " + c).join("\n")}`).join("\n\n")}
${souvenirs(groupe.map(p => {
    const d = (decoupage || []).find(x => x.phase === p.k) || {};
    const extrait = (d.debut && d.fin) ? tours.slice(Math.max(0, d.debut - 1), Math.min(tours.length, d.fin, d.debut + 6)).map(t => t.text).join(" ") : "";
    return p.nom + " " + (d.resume || "") + " " + extrait;
  }).join(" "), groupe[0].groupe === "debut" ? ["cadrage","decouverte"] : ["objection","closing"], marche, 10)}

COMMENT TU JUGES :
- Chaque phase sur ses propres critères, pas sur l'issue du call.
- Une phase absente ou survolée n'est pas neutre : c'est une faute, et tu dis ce qu'elle a coûté pour la suite.
- Observation d'abord, interprétation ensuite. Cite ses mots exacts, avec le numéro de réplique.
- Si la phase est bien menée, dis-le précisément : c'est aussi utile qu'un reproche.
- La note de chaque phase doit être reproductible : relue demain, tu donnerais la même.
- Au plus deux moments par phase, les plus importants.
- Dans "recherche", une phrase qui décrit ce que tu irais chercher dans sa méthode pour corriger cette phase, avec les mots du métier.

Réponds uniquement avec ce JSON, sans markdown, concis :
{"phases":[{"phase":"code",
  "note":0 a 10 ou null si la phase est absente,
  "present":true ou false,
  "bien":[{"quoi":"ce qui etait juste","cite":"ses mots","replique":numero}],
  "manque":[{"quoi":"ce qui a manque ou etait faux","cite":"ses mots ou null","replique":numero ou null}],
  "cout":"ce que cette phase ratee ou absente a coute pour la suite du call, ou null",
  "moments":[{"replique":numero,"cite":"ses mots exacts","fait":"ce qu il a fait","effet":"ce que ca a provoque ensuite"}],
  "recherche":"ce que tu irais chercher dans sa methode, une phrase"}]}`;
}

/* ---- Passage 3 : synthèse, méthode et exercices ---- */
function promptSynthese(tours, nom, marche, phasesNotes, moments, fiches, issue){
  const coach = maniereFor(marche === "b2b" ? "decouverte" : "objection", marche);
  const segs = Object.keys(SEGMENTS).filter(k => k !== "complet");
  return `Tu es ${coach.nom}, coach de closing. Tu as réécouté le call de ton élève phase par phase. Tu rends maintenant ta synthèse.

${coach.ton}

${consigneMarche(marche)}
${issue ? "ISSUE RÉELLE DU CALL : " + issue + "." : "Issue du call non précisée."}

CE QUE TU AS VU, PHASE PAR PHASE :
${phasesNotes}

LES MOMENTS QUE TU AS RELEVÉS :
${moments.map(m => `[réplique ${m.replique}] (${m.phaseNom}) « ${m.cite||""} » — ${m.fait||""}`).join("\n") || "aucun"}

LES FICHES DE SA MÉTHODE que tu es allé chercher pour corriger ces fautes :
${listeFiches(fiches)}
${souvenirs(phasesNotes, ["cadrage","decouverte","objection","closing"], marche, 10)}

${REGLE_ADAPTATION}

CE QUE TU DOIS FAIRE :
1. Remonte à la cause. Une objection ou un échec en fin de call vient presque toujours d'une phase ratée plus tôt. Dis où le call a vraiment basculé, et quelle phase en amont l'a préparé.
2. Pour chaque moment relevé, la phrase qu'il fallait dire, tirée d'une fiche, avec son numéro. Si aucune fiche ne s'applique, dire = null.
3. Ses trois points forts et ses trois chantiers prioritaires, dans l'ordre d'impact sur ses ventes.
4. Des exercices pour travailler là où il est bloqué : trois à cinq, tournés vers les phases les plus faibles${marche === "b2b" ? ", en priorité ce qui lui fait perdre ses calls B2B" : ""}. Chaque exercice doit pouvoir se faire en roleplay dans son outil : donne le moment à travailler (un de ces codes : ${segs.join(", ")}) et le prospect à jouer, inspiré de celui de ce call.

Réponds uniquement avec ce JSON, sans markdown, concis :
{"note":0 a 10 pour le call entier,
 "verdict":"en deux phrases, ce qui s est vraiment joue",
 "bascule":{"replique":numero ou null,"cite":"la phrase","pourquoi":"pourquoi ca a bascule la","cause_amont":"la phase plus tot qui l a prepare, et comment"},
 "marche":[{"quoi":"point fort","cite":"ses mots","pourquoi":"pourquoi c etait juste"}],
 "ameliorer":[{"quoi":"chantier prioritaire","cite":"ses mots ou null","comment":"ce qu il faut faire a la place"}],
 "dires":[{"replique":numero,"dire":"la phrase adaptee ou null","numero":numero de fiche ou null}],
 "exercices":[{"titre":"nom court","phase":"la phase travaillee","consigne":"ce qu il fait exactement","repetitions":"combien de fois","reussi_si":"a quoi il reconnait que c est acquis","segment":"un code de moment de la liste","prospect":"le prospect a jouer en roleplay, deux phrases, inspire de ce call"}],
 "exercice":"l exercice prioritaire, une phrase"}`;
}

/* ---- Pronostic à l'aveugle : un appel séparé, qui n'oriente plus la lecture ---- */
function promptPronostic(tours, nom, ctx){
  return `Voici la transcription d'un vrai call de vente. Tu ne connais pas son issue.
${ctx && !contexteRevele(ctx) ? "Contexte : " + ctx : ""}

${texteCall(tours, nom)}

D'après ce que tu lis, le prospect a-t-il signé, est-il parti en relance, ou l'affaire est-elle perdue ? Tranche selon les indices, ne te réfugie pas dans « relance » par prudence.

Réponds uniquement avec ce JSON, sans markdown :
{"issue":"vendu|perdu|relance","confiance":0 a 100,"indices":"ce qui te fait dire ca, cite les mots"}`;
}

/* ---- l'impression en PDF, commune ---- */
function imprimeHtml(titre, corps){
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titre)}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;color:#1d1d1d;margin:32px;line-height:1.5;font-size:12pt}
    h1{font-size:19pt;margin:0 0 4px} .meta{color:#666;font-size:10.5pt;margin-bottom:16px}
    h2{font-size:12pt;text-transform:uppercase;letter-spacing:.08em;color:#a8671b;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:22px}
    h3{font-size:11.5pt;margin:14px 0 4px} .ok{color:#2e7d4f} .ko{color:#b23a26} .cite{font-style:italic}
    .ex{border-left:3px solid #4a7fa5;padding-left:10px;margin:10px 0;page-break-inside:avoid}
    .case{display:inline-block;width:12px;height:12px;border:1px solid #333;margin-right:6px;vertical-align:middle}
  </style></head><body>${corps}</body></html>`;
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(() => {
    try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ toast("Impression bloquée par le navigateur"); }
    setTimeout(() => f.remove(), 60000);
  }, 300);
  toast("Choisis « Enregistrer au format PDF » comme imprimante");
}

/* ---- lancer un exercice en roleplay, déjà réglé ---- */
function lanceExercice(seg, prospect, marche){
  $("rejeu").classList.remove("on");
  $("btnSpar").click();
  setTimeout(() => {
    const src = document.querySelector('#sparSource [data-src="invente"]'); if(src) src.click();
    const mb = document.querySelector('#sparMarche [data-m="' + marche + '"]'); if(mb) mb.click();
    if(SEGMENTS[seg]){
      SEGMENTS_CHOISIS = [seg]; sparSegment = seg;
      document.querySelectorAll("#sparSegments [data-seg]").forEach(b => b.classList.toggle("on", b.dataset.seg === seg));
      majSegDetail();
    }
    if(prospect) $("sparDesc").value = prospect;
    $("sparEtat").innerHTML = '<span style="color:var(--amber)">Exercice prêt : ' + esc((SEGMENTS[seg]||{}).nom || seg) +
      '. Vérifie les réglages, puis clique sur « Lancer le roleplay ».</span>';
    $("btnSparGo").scrollIntoView({block:"center"});
  }, 150);
}

const couleurNote = n => n === null || n === undefined ? "var(--clay)" : n >= 7 ? "var(--sage)" : n >= 5 ? "var(--amber)" : "var(--clay)";

function htmlPhases(L){
  return `<div class="block">
    <h3>Ton call, phase par phase</h3>
    <p style="font-size:12.5px;color:var(--muted);margin-bottom:12px">${L.marche === "b2b" ? "Jugé avec la grille B2B." : "Jugé avec la grille B2C."} Une phase absente compte comme une faute : c'est souvent là que le call s'est perdu.</p>
    ${L.phases.map(p => {
      const n = num(p.note), c = couleurNote(n);
      const d = (L.decoupage || []).find(x => x.phase === p.k) || {};
      return `<div style="border-left:2px solid ${c};padding-left:13px;margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">
          <span style="font-weight:600">${esc(p.nom)}</span>
          <span style="font-family:'Archivo Narrow';font-weight:700;color:${c}">${p.erreur ? "non analysée" : p.present === false ? "absente" : (n === null ? "—" : n + "/10")}</span>
        </div>
        ${d.debut ? `<div style="font-size:11.5px;color:var(--muted)">répliques ${esc(String(d.debut))}–${esc(String(d.fin||"?"))}</div>` : ""}
        ${p.erreur ? `<p style="font-size:13px;color:var(--clay);margin-top:4px">${esc(p.erreur)}</p>` : ""}
        ${(p.bien||[]).map(x => `<p style="font-size:13.5px;margin-top:5px"><span style="color:var(--sage)">✓</span> ${esc(x.quoi||"")}${x.cite ? ` <span style="color:var(--muted)">— « ${esc(x.cite)} »</span>` : ""}</p>`).join("")}
        ${(p.manque||[]).map(x => `<p style="font-size:13.5px;margin-top:5px"><span style="color:var(--clay)">✕</span> ${esc(x.quoi||"")}${x.cite ? ` <span style="color:var(--muted)">— « ${esc(x.cite)} »</span>` : ""}</p>`).join("")}
        ${p.cout ? `<p style="font-size:13px;color:#E9B9AE;margin-top:5px">Ce que ça a coûté : ${esc(p.cout)}</p>` : ""}
        ${(n !== null && n < 7) || p.present === false ? `<button class="pill" data-phase-ex="${esc(p.seg)}" style="margin-top:8px;font-size:12px;padding:6px 12px">M'entraîner sur cette phase</button>` : ""}
      </div>`;
    }).join("")}
  </div>`;
}

function htmlExercices(L){
  const ex = L.j.exercices || [];
  if(!ex.length) return "";
  return `<div class="block" style="border-left:2px solid var(--steel)">
    <h3>Tes exercices pour débloquer ça</h3>
    ${ex.map((x,i) => `<div style="border-left:2px solid var(--line);padding-left:12px;margin-bottom:14px">
      <div style="font-weight:600">${i+1}. ${esc(x.titre||"")}${x.phase ? ` <span style="font-size:12px;color:var(--muted)">· ${esc(x.phase)}</span>` : ""}</div>
      <p style="font-size:13.5px;margin-top:4px">${esc(x.consigne||"")}</p>
      ${x.repetitions ? `<p style="font-size:12.5px;color:var(--muted);margin-top:3px">Combien : ${esc(x.repetitions)}</p>` : ""}
      ${x.reussi_si ? `<p style="font-size:12.5px;color:var(--sage);margin-top:3px">Réussi si : ${esc(x.reussi_si)}</p>` : ""}
      ${SEGMENTS[x.segment] ? `<button class="pill" data-ex="${i}" style="margin-top:8px;font-size:12px;padding:6px 12px;border-color:var(--amber);color:var(--amber)">Faire cet exercice en roleplay</button>` : ""}
    </div>`).join("")}
    <div class="row"><button class="pill" id="btnPdfLecture">Télécharger le débrief et les exercices en PDF</button></div>
  </div>`;
}

function pdfLecture(L){
  const j = L.j, d = new Date().toLocaleDateString("fr-FR");
  const p = t => t ? `<p>${esc(t)}</p>` : "";
  imprimeHtml("Débrief de call " + d, `
    <h1>Débrief de call — ${esc(L.nom)}</h1>
    <div class="meta">${esc(d)} · ${L.marche === "b2b" ? "B2B" : "B2C"}${rjIssueChoisie ? " · issue : " + esc(rjIssueChoisie) : ""}</div>
    <h2>Note du call : ${num(j.note) === null ? "—" : num(j.note) + "/10"}</h2>
    ${p(j.verdict)}
    ${j.bascule && j.bascule.cite ? `<h2>Là où ça a basculé</h2><p class="cite">« ${esc(j.bascule.cite)} »</p>${p(j.bascule.pourquoi)}${j.bascule.cause_amont ? `<p><b>La cause en amont :</b> ${esc(j.bascule.cause_amont)}</p>` : ""}` : ""}
    <h2>Phase par phase</h2>
    ${L.phases.map(ph => `<h3>${esc(ph.nom)} — ${ph.present === false ? "absente" : (num(ph.note) === null ? "—" : num(ph.note) + "/10")}</h3>
      ${(ph.bien||[]).map(x => `<p class="ok">✓ ${esc(x.quoi||"")}</p>`).join("")}
      ${(ph.manque||[]).map(x => `<p class="ko">✕ ${esc(x.quoi||"")}${x.cite ? ` — « ${esc(x.cite)} »` : ""}</p>`).join("")}
      ${ph.cout ? `<p><small>Ce que ça a coûté : ${esc(ph.cout)}</small></p>` : ""}`).join("")}
    <h2>Les moments, et ce qu'il fallait dire</h2>
    ${(j.moments||[]).map(m => `<p><b>[${esc(String(m.replique||"?"))}] ${esc(m.phaseNom||"")}</b> — « ${esc(m.cite||"")} »<br>${esc(m.fait||"")}${m.dire ? `<br><span class="cite">À dire : « ${esc(m.dire)} »</span>` : ""}</p>`).join("")}
    <h2>Tes chantiers</h2>
    ${(j.ameliorer||[]).map(a => `<p><b>${esc(a.quoi||"")}</b><br>${esc(a.comment||"")}</p>`).join("")}
    <h2>Tes exercices</h2>
    ${(j.exercices||[]).map((x,i) => `<div class="ex"><b>${i+1}. ${esc(x.titre||"")}</b>${x.phase ? ` <small>(${esc(x.phase)})</small>` : ""}<p>${esc(x.consigne||"")}</p>${x.repetitions ? `<p><small>Combien : ${esc(x.repetitions)}</small></p>` : ""}${x.reussi_si ? `<p><small>Réussi si : ${esc(x.reussi_si)}</small></p>` : ""}<p><span class="case"></span>fait&nbsp;&nbsp;<span class="case"></span>refait&nbsp;&nbsp;<span class="case"></span>acquis</p></div>`).join("") || p(j.exercice)}
  `);
}

/* Le texte écouté et le texte copié incluent maintenant les phases et les exercices */
const texteDuDebriefOrigine = texteDuDebrief;
texteDuDebrief = function(){
  let t = texteDuDebriefOrigine();
  const L = LECTURE;
  if(L && L.phases){
    const faibles = L.phases.filter(p => p.present === false || (num(p.note) !== null && num(p.note) < 5));
    if(faibles.length) t += " Les phases où tu perds le call : " + faibles.map(p => p.nom + (p.present === false ? ", absente" : ", " + num(p.note) + " sur 10")).join(". ") + ".";
    if(L.j.bascule && L.j.bascule.cause_amont) t += " La cause en amont : " + L.j.bascule.cause_amont;
    (L.j.exercices || []).forEach((x,i) => { t += " Exercice " + (i+1) + ". " + (x.titre||"") + ". " + (x.consigne||""); });
  }
  return t;
};
const debriefEnTexteOrigine = debriefEnTexte;
debriefEnTexte = function(){
  let t = debriefEnTexteOrigine();
  const L = LECTURE;
  if(L && L.phases){
    t += "\n\nPHASE PAR PHASE";
    L.phases.forEach(p => {
      t += "\n- " + p.nom + " : " + (p.present === false ? "absente" : (num(p.note) === null ? "—" : num(p.note) + "/10"));
      (p.manque||[]).forEach(x => { t += "\n    ✕ " + (x.quoi||""); });
    });
    if((L.j.exercices||[]).length){
      t += "\n\nEXERCICES";
      L.j.exercices.forEach((x,i) => { t += "\n" + (i+1) + ". " + (x.titre||"") + " — " + (x.consigne||"") + (x.repetitions ? " (" + x.repetitions + ")" : "") + (x.reussi_si ? " · Réussi si : " + x.reussi_si : ""); });
    }
  }
  return t;
};

$("btnLire").onclick = async () => {
  const brut = $("rjTexte").value;
  const moi = $("rjMoi").value.trim() || "Woidih";
  const tours = parseTranscript(brut, moi);
  if(tours.length < 4){
    const d = diagnosticTranscript(brut, moi);
    $("lecture").innerHTML = `<div class="block" style="border-left:2px solid var(--clay)">
      <h3 style="color:var(--clay)">Je n'arrive pas à découper ce transcript</h3>
      <p style="font-size:14px;margin-top:8px">${d.lignesBrutes} lignes lues, ${tours.length} tour${tours.length>1?"s":""} reconnu${tours.length>1?"s":""}.</p>
      <p style="font-size:14px;margin-top:6px"><b style="color:var(--ink)">Interlocuteurs repérés :</b> ${d.noms.length ? d.noms.map(([n,c]) => esc(n)+" ("+c+"x)").join(", ") : '<span style="color:var(--clay)">aucun</span>'}</p>
      <pre style="font-size:12px;color:var(--muted);white-space:pre-wrap;margin-top:10px;padding-left:11px;border-left:2px solid var(--line)">${esc(d.exemples.join("\n"))}</pre>
      <p style="font-size:13.5px;margin-top:12px">Vérifie que le nom écrit dans la case correspond exactement à celui du transcript.</p></div>`;
    return;
  }
  const nom = (tours.find(t => !t.moi) || {}).nom || "le prospect";
  const ctx = $("rjContexte").value.trim();
  const issue = {perdu:"il n'a pas signé", relance:"le call s'est terminé en relance", vendu:"il a signé"}[rjIssueChoisie] || "";
  const marche = sparMarche === "b2b" ? "b2b" : "b2c";
  const phases = phasesDuMarche(marche);
  const etat = msg => { $("lecture").innerHTML = '<p style="color:var(--amber)">' + msg + '</p>'; };

  remetLectureAuDebut();
  $("btnLire").disabled = true;
  try{
    // Le pronostic part tout de suite, en parallèle et à l'aveugle
    const pronoP = rjIssueChoisie
      ? appelJson(promptPronostic(tours, nom, ctx), 600, ["issue"], {effort: "medium"}).catch(() => null)
      : Promise.resolve(null);

    // 1. découpage
    etat(`1/3 — Le coach découpe ton call en phases… (${tours.length} répliques reconnues)`);
    let decoupage = null;
    try{
      const dj = await appelJson(promptDecoupage(tours, nom, phases), 1800, ["phases"], {effort: "medium"});
      decoupage = Array.isArray(dj.phases) ? dj.phases : null;
    }catch(e){ decoupage = null; }

    // 2. jugement de chaque phase, en deux appels parallèles
    etat("2/3 — Il juge chaque phase avec ses critères" + (marche === "b2b" ? " B2B" : "") + "… une à deux minutes.");
    const groupes = ["debut","fin"].map(g => phases.filter(p => p.groupe === g));
    const resultats = await Promise.all(groupes.map(g =>
      appelJson(promptPhases(tours, nom, ctx, marche, g, decoupage), 4200, ["phases"],
        {systeme: doctrinePour(g[0].groupe === "debut" ? ["cadrage","decouverte"] : ["objection","closing"], marche), effort: "high"})
        .then(r => r.phases || []).catch(e => g.map(p => ({phase:p.k, erreur:e.message})))));
    const parCode = {};
    resultats.flat().forEach(r => { if(r && r.phase) parCode[r.phase] = r; });
    const phasesJugees = phases.map(p => Object.assign({}, p, parCode[p.k] || {erreur:"pas de réponse pour cette phase"}));
    if(phasesJugees.every(p => p.erreur)) throw new Error(phasesJugees[0].erreur);

    // tous les moments, répartis sur le call entier
    const moments = [];
    phasesJugees.forEach(p => (p.moments || []).forEach(m => {
      if(num(m.replique) && !moments.some(x => num(x.replique) === num(m.replique)))
        moments.push(Object.assign({}, m, {phaseNom:p.nom}));
    }));
    moments.sort((a,b) => num(a.replique) - num(b.replique));

    // 3. synthèse, méthode, exercices
    etat("3/3 — Synthèse, phrases tirées de ta méthode et exercices…");
    const req = [];
    phasesJugees.forEach(p => { req.push(p.recherche); (p.manque || []).forEach(x => req.push(x.quoi)); });
    const fiches = fichesMarche(req, 14, marche);
    const notes = phasesJugees.map(p => `- ${p.nom} : ${p.erreur ? "non analysée" : p.present === false ? "ABSENTE" : (num(p.note) === null ? "—" : num(p.note) + "/10")}`
      + (p.manque && p.manque.length ? " — manque : " + p.manque.map(x => x.quoi).join(" ; ") : "")
      + (p.cout ? " — coût : " + p.cout : "")).join("\n");
    let s = {};
    try{ s = await appelJson(promptSynthese(tours, nom, marche, notes, moments, fiches, issue), 3800, ["note","verdict","exercices"],
          {systeme: doctrinePour(["cadrage","decouverte","objection","closing"], marche), effort: "high"}); }
    catch(e){ s = {verdict:"La synthèse a échoué : " + e.message + ". Le détail par phase reste valable."}; }

    (s.dires || []).forEach(x => {
      const m = moments.find(y => num(y.replique) === num(x.replique));
      if(!m || !x.dire) return;
      const f = ficheParNumero(fiches, x.numero);
      m.dire = x.dire;
      m.source = f ? (f.ecole || "ta base") : "formulation du coach, hors de ta méthode";
      if(f && String(f.phrase).trim().toLowerCase() !== String(x.dire).trim().toLowerCase()) m.fiche_origine = f.phrase;
    });
    (s.ameliorer || []).forEach(a => { a.comment = a.comment || ""; });

    const j = {note: num(s.note), verdict: s.verdict || "", marche: s.marche || [], ameliorer: s.ameliorer || [],
               moments, bascule: s.bascule || null, exercice: s.exercice || "", exercices: s.exercices || []};
    const L = {j, tours, nom, phases: phasesJugees, decoupage, marche};
    const noteCalib = j.note;
    if(j.note === null) j.note = "—";
    LECTURE = L;
    rendLecture();
    j.note = noteCalib;
    if(AUDIO_CALL) poseLesMarques();

    // phases en tête, exercices à la fin
    const zone = $("lecture");
    const bl = document.createElement("div"); bl.innerHTML = htmlPhases(L);
    const premier = zone.querySelector(".block");
    if(premier && premier.nextSibling) zone.insertBefore(bl.firstElementChild, premier.nextSibling); else zone.appendChild(bl.firstElementChild);
    if(j.bascule && j.bascule.cause_amont){
      const cible = [...zone.querySelectorAll(".block")].find(b => /basculer/.test(b.textContent));
      if(cible){ const p = document.createElement("p"); p.style.cssText = "font-size:13.5px;margin-top:8px"; p.innerHTML = "<b style='color:var(--ink)'>La cause en amont :</b> " + esc(j.bascule.cause_amont); cible.appendChild(p); }
    }
    const be = document.createElement("div"); be.innerHTML = htmlExercices(L);
    if(be.firstElementChild) zone.appendChild(be.firstElementChild);
    zone.querySelectorAll("[data-ex]").forEach(b => {
      b.onclick = () => { const x = j.exercices[+b.dataset.ex]; lanceExercice(x.segment, x.prospect || "", marche); };
    });
    zone.querySelectorAll("[data-phase-ex]").forEach(b => {
      b.onclick = () => lanceExercice(b.dataset.phaseEx, `Un prospect qui ressemble à ${nom}. ${ctx ? ctx.slice(0, 300) : ""}`.trim(), marche);
    });
    const bp = $("btnPdfLecture"); if(bp) bp.onclick = () => pdfLecture(L);

    // 4. le pronostic à l'aveugle, pour la calibration
    const pr = await pronoP;
    if(rjIssueChoisie){
      const prono = String((pr && pr.issue) || "").toLowerCase();
      const valide = !contexteRevele(ctx) && ["vendu","perdu","relance"].includes(prono);
      if(valide){
        const l = await pronostics();
        const cle = hashTxt(brut.slice(0, 4000));
        const entree = {cle, date:new Date().toISOString().slice(0,10), nom, prono,
                        confiance:num(pr.confiance), reel:rjIssueChoisie, note:noteCalib};
        const i = l.findIndex(x => x.cle === cle);
        if(i >= 0) l[i] = entree; else l.push(entree);
        await Store.set(CLE_PRONOS, l.slice(-300));
      }
      const l = await pronostics();
      const ok = l.filter(x => x.prono === x.reel).length;
      const juste = prono && prono === rjIssueChoisie;
      const bloc = document.createElement("div");
      bloc.className = "block";
      bloc.style.borderLeft = "2px solid var(--steel)";
      bloc.innerHTML = `<h3>Pronostic à l'aveugle</h3>
        <p style="font-size:15px">Le coach, sans connaître l'issue, pensait : <b>${esc(prono || "?")}</b>${pr && num(pr.confiance) !== null ? " (sûr à " + num(pr.confiance) + " %)" : ""}.
          Réalité : <b>${esc(rjIssueChoisie)}</b> — <span style="color:${juste?"var(--sage)":"var(--clay)"}">${juste?"juste":"raté"}</span>.</p>
        ${pr && pr.indices ? `<p style="font-size:13px;color:var(--muted);margin-top:6px">${esc(pr.indices)}</p>` : ""}
        <p style="font-size:12.5px;color:var(--muted);margin-top:10px">${
          contexteRevele(ctx) ? "Ton contexte révèle l'issue (signé, perdu, relance…) : ce call ne compte pas dans la mesure. Retire cette info du contexte pour tester le coach."
          : !valide ? "Pronostic indisponible pour ce call."
          : `Compté. Fiabilité cumulée : ${ok}/${l.length} pronostics justes. Le détail est dans Ma progression.`}</p>`;
      zone.appendChild(bloc);
    }
  }catch(e){
    $("lecture").innerHTML = '<p style="color:var(--clay)">Lecture impossible : ' + esc(e.message) + '</p>';
  }
  $("btnLire").disabled = false;
};

/* =====================================================================
   4. LE TABLEAU DE BORD DE FIABILITÉ — dans « Ma progression »
   ===================================================================== */
const moyenne = a => a.length ? a.reduce((s,x) => s+x, 0) / a.length : null;
const r1 = x => x === null ? "—" : (Math.round(x*10)/10).toString().replace(".", ",");

async function rendCalibration(){
  let el = document.getElementById("calibPanel");
  if(!el){
    el = document.createElement("div");
    el.id = "calibPanel";
    const ancre = document.getElementById("progContenu");
    ancre.parentNode.insertBefore(el, ancre.nextSibling);
  }
  const P = await pronostics(), S2 = await sessions();

  // A. pronostics à l'aveugle
  const n = P.length, justes = P.filter(x => x.prono === x.reel).length;
  const freq = {}; P.forEach(x => freq[x.reel] = (freq[x.reel]||0) + 1);
  const maj = Object.entries(freq).sort((a,b) => b[1]-a[1])[0];
  const base = maj ? maj[1] / n : 0, acc = n ? justes / n : 0;
  const noteVendu = moyenne(P.filter(x => x.reel === "vendu" && x.note !== null).map(x => x.note));
  const notePerdu = moyenne(P.filter(x => x.reel === "perdu" && x.note !== null).map(x => x.note));
  let vA, cA;
  if(n < 5){ vA = `Encore ${5-n} call${5-n>1?"s":""} avec issue connue avant de pouvoir juger. Vise dix.`; cA = "var(--muted)"; }
  else if(acc >= base + 0.15){ vA = "Il lit tes calls mieux qu'un pronostic naïf. Ses lectures valent quelque chose."; cA = "var(--sage)"; }
  else if(acc <= base){ vA = `Il ne fait pas mieux que de toujours répondre « ${maj[0]} ». Ne te fie pas encore à ses verdicts.`; cA = "var(--clay)"; }
  else { vA = "Légèrement mieux qu'un pronostic naïf. Signal faible : continue à alimenter."; cA = "var(--amber)"; }

  // B. sérieux contre sabotage
  const prem = s => s.notes && s.notes.length ? s.notes[0] : null;
  const ser = S2.filter(s => s.tag === "serieux" && prem(s) !== null).map(prem);
  const sab = S2.filter(s => s.tag === "sabote" && prem(s) !== null).map(prem);
  const mSer = moyenne(ser), mSab = moyenne(sab);
  const ecartTag = (mSer !== null && mSab !== null) ? mSer - mSab : null;
  let vB, cB;
  if(ser.length < 3 || sab.length < 3){ vB = `Il faut au moins trois sessions de chaque sorte (tu en as ${ser.length} sérieuses, ${sab.length} sabotées). Fais-les sur le même adversaire réel.`; cB = "var(--muted)"; }
  else if(ecartTag >= 3){ vB = "Il fait clairement la différence entre un bon et un mauvais closer. Ses notes mesurent ta performance."; cB = "var(--sage)"; }
  else if(ecartTag < 1.5){ vB = "Il ne fait pas la différence. Tant que c'est le cas, une note ne prouve pas que tu progresses."; cB = "var(--clay)"; }
  else { vB = "Il fait une différence, mais trop faible pour être sûre."; cB = "var(--amber)"; }

  // C. stabilité de la note sur un même échange
  const multi = S2.filter(s => s.notes && s.notes.length >= 2);
  const ecarts = multi.map(s => { const m = moyenne(s.notes); return moyenne(s.notes.map(x => Math.abs(x - m))); });
  const bruit = moyenne(ecarts);
  let vC, cC;
  if(multi.length < 3){ vC = `Re-note au moins trois exercices (tu en as ${multi.length}). Bouton « Re-noter ce même exercice » à la fin d'un débrief.`; cC = "var(--muted)"; }
  else if(bruit <= 0.75){ vC = "Note stable : un écart d'un point entre deux sessions a du sens."; cC = "var(--sage)"; }
  else if(bruit <= 1.5){ vC = "Note un peu bruitée : ne regarde que les tendances sur plusieurs sessions."; cC = "var(--amber)"; }
  else { vC = "Note très bruitée : une variation de ±2 ne veut rien dire. Fie-toi aux critères cochés plutôt qu'au chiffre."; cC = "var(--clay)"; }

  el.innerHTML = `<div class="block" style="border-left:2px solid var(--steel)">
    <h3>Fiabilité du coach</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Trois tests. Tant qu'ils ne sont pas au vert, ses notes ne prouvent pas que tu progresses — et c'est ce que te demandera quiconque voudra acheter l'outil.</p>

    <p style="font-weight:600">1. Pronostic à l'aveugle sur tes vrais calls</p>
    <div class="metric"><span>Pronostics justes</span><span>${justes}/${n}${n ? " · " + Math.round(acc*100) + " %" : ""}</span></div>
    <div class="metric"><span>Un pronostic naïf ferait</span><span>${n ? Math.round(base*100) + " %" : "—"}</span></div>
    <div class="metric"><span>Note moyenne : calls signés / perdus</span><span>${r1(noteVendu)} / ${r1(notePerdu)}</span></div>
    <p style="font-size:13px;color:${cA};margin:8px 0 18px">${vA}</p>

    <p style="font-weight:600">2. Session sérieuse contre session sabotée</p>
    <div class="metric"><span>Note moyenne sérieuse</span><span>${r1(mSer)} (${ser.length})</span></div>
    <div class="metric"><span>Note moyenne sabotée</span><span>${r1(mSab)} (${sab.length})</span></div>
    <p style="font-size:13px;color:${cB};margin:8px 0 18px">${vB}</p>

    <p style="font-weight:600">3. Stabilité de la note</p>
    <div class="metric"><span>Écart moyen sur un même échange</span><span>${bruit === null ? "—" : "±" + r1(bruit)}</span></div>
    <p style="font-size:13px;color:${cC};margin-top:8px">${vC}</p>
  </div>`;
}

/* =====================================================================
   5. LE CERVEAU DES COACHS — la doctrine au lieu des fiches
   Les fiches ne gardaient que des répliques. La doctrine garde la façon
   de penser : principes, règles de décision, questions de diagnostic,
   erreurs corrigées, cas raisonnés. Elle est construite une fois à partir
   des transcripts, puis donnée en entier au coach à chaque analyse.
   ===================================================================== */
const MODELE_COACH = "claude-sonnet-5-5";

/* ---- les testeurs ----
   Un testeur entre avec un code d'accès (ni clé API, ni ton ?moncoach=1). Il a son propre
   espace, et ses coachs s'appellent Coach Vérité et Coach Objections : la méthode est la même,
   mais ni le nom ni l'histoire des coachs dont elle vient n'apparaissent. */
const DOCS_TESTEURS = ["verite"];
function modeTesteur(){
  try{
    const q = new URLSearchParams(location.search).get("moncoach");
    if(q === "1" || localStorage.getItem("woidih_coach_perso") === "1") return false;
    return !API_KEY && !!codeAcces();
  }catch(_){ return false; }
}
const docVisible = k => modeTesteur() ? DOCS_TESTEURS.includes(k) : !DOCS_TESTEURS.includes(k);
// filet de sécurité : aucun nom de coach réel ne passe, ni à l'aller ni au retour
function anonymise(t){
  if(typeof t !== "string" || !modeTesteur()) return t;
  return t.replace(/josh lyons/gi, "Coach Vérité").replace(/\bJosh\b/g, "Coach Vérité")
          .replace(/bill walsh/gi, "Coach Objections").replace(/\bBill\b/g, "Coach Objections")
          .replace(/ben byrne/gi, "ton coach").replace(/\bkeenan\b/gi, "ton coach").replace(/gap selling/gi, "ta méthode")
          .replace(/unicorn closers?( mastermind)?/gi, "le programme");
}
function habilleTesteur(){
  if(!modeTesteur()) return;
  try{
    Object.keys(ECOLES).forEach(k => { if(!DOCS_TESTEURS.includes(k) && !["moi", "sami"].includes(k)) delete ECOLES[k]; });
    ECOLES.verite = {nom: "Coach Vérité", terrains: ["cadrage", "decouverte", "objection", "closing"], marches: ["b2c", "b2b"]};
    if(typeof MANIERE_COACH === "object"){
      MANIERE_COACH.verite = {nom: "Coach Vérité", ton: "Tu reprends ton élève avec franchise et chaleur. Tu tutoies. Tu ne fais pas de leçon : tu nommes ce qu'il vient de faire, ce que ça coûte, et ce qu'on cherche à obtenir à cet endroit du call. Tu le ramènes toujours à la vérité de la situation du prospect, jamais à une technique."};
      const b = MANIERE_COACH["bill walsh"];
      MANIERE_COACH.objections = {nom: "Coach Objections", ton: b ? anonymise(b.ton).replace(/comme Coach Objections reprend ses élèves/g, "tes élèves") : "Direct, sec, chaleureux quand même. Des phrases très courtes. Tu ramènes tout à la vraie objection."};
    }
  }catch(_){}
}
let SERVEUR_INFO = null;
async function infoServeur(){
  if(SERVEUR_INFO) return SERVEUR_INFO;
  // on ne retient la réponse que si le serveur a accepté le code : sinon on redemandera
  try{
    const r = await fetch(srvCopilote() + "/api/ping", {headers: {"x-code": codeAcces()}});
    const d = await r.json();
    const info = {version: d.version || 1, systeme: !!d.systeme, modeles: d.modeles || []};
    if(r.ok) SERVEUR_INFO = info;
    return info;
  }catch(e){ return {version: 1, systeme: false, modeles: []}; }
}

/* Une seule porte vers le cerveau 5.5, avec la doctrine en consignes mises en cache.
   Sur un ancien serveur, on retombe sur l'ancien chemin sans rien casser. */
async function appelCerveau(prompt, o){
  if(!modeTesteur()) return appelCerveauBrut(prompt, o);
  const o2 = Object.assign({}, o || {});
  if(o2.systeme) o2.systeme = anonymise(o2.systeme);
  return anonymise(await appelCerveauBrut(anonymise(prompt), o2));
}
async function appelCerveauBrut(prompt, o){
  o = o || {};
  const max = o.max || 1500;
  await pretOuTantPis();
  COMPTEUR.fond++;
  if(parLeServeur()){
    const inf = await infoServeur();
    if(!inf.systeme || !inf.modeles.includes(MODELE_COACH)){
      const sys = (o.systeme && !o.facultatif) ? o.systeme + "\n\n" : "";
      return viaServeur(sys + prompt, max, MODELE_FOND);
    }
    let r;
    try{
      r = await fetch(srvCopilote() + "/api/claude", {method: "POST",
        headers: {"Content-Type": "application/json", "x-code": codeAcces()},
        body: JSON.stringify({prompt, max, modele: MODELE_COACH, systeme: o.systeme || undefined, effort: o.effort || "medium"})});
    }catch(e){ throw new Error("Le serveur ne répond pas. Vérifie ta connexion."); }
    const d = await r.json().catch(() => ({}));
    if(r.status === 402){ const e = new Error(d.erreur || "Ton essai gratuit est terminé."); e.quota = true; throw e; }
    if(r.status === 401) throw new Error("Code d'accès refusé. Vérifie-le, ou demande-en un nouveau.");
    if(!r.ok) throw new Error(d.erreur || ("Serveur : erreur " + r.status));
    if(!String(d.texte || "").trim()) throw new Error("réponse vide");
    return d.texte;
  }
  if(!API_KEY){                       // ouvert depuis Claude : l'ancien chemin sait faire
    return callClaudeOrigine((o.systeme && !o.facultatif ? o.systeme + "\n\n" : "") + prompt, max);
  }
  const corps = {model: MODELE_COACH, max_tokens: Math.min(20000, max + 4000),
                 output_config: {effort: o.effort || "medium"}, messages: [{role: "user", content: prompt}]};
  if(o.systeme) corps.system = [{type: "text", text: o.systeme, cache_control: {type: "ephemeral"}}];
  let r;
  try{
    r = await fetch("https://api.anthropic.com/v1/messages", {method: "POST",
      headers: {"Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true"},
      body: JSON.stringify(corps)});
  }catch(e){ throw new Error("Pas de réseau, ou clé refusée."); }
  if(!r.ok){
    const codes = {401:"Clé API invalide.", 403:"Clé sans accès.", 429:"Trop de demandes, ça se calme tout seul.", 400:"Requête refusée."};
    const e = new Error(codes[r.status] || ("HTTP " + r.status)); e.status = r.status; throw e;
  }
  const d = await r.json();
  if(d.stop_reason === "refusal") throw new Error("Le cerveau a refusé de répondre à cette demande.");
  const t = (d.content || []).filter(c => c.type === "text").map(c => c.text || "").join("");
  if(!t.trim()) throw new Error("réponse vide");
  return t;
}

/* ---- les doctrines ---- */
let DOCTRINES = {};
const CLE_DOCTRINES = "doctrines";
const CATS = {
  principes:   {nom:"Principes",              cle: x => (x.titre||"") + " " + (x.idee||"")},
  regles:      {nom:"Règles de décision",     cle: x => (x.si||"") + " " + (x.alors||"")},
  diagnostics: {nom:"Questions de diagnostic", cle: x => x.question || ""},
  erreurs:     {nom:"Erreurs corrigées",      cle: x => x.erreur || ""},
  cas:         {nom:"Cas raisonnés",          cle: x => x.situation || ""},
  phrases:     {nom:"Phrases",                cle: x => x.phrase || ""}
};
const cleEcole = nom => String(nom || "").trim().toLowerCase();

async function chargeDoctrines(){
  const d = await Store.get(CLE_DOCTRINES);
  if(d && typeof d === "object") DOCTRINES = d;
  // Les doctrines publiées à côté de l'app (pour tes testeurs) sont récupérées seules
  try{
    const r = await fetch("./doctrines.json?t=" + Date.now(), {cache: "no-store"});
    if(r.ok){
      const p = await r.json();
      let change = false;
      Object.entries((p && p.doctrines) || {}).forEach(([k, doc]) => {
        if(doc && doc.cerveau && (!DOCTRINES[k] || (doc.maj || 0) > (DOCTRINES[k].maj || 0))){
          DOCTRINES[k] = doc; change = true;
          // le cerveau publié arrive avec ses réglages (marchés, terrains)
          if(p.ecoles && p.ecoles[k]) ECOLES[k] = Object.assign({}, ECOLES[k] || {}, p.ecoles[k]);
        }
      });
      Object.entries((p && p.ecoles) || {}).forEach(([k, e]) => { if(!ECOLES[k]){ ECOLES[k] = e; change = true; } });
      if(change){ await Store.set(CLE_DOCTRINES, DOCTRINES); await Store.set("ecoles", ECOLES); }
    }
  }catch(e){}
  habilleTesteur();
  rendDoctrines();
}
const sauveDoctrines = () => Store.set(CLE_DOCTRINES, DOCTRINES);

/* La doctrine qui convient au moment et au marché, dans un ordre stable (pour le cache) */
function doctrinePour(terrains, marche, maxChars){
  const t = [].concat(terrains || []);
  const l = Object.keys(DOCTRINES).sort().map(k => {
    const d = DOCTRINES[k], e = ECOLES[k] || {};
    if(!d || !d.cerveau || !docVisible(k)) return null;
    if(e.marches && marche && !e.marches.includes(marche)) return null;
    const terrain = !t.length || !e.terrains || e.terrains.some(x => t.includes(x));
    return {k, d, e, sc: terrain ? 2 : 1};
  }).filter(Boolean).sort((a,b) => b.sc - a.sc);
  let out = "";
  for(const x of l){
    const bloc = `### LE CERVEAU DE ${(x.e.nom || x.k).toUpperCase()}\n${x.d.cerveau}\n\n`;
    if(out.length + bloc.length > (maxChars || 70000)) break;
    out += bloc;
  }
  if(!out) return "";
  return `Tu as étudié en profondeur les coachs que suit ton élève. Ce qui suit n'est pas une liste de répliques : c'est leur façon de penser, ce qu'un élève intériorise après des mois à les suivre.
Tu raisonnes avec, comme un coach qui les a longtemps écoutés : tu lis la situation, tu reconnais ce qu'ils y verraient, et tu décides. Tu ne récites pas ce texte, tu ne le cites pas, et tu ne nommes pas ces coachs à ton élève sauf s'il le demande.
Quand les consignes de la demande te donnent un format de réponse, tu le respectes.

${out}`;
}
/* ---- la mémoire profonde ----
   Le cerveau est un résumé. Derrière, l'app garde tout ce qui a été extrait :
   des centaines de règles, de cas, d'erreurs. Au moment d'analyser, le coach
   va chercher ceux qui ressemblent le plus à la situation, comme un coach qui
   se souvient d'une revue de call précise. */
const CATS_MEMOIRE = ["cas","regles","erreurs","diagnostics","principes"];
const texteItem = (cat, x) => {
  if(cat === "cas") return `Cas — situation : ${x.situation||""} | ce qu'il y voit : ${x.lecture||""} | ce qu'il fait : ${x.action||""}${x.phrase ? " | « " + x.phrase + " »" : ""}`;
  if(cat === "regles") return `Règle — si ${x.si||""}, alors ${x.alors||""}${x.sauf ? ", sauf " + x.sauf : ""}`;
  if(cat === "erreurs") return `Erreur corrigée — ${x.erreur||""} | comment il la repère : ${x.signe||""} | à la place : ${x.correction||""}`;
  if(cat === "diagnostics") return `Question de diagnostic — « ${x.question||""} » | révèle : ${x.revele||""} | quand : ${x.quand||""}`;
  return `Principe — ${x.titre||""} : ${x.idee||""}${x.pourquoi ? " (pourquoi : " + x.pourquoi + ")" : ""}`;
};
let INDEX_MEMOIRE = null, CLE_INDEX_MEMOIRE = "";
function indexMemoire(){
  const cle = (modeTesteur() ? "t|" : "") + Object.keys(DOCTRINES).sort().map(k => k + ":" + (DOCTRINES[k].maj || 0) + ":" + Object.values(DOCTRINES[k].items || {}).reduce((s,a) => s + a.length, 0)).join("|");
  if(INDEX_MEMOIRE && cle === CLE_INDEX_MEMOIRE) return INDEX_MEMOIRE;
  const docs = [];
  Object.keys(DOCTRINES).filter(docVisible).forEach(k => CATS_MEMOIRE.forEach(cat => (DOCTRINES[k].items[cat] || []).forEach(x => {
    const t = texteItem(cat, x), mots = motsDe(t), tf = {};
    mots.forEach(m => tf[m] = (tf[m] || 0) + 1);
    docs.push({k, cat, x, t, tf, n: mots.length || 1});
  })));
  const df = {}; docs.forEach(d => Object.keys(d.tf).forEach(m => df[m] = (df[m] || 0) + 1));
  const N = docs.length || 1, idf = {};
  Object.keys(df).forEach(m => idf[m] = Math.log(1 + (N - df[m] + 0.5) / (df[m] + 0.5)));
  const moy = docs.reduce((s,d) => s + d.n, 0) / N;
  INDEX_MEMOIRE = {docs, idf, moy}; CLE_INDEX_MEMOIRE = cle;
  return INDEX_MEMOIRE;
}
function souvenirs(situation, terrains, marche, n){
  if(!Object.keys(DOCTRINES).length) return "";
  const ix = indexMemoire(); if(!ix.docs.length) return "";
  const q = [...new Set(motsDe(situation))]; if(!q.length) return "";
  const t = [].concat(terrains || []);
  const ok = k => { const e = ECOLES[k] || {}; return (!e.marches || !marche || e.marches.includes(marche)); };
  const notes = ix.docs.filter(d => ok(d.k)).map(d => {
    let sc = 0;
    q.forEach(m => { const f = d.tf[m]; if(f) sc += (ix.idf[m] || 0) * (f * 2.4) / (f + 1.4 * (0.3 + 0.7 * d.n / ix.moy)); });
    if(!sc) return null;
    const e = ECOLES[d.k] || {};
    if(t.length && e.terrains && e.terrains.some(x => t.includes(x))) sc *= 1.15;
    sc *= 1 + Math.log(1 + (d.x.poids || 1)) * 0.25;           // ce qui revient souvent chez lui pèse un peu plus
    if(d.cat === "cas") sc *= 1.2;                              // les cas sont les souvenirs les plus utiles
    return {d, sc};
  }).filter(Boolean).sort((a,b) => b.sc - a.sc);
  const pris = [];
  for(const s of notes){
    if(pris.length >= (n || 8)) break;
    if(pris.some(p => memeIdee(p.d.t, s.d.t))) continue;
    pris.push(s);
  }
  if(!pris.length) return "";
  return `\nCE QUE TU TE RAPPELLES DE TES COACHS sur des situations proches — des souvenirs précis, à utiliser seulement s'ils éclairent vraiment ce cas :\n` +
    pris.map(p => `- [${(ECOLES[p.d.k] && ECOLES[p.d.k].nom) || p.d.k}] ${p.d.t}`).join("\n") + "\n";
}

function optsDebrief(){
  return {systeme: doctrinePour([segmentCourant().terrain], (SPAR && SPAR.marche) || sparMarche), effort: "high"};
}

/* ---- lire un fichier de transcript, quel que soit son format ---- */
function nettoieSousTitresFichier(t){
  const lignes = String(t).replace(/\r/g, "").split("\n");
  const out = [];
  for(const l0 of lignes){
    const l = l0.replace(/<[^>]+>/g, "").trim();
    if(!l || /^WEBVTT|^Kind:|^Language:|^NOTE\b/.test(l)) continue;
    if(/^\d+$/.test(l)) continue;                                    // numéro de sous-titre
    if(/-->/.test(l)) continue;                                      // horodatage
    if(out.length && out[out.length-1] === l) continue;              // les sous-titres auto répètent chaque ligne
    out.push(l);
  }
  return out.join(" ").replace(/\s{2,}/g, " ");
}
async function texteDuFichier(f){
  const n = f.name.toLowerCase();
  if(/\.(vtt|srt)$/.test(n)) return nettoieSousTitresFichier(await f.text());
  if(/\.json$/.test(n)){
    try{
      const d = JSON.parse(await f.text());
      const tires = [];
      const fouille = x => {
        if(!x) return;
        if(typeof x === "string") return;
        if(Array.isArray(x)) return x.forEach(fouille);
        if(typeof x === "object"){
          ["transcript","texte","text","content","contenu","traduction"].forEach(k => { if(typeof x[k] === "string" && x[k].length > 300) tires.push(x[k]); });
          Object.values(x).forEach(v => { if(typeof v === "object") fouille(v); });
        }
      };
      fouille(d);
      return tires.join("\n\n");
    }catch(e){ return ""; }
  }
  return await readFile(f);                                          // txt, md, pdf : le lecteur de l'app
}
function decoupeTexte(t, taille){
  const out = []; let i = 0;
  while(i < t.length){
    let fin = Math.min(t.length, i + taille);
    if(fin < t.length){ const p = t.lastIndexOf(". ", fin); if(p > i + taille * 0.6) fin = p + 1; }
    out.push(t.slice(i, fin)); i = fin;
  }
  return out;
}

/* ---- passage 1 : ce qu'un morceau de contenu apprend sur la façon de penser du coach ---- */
function promptExtraction(nomCoach, titre, morceau){
  return `Tu étudies un contenu de ${nomCoach}, un coach de vente. Ce peut être un roleplay, une revue de call, une masterclass ou une interview, souvent en anglais.
Titre : ${titre}

"""${morceau}"""

Tu n'extrais pas des répliques à recopier. Tu cherches à comprendre COMMENT CE COACH PENSE : ce qu'il regarde, ce qu'il en conclut, ce qu'il fait faire, et pourquoi.

Ce que tu cherches :
- ses principes, avec la raison qu'il donne ;
- ses règles de décision : dans telle situation, il fait ceci, sauf dans tel cas ;
- ses questions de diagnostic, et ce qu'elles révèlent ;
- les erreurs qu'il corrige chez les vendeurs : comment il les repère, ce qu'il fait faire à la place ;
- les cas qu'il analyse : la situation, sa lecture, ce qu'il fait ;
- quelques phrases à dire au prospect, seulement si elles portent un mécanisme clair.

Tout en français. Ne traduis jamais mot à mot : fais passer le mécanisme, dans le français parlé d'un closer, en tutoiement. Pour les phrases, garde l'original dans "origine".
Ignore la promotion, les appels à s'abonner, les anecdotes sans enseignement. Si le morceau n'apprend rien, renvoie des listes vides.
N'invente rien qui ne soit pas dans le texte.

Réponds uniquement avec ce JSON, sans markdown, concis :
{"marche":"b2c|b2b|les deux",
 "principes":[{"titre":"court","idee":"le principe","pourquoi":"sa raison","quand":"quand il s applique"}],
 "regles":[{"si":"la situation","alors":"ce qu il fait","sauf":"l exception, ou null"}],
 "diagnostics":[{"question":"la question, en francais parle","revele":"ce qu elle revele","quand":"quand la poser"}],
 "erreurs":[{"erreur":"l erreur du vendeur","signe":"comment il la repere","correction":"ce qu il fait faire a la place"}],
 "cas":[{"situation":"la situation","lecture":"ce qu il y voit","action":"ce qu il fait ou fait faire","phrase":"la phrase cle, ou null"}],
 "phrases":[{"phrase":"en francais","situation":"quand la dire","mecanisme":"le levier","origine":"la phrase d origine"}]}
Au plus 6 éléments par liste, les plus importants.`;
}

/* ---- passage 2 : le cerveau, écrit à partir de tout ce qui a été extrait ---- */
function promptCerveau(nomCoach, doc){
  const bloc = (cat, max) => {
    const l = (doc.items[cat] || []).slice().sort((a,b) => (b.poids||1) - (a.poids||1));
    let s = "", n = 0;
    for(const x of l){
      const ligne = "- [vu " + (x.poids||1) + "x] " + Object.entries(x).filter(([k]) => !["poids","sources"].includes(k) && x[k]).map(([k,v]) => k + " : " + v).join(" | ") + "\n";
      if(s.length + ligne.length > max) break;
      s += ligne; n++;
    }
    return `## ${CATS[cat].nom} (${n} sur ${l.length})\n${s}`;
  };
  return `Tu as étudié ${doc.sources.length} contenus de ${nomCoach} : roleplays, revues de calls, masterclass. Voici, regroupé, tout ce que tu en as tiré. « vu Nx » indique combien de fois un élément revient : ce qui revient souvent est central chez lui.

${bloc("principes", 14000)}
${bloc("regles", 12000)}
${bloc("diagnostics", 8000)}
${bloc("erreurs", 10000)}
${bloc("cas", 10000)}

Écris maintenant LE CERVEAU DE ${nomCoach.toUpperCase()} : ce qu'un élève qui l'a suivi pendant des mois a intériorisé. Ce texte sera donné à un coach IA pour qu'il raisonne comme lui. Il doit permettre de JUGER une situation qu'on n'a jamais vue, pas seulement de réciter.

Dans cet ordre :
1. Sa vision du métier, en quelques phrases.
2. Comment il lit un call : ce qu'il regarde, dans quel ordre, ce qui l'alerte.
3. Ses principes, chacun avec son pourquoi.
4. Ses règles de décision : si…, alors…, sauf…
5. Ses questions de diagnostic, et ce qu'elles révèlent.
6. Les erreurs qu'il corrige le plus : comment il les repère, ce qu'il fait faire à la place.
7. Ce qu'il ne fait jamais, et ce qu'il interdit à ses élèves.
8. Trois cas typiques, raisonnés comme il le ferait.
9. Sa façon de reprendre un élève : ton, rythme, expressions.
10. Ses limites : les situations où sa méthode s'applique mal, ou ce qu'il ne traite pas.

Dense, concret, sans remplissage. En français. Au plus 2 500 mots. Garde ce qui revient souvent ; laisse de côté ce qui n'apparaît qu'une fois sans être important. N'invente rien qui ne soit pas dans le matériau.
Réponds avec le texte seul, en titres simples, sans JSON.`;
}

/* Deux éléments disent la même chose : mêmes mots porteurs, ou presque.
   Les éléments courts (deux ou trois mots) doivent être identiques. */
function memeIdee(a, b){
  const ma = motsDe(a), mb = motsDe(b);
  if(ma.join(" ") === mb.join(" ")) return ma.length > 0;
  const sa = new Set(ma), sb = new Set(mb);
  if(Math.min(sa.size, sb.size) < 3){
    return sa.size === sb.size && [...sa].every(w => sb.has(w));
  }
  return procheDe(sa, sb);
}

function fusionne(doc, extrait, source){
  Object.keys(CATS).forEach(cat => {
    doc.items[cat] = doc.items[cat] || [];
    (extrait[cat] || []).forEach(x => {
      if(!x || typeof x !== "object") return;
      const cle = CATS[cat].cle(x);
      if(!cle.trim()) return;
      const deja = doc.items[cat].find(y => memeIdee(CATS[cat].cle(y), cle));
      if(deja){
        deja.poids = (deja.poids || 1) + 1;
        if(!(deja.sources || []).includes(source)) (deja.sources = deja.sources || []).push(source);
      } else {
        doc.items[cat].push(Object.assign({}, x, {poids: 1, sources: [source]}));
      }
    });
    if(doc.items[cat].length > 500) doc.items[cat] = doc.items[cat].sort((a,b) => (b.poids||1) - (a.poids||1)).slice(0, 500);
  });
  const m = extrait.marche;
  if(m) doc.marches[m] = (doc.marches[m] || 0) + 1;
}

/* Les phrases rejoignent ta base, pour que les « à dire » en profitent aussi */
function versesPhrases(doc, k){
  let n = 0;
  (doc.items.phrases || []).forEach(x => {
    if(!x.phrase || FICHES.some(f => f.phrase === x.phrase)) return;
    FICHES.push({objection:"AUTRE", label: x.situation || "Phrase", type:"DIAGNOSTIC", situation: x.situation || "",
                 phrase: x.phrase, pourquoi: x.mecanisme || "", origine: x.origine || undefined,
                 source: (ECOLES[k] && ECOLES[k].nom || k) + " — doctrine", ecole: k, valide: 0});
    n++;
  });
  if(n) saveKb();
  return n;
}

/* ---- l'écran, dans « Ma méthode » ---- */
let DOC_FICHIERS = [], DOC_STOP = false;
function blocDoctrineHtml(){
  return `<div class="block" id="doctrineBloc" style="border-left:2px solid var(--amber);margin-top:18px">
    <h3>Le cerveau de tes coachs</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Dépose les transcripts complets d'un coach : vidéos, roleplays, revues de calls. L'app n'en tire plus des répliques, mais sa façon de penser : principes, règles de décision, questions de diagnostic, erreurs qu'il corrige, cas qu'il analyse. Ce cerveau est ensuite donné au coach à chaque débrief, à chaque lecture de call et pendant le roleplay.</p>
    <p id="docServeur" style="font-size:12.5px;margin-bottom:12px"></p>
    <div id="doctrineListe"></div>
    <label style="display:block;font-size:12.5px;color:var(--muted);margin:14px 0 6px">Le coach</label>
    <select id="docCoach" style="width:100%;background:#0E1216;border:1px solid var(--line);border-radius:9px;padding:10px 12px;color:var(--ink)"></select>
    <input type="text" id="docCoachNom" placeholder="Nom du nouveau coach" style="display:none;width:100%;background:#0E1216;border:1px solid var(--line);border-radius:9px;padding:10px 12px;color:var(--ink);margin-top:8px">
    <div id="docDrop" style="border:1.5px dashed var(--line);border-radius:11px;padding:20px;text-align:center;cursor:pointer;margin-top:12px">
      <strong style="font-size:15px">Dépose ses transcripts ici</strong><br>
      <span style="font-size:12.5px;color:var(--muted)">Le dossier du scraper en entier, son zip, ou des fichiers TXT, VTT, SRT, PDF, JSON</span>
      <input type="file" id="docFiles" multiple hidden>
      <input type="file" id="docDossier" webkitdirectory directory multiple hidden>
    </div>
    <div class="row" style="margin-top:8px"><button class="pill" id="btnDocDossier" style="font-size:12px;padding:6px 12px">Choisir un dossier entier</button></div>
    <p id="docEstim" style="font-size:13px;margin-top:10px"></p>
    <div class="row" style="margin-top:10px">
      <button class="pill" id="btnDocGo" style="border-color:var(--amber);color:var(--amber)">Construire le cerveau</button>
      <button class="pill" id="btnDocStop">Arrêter</button>
      <button class="pill" id="btnDocExport">Exporter pour mes testeurs</button>
      <button class="pill" id="btnDocImport">Importer</button>
      <input type="file" id="docImportFile" accept=".json" hidden>
    </div>
    <div class="track" style="margin-top:12px"><div id="docFill" style="height:100%;width:0%;background:var(--amber);transition:width .3s"></div></div>
    <p id="docEtat" style="font-size:13px;margin-top:8px"></p>
  </div>`;
}

function rendDoctrines(){
  const l = $("doctrineListe"); if(!l) return;
  const ks = Object.keys(DOCTRINES).sort();
  l.innerHTML = ks.length ? ks.map(k => {
    const d = DOCTRINES[k], nb = Object.values(d.items || {}).reduce((s,a) => s + a.length, 0);
    return `<div style="border-bottom:1px solid var(--line);padding:9px 0">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">
        <span><b>${esc((ECOLES[k] && ECOLES[k].nom) || k)}</b> <span style="font-size:12px;color:var(--muted)">${(d.sources||[]).length} contenus · ${nb} éléments · ${d.cerveau ? Math.round(d.cerveau.length/1000) + " k caractères de cerveau" : "cerveau pas encore écrit"}</span></span>
        <span>
          <button class="pill" data-doc-lire="${esc(k)}" style="font-size:11.5px;padding:5px 11px">Lire</button>
          <button class="pill" data-doc-reecrire="${esc(k)}" style="font-size:11.5px;padding:5px 11px">Réécrire le cerveau</button>
          <button class="pill" data-doc-suppr="${esc(k)}" style="font-size:11.5px;padding:5px 11px">Supprimer</button>
        </span>
      </div>
      <pre id="docTexte-${esc(k)}" style="display:none;white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.55;margin-top:10px;max-height:420px;overflow:auto">${esc(d.cerveau || "")}</pre>
    </div>`;
  }).join("") : '<p style="font-size:13px;color:var(--muted)">Aucun cerveau construit pour l\'instant.</p>';
  l.querySelectorAll("[data-doc-lire]").forEach(b => b.onclick = () => {
    const p = document.getElementById("docTexte-" + b.dataset.docLire); if(p) p.style.display = p.style.display === "none" ? "block" : "none";
  });
  l.querySelectorAll("[data-doc-reecrire]").forEach(b => b.onclick = () => ecritCerveau(b.dataset.docReecrire));
  l.querySelectorAll("[data-doc-suppr]").forEach(b => b.onclick = async () => {
    if(!confirm("Supprimer le cerveau de " + b.dataset.docSuppr + " ? Les fiches déjà versées dans ta base restent.")) return;
    delete DOCTRINES[b.dataset.docSuppr]; await sauveDoctrines(); rendDoctrines();
  });
  const s = $("docCoach");
  if(s){
    const v = s.value;
    s.innerHTML = Object.entries(ECOLES).filter(([k]) => k !== "moi").map(([k,e]) => `<option value="${esc(k)}">${esc(e.nom || k)}</option>`).join("")
      + '<option value="__nouveau">+ Un nouveau coach</option>';
    if(v) s.value = v;
  }
}

async function estimeDoc(){
  const el = $("docEstim"); if(!el) return;
  if(!DOC_FICHIERS.length){ el.textContent = ""; return; }
  let car = 0;
  for(const f of DOC_FICHIERS) car += f.texte.length;
  const morceaux = DOC_FICHIERS.reduce((s,f) => s + Math.ceil(f.texte.length / 40000), 0);
  const inf = parLeServeur() ? await infoServeur() : {systeme: true, modeles: [MODELE_COACH]};
  const nouveau = !parLeServeur() || (inf.systeme && inf.modeles.includes(MODELE_COACH));
  const pe = nouveau ? 2 : 3, ps = nouveau ? 10 : 15;
  const entree = car / 3.6 + morceaux * 1500 + 30000, sortie = morceaux * 3500 + 8000;
  const cout = (entree * pe + sortie * ps) / 1e6;
  el.innerHTML = `<b>${DOC_FICHIERS.length}</b> fichiers lisibles, ${Math.round(car/1000)} k caractères, ${morceaux} morceaux à étudier.
    Coût estimé : <b>${cout.toFixed(2).replace(".", ",")} $</b>, à payer une seule fois. Durée : environ ${Math.max(2, Math.round(morceaux * 0.6 / 3))} minutes. Tu peux arrêter et reprendre : rien n'est perdu.`;
}

/* Le dossier du scraper, son zip, ou des fichiers en vrac : tout est accepté.
   Les fichiers techniques sont ignorés, et une même vidéo n'est lue qu'une fois. */
const FICHIERS_IGNORES = /^(database\.json|index\.csv|errors\.log|requirements\.txt|readme\.(md|txt)|lisezmoi\.txt|.*\.(bat|py|ps1|csv|log|png|jpg|html|js))$/i;
const idVideo = nom => { const m = String(nom).match(/\[([\w-]{11})\]/) || String(nom).match(/(?:^|[\\/])([\w-]{11})(?:\.[a-z]{2,3})?\.(?:vtt|srt)$/i); return m ? m[1] : null; };
async function deplieZip(f){
  await loadZipLib();
  const zip = await JSZip.loadAsync(f);
  const out = [];
  for(const n of Object.keys(zip.files)){
    const e = zip.files[n]; if(e.dir) continue;
    const court = n.split("/").pop();
    if(/\.zip$/i.test(court)){ try{ out.push(...await deplieZip(await e.async("blob"))); }catch(_){} continue; }
    if(!/\.(txt|vtt|srt|json|md)$/i.test(court)) continue;
    out.push({name: court, chemin: n, text: () => e.async("string")});
  }
  return out;
}
async function ajouteFichiersDoc(liste){
  const deja = new Set(DOC_FICHIERS.map(f => f.nom));
  const videos = new Set(DOC_FICHIERS.map(f => f.video).filter(Boolean));
  let tous = [];
  for(const f of [...liste]){
    if(/\.zip$/i.test(f.name)){
      $("docEtat").innerHTML = '<span style="color:var(--amber)">J\'ouvre ' + esc(f.name) + '…</span>';
      try{ tous.push(...await deplieZip(f)); }catch(e){ $("docEtat").innerHTML = '<span style="color:var(--clay)">Zip illisible : ' + esc(e.message) + '</span>'; }
    } else tous.push(f);
  }
  // les .txt du scraper passent avant les .vtt bruts de la même vidéo
  const nbDeposes = tous.length;
  tous = tous.filter(f => !FICHIERS_IGNORES.test(f.name) && !/[\\/]\.venv[\\/]|[\\/]_tmp[\\/]/.test(f.chemin || f.webkitRelativePath || ""))
             .sort((a,b) => (/\.txt$/i.test(b.name) ? 1 : 0) - (/\.txt$/i.test(a.name) ? 1 : 0));
  let ignores = 0;
  for(const f of tous){
    const v = idVideo(f.name);
    if(deja.has(f.name) || (v && videos.has(v))){ ignores++; continue; }
    try{
      const t = (await texteDuFichier(f) || "").trim();
      if(t.replace(/\s/g, "").length > 800){
        DOC_FICHIERS.push({nom: f.name, texte: t, video: v});
        deja.add(f.name); if(v) videos.add(v);
      } else ignores++;
    }catch(e){ ignores++; }
  }
  await estimeDoc();
  ignores += nbDeposes - tous.length;
  if(ignores) $("docEtat").innerHTML = '<span style="color:var(--muted)">' + ignores + ' fichier' + (ignores > 1 ? "s" : "") + ' ignoré' + (ignores > 1 ? "s" : "") + ' : doublons, fichiers techniques ou trop courts.</span>';
}

/* Un dossier glissé dans la zone : on descend dans tous ses sous-dossiers */
async function fichiersDuDepot(dt){
  const items = [...(dt.items || [])].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if(!items.length || items.every(e => e.isFile)) return [...dt.files];
  const out = [];
  const lis = entree => new Promise(res => {
    if(entree.isFile){ entree.file(f => { try{ Object.defineProperty(f, "chemin", {value: entree.fullPath}); }catch(_){} out.push(f); res(); }, () => res()); return; }
    if(/^(\.venv|_tmp|node_modules)$/.test(entree.name)) return res();
    const r = entree.createReader(), toutes = [];
    const lot = () => r.readEntries(async es => { if(!es.length){ for(const e of toutes) await lis(e); res(); } else { toutes.push(...es); lot(); } }, () => res());
    lot();
  });
  for(const e of items) await lis(e);
  return out;
}

async function ecritCerveau(k){
  const d = DOCTRINES[k]; if(!d) return;
  const nom = (ECOLES[k] && ECOLES[k].nom) || k;
  $("docEtat").innerHTML = '<span style="color:var(--amber)">J\'écris le cerveau de ' + esc(nom) + ' à partir de tout ce qui a été extrait…</span>';
  try{
    const txt = await appelCerveau(promptCerveau(nom, d), {max: 8000, effort: "high"});
    d.cerveau = txt.trim(); d.maj = Date.now();
    await sauveDoctrines(); rendDoctrines();
    const n = versesPhrases(d, k);
    $("docEtat").innerHTML = '<span style="color:var(--sage)">Le cerveau de ' + esc(nom) + ' est prêt' + (n ? ", et " + n + " nouvelles phrases ont rejoint ta base" : "") + '. Clique sur « Lire » pour le relire avant de t\'en servir.</span>';
  }catch(e){
    $("docEtat").innerHTML = '<span style="color:var(--clay)">Écriture du cerveau impossible : ' + esc(e.message) + '. Les extraits sont gardés : réessaie avec « Réécrire le cerveau ».</span>';
  }
}

async function construisDoctrine(){
  if(!DOC_FICHIERS.length) return toast("Dépose d'abord des transcripts");
  let k = $("docCoach").value;
  if(k === "__nouveau"){
    const nom = $("docCoachNom").value.trim();
    if(!nom) return toast("Donne un nom au coach");
    k = cleEcole(nom);
    if(!ECOLES[k]){ ECOLES[k] = {nom, terrains:["cadrage","decouverte","objection","closing"], note:"cerveau construit depuis ses contenus"}; await Store.set("ecoles", ECOLES); }
  }
  const nom = (ECOLES[k] && ECOLES[k].nom) || k;
  const d = DOCTRINES[k] = DOCTRINES[k] || {items:{}, sources:[], faits:[], marches:{}, cerveau:"", maj:0};
  d.faits = d.faits || []; d.marches = d.marches || {}; d.items = d.items || {};
  const travail = [];
  DOC_FICHIERS.forEach(f => decoupeTexte(f.texte, 40000).forEach((m, i, a) => travail.push({titre: f.nom + (a.length > 1 ? " (partie " + (i+1) + ")" : ""), source: f.nom, texte: m})));
  const aFaire = travail.filter(t => !d.faits.includes(hashTxt(t.texte)));
  if(!aFaire.length && d.cerveau){
    // tout est déjà dans le cerveau : on ne le réécrit pas, rien à payer
    DOC_FICHIERS = []; estimeDoc();
    $("docEtat").innerHTML = '<span style="color:var(--sage)">Tout ce que tu as déposé est déjà dans le cerveau de ' + esc(nom) + '. Rien à refaire, rien à payer.</span>';
    return;
  }
  DOC_STOP = false;
  $("btnDocGo").disabled = true;
  let ok = 0, ko = 0, derniere = "", suivant = 0, fini = 0, casse = false;
  // trois morceaux étudiés en même temps : trois fois plus vite
  const ouvrier = async () => {
    while(!DOC_STOP && !casse && suivant < aFaire.length){
      const t = aFaire[suivant++];
      $("docEtat").innerHTML = '<span style="color:var(--amber)">' + fini + " / " + aFaire.length + " étudiés — en cours : " + esc(t.titre) + "</span>";
      try{
        const ex = parseModelJson(await appelCerveau(promptExtraction(nom, t.titre, t.texte), {max: 4000, effort: "medium"}));
        fusionne(d, ex, t.source);
        d.faits.push(hashTxt(t.texte));
        if(!d.sources.includes(t.source)) d.sources.push(t.source);
        ok++;
        await sauveDoctrines();               // on peut s'arrêter et reprendre sans rien perdre
      }catch(e){
        ko++; derniere = e.message;
        if(e.quota || (ko >= 3 && ok === 0)) casse = true;
      }
      fini++;
      $("docFill").style.width = Math.round(fini / aFaire.length * 100) + "%";
    }
  };
  await Promise.all([ouvrier(), ouvrier(), ouvrier()]);
  $("docFill").style.width = "100%";
  $("btnDocGo").disabled = false;
  rendDoctrines();
  if(ok === 0 && aFaire.length){
    $("docEtat").innerHTML = '<span style="color:var(--clay)">Rien n\'a pu être étudié. Dernière erreur : ' + esc(derniere) + '</span>';
    return;
  }
  // le coach est-il plutôt B2C, B2B, ou les deux ?
  const mv = d.marches, b2b = (mv.b2b || 0) + (mv["les deux"] || 0), b2c = (mv.b2c || 0) + (mv["les deux"] || 0);
  if(ECOLES[k] && !ECOLES[k].marches && (b2b || b2c)){
    ECOLES[k].marches = b2b > b2c * 2 ? ["b2b"] : b2c > b2b * 2 ? ["b2c"] : ["b2c","b2b"];
    await Store.set("ecoles", ECOLES);
  }
  if(ko) $("docEtat").innerHTML = '<span style="color:var(--amber)">' + ok + " morceaux étudiés, " + ko + " en échec (" + esc(derniere) + "). J'écris le cerveau avec ce qui a été lu.</span>";
  if(DOC_STOP){ $("docEtat").innerHTML = '<span style="color:var(--amber)">Arrêté. Ce qui a été lu est gardé : relance pour continuer, puis « Réécrire le cerveau ».</span>'; return; }
  DOC_FICHIERS = []; estimeDoc();
  await ecritCerveau(k);
}

function exporteDoctrines(){
  const ecoles = {};
  Object.keys(DOCTRINES).forEach(k => { if(ECOLES[k]) ecoles[k] = ECOLES[k]; });
  // Pour tes testeurs : le cerveau, et la mémoire profonde allégée (les 300 éléments
  // les plus fréquents par catégorie). Les phrases restent chez toi, dans ta base.
  const legeres = {};
  Object.entries(DOCTRINES).forEach(([k,d]) => {
    const items = {};
    CATS_MEMOIRE.forEach(cat => {
      items[cat] = (d.items[cat] || []).slice().sort((a,b) => (b.poids||1) - (a.poids||1)).slice(0, 300)
        .map(x => { const y = Object.assign({}, x); delete y.sources; return y; });
    });
    legeres[k] = {cerveau: d.cerveau, maj: d.maj, sources: d.sources, items};
  });
  const b = new Blob([JSON.stringify({version:1, date:new Date().toISOString(), doctrines: legeres, ecoles}, null, 1)], {type:"application/json"});
  const a = document.createElement("a"), u = URL.createObjectURL(b);
  a.href = u; a.download = "doctrines.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
  toast("Mets doctrines.json sur GitHub, à côté de l'app");
}

async function installeEcranDoctrine(){
  const ancre = $("keyBox");
  if(!ancre || $("doctrineBloc")) return;
  const d = document.createElement("div"); d.innerHTML = blocDoctrineHtml();
  ancre.parentNode.insertBefore(d.firstElementChild, ancre.nextSibling);
  $("docCoach").onchange = () => { $("docCoachNom").style.display = $("docCoach").value === "__nouveau" ? "block" : "none"; };
  $("docDrop").onclick = () => $("docFiles").click();
  $("docDrop").ondragover = e => { e.preventDefault(); $("docDrop").style.borderColor = "var(--amber)"; };
  $("docDrop").ondragleave = () => $("docDrop").style.borderColor = "var(--line)";
  $("docDrop").ondrop = async e => {
    e.preventDefault(); $("docDrop").style.borderColor = "var(--line)";
    $("docEtat").innerHTML = '<span style="color:var(--amber)">Je lis le contenu déposé…</span>';
    ajouteFichiersDoc(await fichiersDuDepot(e.dataTransfer));
  };
  $("docFiles").onchange = e => ajouteFichiersDoc(e.target.files);
  $("btnDocDossier").onclick = () => $("docDossier").click();
  $("docDossier").onchange = e => ajouteFichiersDoc([...e.target.files].map(f => { try{ Object.defineProperty(f, "chemin", {value: f.webkitRelativePath}); }catch(_){} return f; }));
  $("btnDocGo").onclick = construisDoctrine;
  $("btnDocStop").onclick = () => { DOC_STOP = true; };
  $("btnDocExport").onclick = exporteDoctrines;
  $("btnDocImport").onclick = () => $("docImportFile").click();
  $("docImportFile").onchange = async e => {
    try{
      const p = JSON.parse(await e.target.files[0].text());
      Object.entries(p.doctrines || {}).forEach(([k, doc]) => { if(doc && doc.cerveau) DOCTRINES[k] = Object.assign({items:{}, sources:[], faits:[], marches:{}}, DOCTRINES[k] || {}, doc); });
      Object.entries(p.ecoles || {}).forEach(([k, ec]) => { ECOLES[k] = Object.assign({}, ECOLES[k] || {}, ec); });
      await sauveDoctrines(); await Store.set("ecoles", ECOLES); rendDoctrines(); toast("Cerveaux importés");
    }catch(_){ toast("Fichier illisible"); }
  };
  rendDoctrines();
  majDocServeur();
  const kbOrigine = $("btnKb").onclick;
  $("btnKb").onclick = function(){ const r = kbOrigine.apply(this, arguments); rendDoctrines(); majDocServeur(); return r; };
}
async function majDocServeur(){
  const ds = $("docServeur"); if(!ds) return;
  await pretOuTantPis();
  if(parLeServeur()){
    const inf = await infoServeur();
    ds.innerHTML = (inf.systeme && inf.modeles.includes(MODELE_COACH))
      ? '<span style="color:var(--sage)">Serveur à jour : cerveau Sonnet 5.5, doctrine mise en cache.</span>'
      : '<span style="color:var(--clay)">Ton serveur est l\'ancienne version : le cerveau tourne encore sur Sonnet 4.6 et la doctrine n\'est pas mise en cache, ce qui coûte plus cher. Installe la mise à jour du serveur.</span>';
  } else ds.innerHTML = API_KEY ? '<span style="color:var(--sage)">Clé directe : cerveau Sonnet 5.5, doctrine mise en cache.</span>'
                                : '<span style="color:var(--muted)">Mets ton code d\'accès ou ta clé plus haut pour construire un cerveau.</span>';
}
installeEcranDoctrine();
chargeDoctrines();

const renderProgOrigine = renderProg;
renderProg = function(){ renderProgOrigine(); rendCalibration(); };

/* =====================================================================
   6. LE COPILOTE EN DIRECT : DEUX OREILLES
   Avant, l'app n'écoutait que le micro : avec un casque, elle n'entendait
   jamais le prospect, et elle devinait qui parlait. Maintenant :
   - le son de l'appel (onglet Meet, ou écran entier pour Zoom) = le prospect,
     transcrit par le serveur ;
   - ton micro = toi, transcrit par Chrome.
   Plus besoin de bouton MOI / PROSPECT. Et une nouvelle phrase n'annule plus
   l'analyse en cours : la carte avance au lieu de rester figée.
   ===================================================================== */
(function deuxOreilles(){
// si la page n'a pas le moteur du direct (autre version de l'app), on ne touche à rien
if(typeof CONSIGNES !== "function" || typeof lancerAnalyse !== "function" || typeof nouvellePhrase !== "function" || !$("btnStart") || !$("btnEnd")) return;
const OREILLE = {flux:null, ctx:null, proc:null, actif:false, seg:null, preroll:[], silence:0, fond:0,
                 file:Promise.resolve(), num:0, envoyes:0, erreurs:0, derniereErreur:""};
const CLE_OPENAI = "woidih_cle_openai";
const HALLU = /(sous-titr|merci d'avoir regard|abonnez-vous|amara\.org|transcription réalisée|♪)/i;

function ajouteAideDemarrage(){
  const b = $("btnStart"); if(!b || $("aideDeuxOreilles")) return;
  const p = document.createElement("p");
  p.id = "aideDeuxOreilles";
  p.style.cssText = "font-size:12.5px;color:var(--muted);margin-top:8px;line-height:1.5";
  p.innerHTML = "Au démarrage, Chrome te demande quoi partager, pour que le copilote entende ton prospect :<br>" +
    "· <b>Google Meet</b> : choisis l'onglet du call et laisse <b>« Partager l'audio de l'onglet »</b> coché.<br>" +
    "· <b>Zoom</b> (application) : choisis <b>« Écran entier »</b> et coche <b>« Partager l'audio du système »</b>.<br>" +
    "Mets un casque : ton micro n'entendra que toi.";
  b.insertAdjacentElement("afterend", p);
}
ajouteAideDemarrage();

/* --- le son du prospect : on découpe ses prises de parole --- */
function versWav16k(morceaux, taux){
  const n = morceaux.reduce((s,a) => s + a.length, 0);
  const tout = new Float32Array(n); let o = 0;
  morceaux.forEach(a => { tout.set(a, o); o += a.length; });
  const pas = taux / 16000, m = Math.floor(n / pas);
  const buf = new ArrayBuffer(44 + m * 2), v = new DataView(buf);
  const ecrit = (p, s) => { for(let i = 0; i < s.length; i++) v.setUint8(p + i, s.charCodeAt(i)); };
  ecrit(0, "RIFF"); v.setUint32(4, 36 + m * 2, true); ecrit(8, "WAVE"); ecrit(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ecrit(36, "data"); v.setUint32(40, m * 2, true);
  for(let i = 0; i < m; i++){
    // moyenne sur la fenêtre : un ré-échantillonnage simple, suffisant pour la voix
    const a = Math.floor(i * pas), b = Math.min(n, Math.floor((i + 1) * pas));
    let s = 0; for(let k = a; k < b; k++) s += tout[k];
    const x = Math.max(-1, Math.min(1, s / Math.max(1, b - a)));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7FFF, true);
  }
  return new Uint8Array(buf);
}
function enBase64(octets){
  let s = ""; const pas = 0x8000;
  for(let i = 0; i < octets.length; i += pas) s += String.fromCharCode.apply(null, octets.subarray(i, i + pas));
  return btoa(s);
}

async function transcrit(octets){
  const contexte = "Appel de vente en français." + (S.domaine ? " Sujet : " + S.domaine + "." : "");
  if(parLeServeur()){
    const r = await fetch(srvCopilote() + "/api/transcrire", {
      method: "POST", headers: {"Content-Type": "application/json", "x-code": codeAcces()},
      body: JSON.stringify({audio: enBase64(octets), langue: "fr", contexte})
    });
    const d = await r.json().catch(() => ({}));
    if(r.status === 402){ const e = new Error(d.erreur || "Quota atteint."); e.quota = true; throw e; }
    if(!r.ok) throw new Error(d.erreur || ("transcription : erreur " + r.status));
    return d.texte || "";
  }
  let cle = ""; try{ cle = localStorage.getItem(CLE_OPENAI) || ""; }catch(_){}
  if(!cle) throw new Error("il manque la clé de transcription");
  const fd = new FormData();
  fd.append("file", new Blob([octets], {type: "audio/wav"}), "prospect.wav");
  fd.append("model", "gpt-4o-mini-transcribe");
  fd.append("language", "fr");
  fd.append("prompt", contexte);
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {method: "POST", headers: {Authorization: "Bearer " + cle}, body: fd});
  const d = await r.json().catch(() => ({}));
  if(!r.ok) throw new Error((d.error && d.error.message) || ("transcription : erreur " + r.status));
  return d.text || "";
}

function envoieSegment(morceaux, taux){
  const duree = morceaux.reduce((s,a) => s + a.length, 0) / taux;
  if(duree < 0.45) return;                                   // un bruit, pas une phrase
  const octets = versWav16k(morceaux, taux);
  const promesse = transcrit(octets).catch(e => { OREILLE.erreurs++; OREILLE.derniereErreur = e.message; ECOUTE.erreur = "prospect non transcrit : " + e.message; return ""; });
  OREILLE.envoyes++;
  // les phrases du prospect arrivent dans l'ordre où il les a dites
  OREILLE.file = OREILLE.file.then(() => promesse).then(t => {
    t = String(t || "").trim();
    if(!S.running || !t || t.length < 2 || HALLU.test(t)) return;
    ECOUTE.erreur = "";
    dit("PROSPECT", t);
  });
}

function ecouteLAppel(flux){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  try{ ctx.resume(); }catch(_){}
  const src = ctx.createMediaStreamSource(new MediaStream(flux.getAudioTracks()));
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const muet = ctx.createGain(); muet.gain.value = 0;         // on écoute sans rejouer le son
  src.connect(proc); proc.connect(muet); muet.connect(ctx.destination);
  const taux = ctx.sampleRate, trame = 4096 / taux;
  Object.assign(OREILLE, {flux, ctx, proc, actif: true, seg: null, preroll: [], silence: 0, fond: 0.002});
  proc.onaudioprocess = e => {
    if(!S.running){ arreteOreille(); return; }
    const x = new Float32Array(e.inputBuffer.getChannelData(0));
    let s = 0; for(let i = 0; i < x.length; i++) s += x[i] * x[i];
    const rms = Math.sqrt(s / x.length);
    const parle = rms > Math.max(0.01, OREILLE.fond * 3.5);
    if(!parle) OREILLE.fond = OREILLE.fond * 0.95 + rms * 0.05;   // le bruit de fond, appris en continu
    if(OREILLE.seg){
      OREILLE.seg.push(x);
      if(parle){ OREILLE.silence = 0; S.lastSpeech = Date.now(); }
      else OREILLE.silence += trame;
      const duree = OREILLE.seg.length * trame;
      // fin de sa prise de parole : 0,7 s de silence ; ou 12 s d'affilée, pour ne pas attendre la fin d'un monologue
      if(OREILLE.silence >= 0.7 || duree >= 12){
        const garde = OREILLE.silence >= 0.7 ? OREILLE.seg.slice(0, OREILLE.seg.length - Math.floor(0.5 / trame)) : OREILLE.seg;
        envoieSegment(garde, taux);
        OREILLE.seg = null; OREILLE.silence = 0;
      }
    } else if(parle){
      OREILLE.seg = OREILLE.preroll.slice(); OREILLE.seg.push(x);   // on garde le début du mot
      OREILLE.silence = 0; S.lastSpeech = Date.now();
      try{ etatEcoute("Le prospect parle…"); }catch(_){}
    } else {
      OREILLE.preroll.push(x); if(OREILLE.preroll.length > 4) OREILLE.preroll.shift();
    }
  };
  flux.getTracks().forEach(t => t.onended = () => {
    if(!S.running) return;
    ECOUTE.erreur = "partage du son de l'appel arrêté : le copilote n'entend plus le prospect";
    try{ etatEcoute(ECOUTE.erreur, "err"); }catch(_){}
  });
}
function arreteOreille(){
  if(!OREILLE.actif) return;
  OREILLE.actif = false;
  try{ OREILLE.proc.onaudioprocess = null; OREILLE.proc.disconnect(); }catch(_){}
  try{ OREILLE.ctx.close(); }catch(_){}
  try{ OREILLE.flux.getTracks().forEach(t => t.stop()); }catch(_){}
  OREILLE.flux = null; OREILLE.seg = null;
}

/* --- chaque phrase, avec la bonne étiquette --- */
function memeTexte(a, b){
  const ma = motsDe(a), mb = new Set(motsDe(b));
  if(ma.length < 3) return false;
  return ma.filter(w => mb.has(w)).length / ma.length >= 0.6;
}
function dit(qui, txt){
  const maintenant = (Date.now() - S.t0) / 1000;
  if(qui === "PROSPECT"){
    // sans casque, ton micro a pu capter sa voix : on retire le doublon rangé à ton nom
    for(let i = S.transcript.length - 1; i >= 0 && maintenant - S.transcript[i].t < 15; i--){
      const l = S.transcript[i];
      if(l.qui === "CLOSER" && memeTexte(l.text, txt)){
        S.transcript.splice(i, 1);
        const lignes = [...document.querySelectorAll("#log .line.moi")];
        const el = lignes.reverse().find(d => d.textContent.endsWith(l.text)); if(el) el.remove();
        break;
      }
    }
  } else if(S.transcript.some(l => l.qui === "PROSPECT" && maintenant - l.t < 10 && memeTexte(txt, l.text))){
    return;                                                   // c'est l'écho du prospect, pas toi
  }
  S.manuelRecent = false;
  nouvellePhrase(txt, {qui, surete: 1});
}

/* --- le démarrage --- */
const demarrageOrigine = $("btnStart").onclick;
$("btnStart").onclick = async function(){
  let flux = null;
  if(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia){
    try{
      // en premier : Chrome n'ouvre ce choix que juste après ton clic
      flux = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false},
        systemAudio: "include", selfBrowserSurface: "exclude"
      });
    }catch(_){ flux = null; }
    if(flux && !flux.getAudioTracks().length){
      flux.getTracks().forEach(t => t.stop()); flux = null;
      alert("Le son n'a pas été partagé.\n\nRecommence et coche « Partager l'audio de l'onglet » (Meet) ou « Partager l'audio du système » (Zoom, écran entier).\n\nSans ça, le copilote n'entendra que toi.");
    }
  }
  if(!flux){
    if(!confirm("Démarrer quand même sans le son de l'appel ?\n\nLe copilote n'entendra que ton micro, comme avant.")) return;
    return demarrageOrigine.apply(this, arguments);
  }
  if(!parLeServeur()){
    let cle = ""; try{ cle = localStorage.getItem(CLE_OPENAI) || ""; }catch(_){}
    if(!cle){
      cle = (prompt("Pour transcrire ton prospect sans passer par ton serveur, colle ta clé OpenAI (elle reste dans ce navigateur).\n\nSinon, annule et mets ton code d'accès dans Ma méthode.") || "").trim();
      if(!cle){ flux.getTracks().forEach(t => t.stop()); return; }
      try{ localStorage.setItem(CLE_OPENAI, cle); }catch(_){}
    }
  }
  await pretOuTantPis();
  if(!API_KEY && !window.storage && !parLeServeur()){
    flux.getTracks().forEach(t => t.stop());
    return alert("Il manque ta clé API ou ton code d'accès.\n\nVa dans « Ma méthode ».");
  }
  // Pas d'assureMicro() ici : retenir le micro rend la reconnaissance de Chrome muette.
  if(!initRec()){ flux.getTracks().forEach(t => t.stop()); return; }
  rec.onresult = e => {
    S.lastSpeech = Date.now();
    for(let i = e.resultIndex; i < e.results.length; i++){
      const txt = (e.results[i][0].transcript || "").trim();
      if(!txt) continue;
      etatEcoute(txt);
      if(e.results[i].isFinal) dit("CLOSER", txt);
    }
  };
  S.prospect = $("pname").value.trim() || "Prospect";
  S.domaine = $("pdomaine").value.trim();
  S.situation = SITUATION;
  S.marche = MARCHE;
  S.running = true; S.t0 = Date.now(); S.lastSpeech = Date.now();
  S.moiQuiParle = true; S.deuxOreilles = true;
  $("btnQui").textContent = "Étiquettes automatiques";
  $("home").style.display = "none";
  $("call").classList.add("on");
  ecouteLAppel(flux);
  idleCard();
  $("heardTxt").textContent = "Deux oreilles : le son de l'appel pour le prospect, ton micro pour toi.";
  try{ rec.start(); }catch(_){}
  loop();
};
const finOrigine = $("btnEnd").onclick;
$("btnEnd").onclick = function(){ arreteOreille(); S.deuxOreilles = false; return finOrigine.apply(this, arguments); };

/* --- l'analyse n'est plus annulée à chaque phrase --- */
let analyseDepuis = 0, enAttente = null;
async function lanceAnalyse(cible){
  if(ECOUTE.enCours){
    // une analyse tourne : on garde la phrase la plus récente pour juste après,
    // sauf si celle qui tourne est bloquée depuis trop longtemps
    if(Date.now() - analyseDepuis < 12000){ enAttente = cible; return; }
    try{ ECOUTE.annuleur && ECOUTE.annuleur.abort(); }catch(_){}
    ECOUTE.enCours = false;
  }
  analyseDepuis = Date.now();
  try{ await lancerAnalyse(cible); }catch(_){}
  if(enAttente && S.running){
    const suivante = enAttente; enAttente = null;
    lanceAnalyse(suivante);
  }
}
planifierAnalyse = function(text, qui, mots){
  const brut = text.trim();
  if(!API_KEY && !window.storage && !parLeServeur()){
    ECOUTE.erreur = "il manque ta clé API ou ton code";
    return note(brut, qui, false, "pas de clé ni de code");
  }
  if(BAVARDAGE.test(brut))       return note(brut, qui, false, "simple acquiescement");
  if(POLITESSE.test(brut))       return note(brut, qui, false, "politesse d'ouverture");
  if(mots < ECO.motsMin)         return note(brut, qui, false, "trop court (" + mots + " mots)");
  if(qui === "CLOSER" && !estUneQuestion(brut) && !ANNONCE_CLOSER.test(brut) && mots < 40){
    return note(brut, qui, false, "ton pitch, pas une question");
  }
  note(brut, qui, true, "analysé");
  clearTimeout(ECOUTE.horloge);
  const cible = S.transcript[S.transcript.length - 1];
  // la voix du prospect arrive déjà découpée : pas besoin d'attendre en plus
  const delai = (S.deuxOreilles && qui === "PROSPECT") ? 150 : RYTHME.pause;
  ECOUTE.horloge = setTimeout(() => lanceAnalyse(cible), delai);
  return true;
};

/* --- plus rapide, et avec le cerveau de tes coachs --- */
const consignesOrigine = CONSIGNES;
CONSIGNES = function(){
  const base = consignesOrigine();
  // le cerveau ne dépend que du marché : identique pendant tout le call, donc mis en cache
  const cerveau = doctrinePour([], S.marche || "b2c", 32000);
  return cerveau ? base + "\n\n" + cerveau + "\nEN DIRECT : une seule phrase courte à dire, tout de suite utilisable. Le cerveau t'aide à choisir laquelle, il ne s'affiche pas." : base;
};
choisirModele = function(){
  const t = S.transcript || [];
  const dernier = (t.length ? t[t.length-1].text : "").toLowerCase();
  const lourd = !!S.current || (S.events||[]).filter(e => e.type === "OBJ").length >= 2 || /(cher|prix|budget|argent|payer|coûte|tarif|moyens|financ|réfléchir|associé|femme|mari)/.test(dernier);
  if(CHOIX_MODELE !== "auto") return CHOIX_MODELE;
  if(lourd) COMPTE_LOURD++;
  // on prend la génération 5.5 si ton serveur la connaît, sinon l'ancienne
  const connu = m => !parLeServeur() || !!(SERVEUR_INFO && SERVEUR_INFO.modeles && SERVEUR_INFO.modeles.includes(m));
  if(lourd) return connu("claude-sonnet-5-5") ? "claude-sonnet-5-5" : "claude-sonnet-4-6";
  return connu("claude-haiku-5-5") ? "claude-haiku-5-5" : "claude-haiku-4-5-20251001";
};
callClaudeStream = async function(prompt, onTexte, fixe, signal){
  await pretOuTantPis();
  COMPTEUR.direct++;
  if(parLeServeur()){ try{ await infoServeur(); }catch(_){} }   // savoir quels modèles le serveur connaît
  const modele = choisirModele();
  // quelques souvenirs précis de tes coachs, proches de ce qui vient d'être dit
  let p = prompt;
  try{
    if(S.running && S.transcript.length){
      const sv = souvenirs(S.transcript.slice(-2).map(x => x.text).join(" "), [], S.marche, 4);
      if(sv) p += "\n" + sv;
    }
  }catch(_){}
  if(parLeServeur()){
    const inf = SERVEUR_INFO || {};
    const r = await fetch(srvCopilote() + "/api/claude", {
      method: "POST", signal,
      headers: {"Content-Type": "application/json", "x-code": codeAcces()},
      body: JSON.stringify(inf.systeme ? {prompt: p, systeme: fixe || "", max: 900, modele, effort: "low"}
                                       : {prompt: p + (fixe ? "\n\n" + fixe : ""), max: 900, modele})
    }).catch(e => { if(e.name === "AbortError") throw e; throw new Error("Le serveur ne répond pas. Vérifie ta connexion."); });
    const d = await r.json().catch(() => ({}));
    if(r.status === 402){ const e = new Error(d.erreur || "Quota atteint."); e.quota = true; throw e; }
    if(!r.ok) throw new Error(d.erreur || ("Serveur : erreur " + r.status));
    const t = d.texte || "";
    if(typeof onTexte === "function" && t) onTexte(t);
    return t;
  }
  const h = {"Content-Type": "application/json"};
  if(API_KEY){ h["x-api-key"] = API_KEY; h["anthropic-version"] = "2023-06-01"; h["anthropic-dangerous-direct-browser-access"] = "true"; }
  const nouveau = /-5-5$/.test(modele);
  const corpsR = {model: modele, max_tokens: nouveau ? 3000 : 900, stream: true, messages: [{role: "user", content: p}]};
  if(nouveau) corpsR.output_config = {effort: "low"};
  if(fixe) corpsR.system = [{type: "text", text: fixe, cache_control: {type: "ephemeral"}}];
  const r = await fetch("https://api.anthropic.com/v1/messages", {method: "POST", headers: h, signal, body: JSON.stringify(corpsR)});
  if(!r.ok || !r.body){
    const codes = {401: "Clé API invalide.", 403: "Clé sans accès.", 429: "Trop de demandes.", 400: "Requête refusée."};
    const err = new Error(codes[r.status] || ("HTTP " + r.status)); err.status = r.status; throw err;
  }
  const lecteur = r.body.getReader(), dec = new TextDecoder();
  let reste = "", txt = "";
  while(true){
    const {done, value} = await lecteur.read();
    if(done) break;
    reste += dec.decode(value, {stream: true});
    const lignes = reste.split("\n"); reste = lignes.pop();
    for(const l of lignes){
      if(!l.startsWith("data:")) continue;
      try{
        const d = JSON.parse(l.slice(5));
        if(d.type === "message_start" && d.message && d.message.usage){
          if(d.message.usage.cache_creation_input_tokens) CACHE.ecrit++;
          if(d.message.usage.cache_read_input_tokens) CACHE.relu++;
        }
        if(d.type === "content_block_delta" && d.delta && d.delta.type === "text_delta" && d.delta.text){
          txt += d.delta.text;
          if(onTexte) onTexte(txt);
        }
      }catch(_){}
    }
  }
  if(!txt.trim()) throw new Error("réponse vide");
  return txt;
};

})();

/* =====================================================================
   7. TON ESPACE — rien que pour toi
   Un accueil à deux portes : Tracking (tes vrais calls) et Coaching
   (analyse de call, roleplay, questions-réponses), reliés entre eux :
   ce que la grille montre comme raté devient ce que tu travailles.
   Les séances se mettent en pause et se reprennent un autre jour.
   Visible seulement sur TON navigateur : ouvre une fois l'app avec ?moncoach=1
   (?moncoach=0 pour revenir à l'app de tes testeurs).
   ===================================================================== */
(function monEspace(){
if(typeof Store === "undefined" || !$("btnSpar") || !$("home")) return;
const CLE_ACTIF = "woidih_coach_perso", CLE_SOUFFLEUR = "woidih_souffleur";
try{
  const q = new URLSearchParams(location.search);
  if(q.get("moncoach") === "1") localStorage.setItem(CLE_ACTIF, "1");
  if(q.get("moncoach") === "0") localStorage.removeItem(CLE_ACTIF);
}catch(_){}
const actif = () => { try{ return localStorage.getItem(CLE_ACTIF) === "1"; }catch(_){ return false; } };

/* --- le souffleur en direct est mis en pause --- */
(function pauseSouffleur(){
  let sur = false; try{ sur = localStorage.getItem(CLE_SOUFFLEUR) === "1"; }catch(_){}
  const b = $("btnStart"); if(!b || sur) return;
  b.textContent = "Souffleur en direct : en pause";
  b.style.opacity = ".45";
  b.onclick = () => toast("Le souffleur est en pause. Travaille avec ton coach et le roleplay.");
  const p = document.createElement("p");
  p.style.cssText = "font-size:12px;color:var(--muted);text-align:center;margin-top:6px";
  p.innerHTML = 'Mis de côté pour l\'instant. <a href="#" id="reactiveSouffleur" style="color:var(--muted)">Le réactiver</a>';
  b.insertAdjacentElement("afterend", p);
  const aide = $("aideDeuxOreilles"); if(aide) aide.style.display = "none";
  $("reactiveSouffleur").onclick = e => { e.preventDefault(); try{ localStorage.setItem(CLE_SOUFFLEUR, "1"); }catch(_){} location.reload(); };
})();

/* --- un nouveau testeur : la première chose qu'il voit, c'est où taper son code --- */
(function porteDuCode(){
  if(actif() || modeTesteur() || API_KEY) return;
  const h = $("home"); if(!h) return;
  const d = document.createElement("div");
  d.className = "block";
  d.style.cssText = "width:100%;max-width:520px;margin:0 auto 18px;border-left:2px solid var(--amber)";
  d.innerHTML = `<h3>Ton accès d'essai</h3>
    <p style="font-size:13.5px;color:var(--muted);margin:6px 0 12px">Entre le code que Woidih t'a envoyé, du genre ABCD-EFGH.</p>
    <input id="porteCode" placeholder="ABCD-EFGH" autocomplete="off" style="background:var(--bg);border:1px solid var(--line);color:var(--ink);padding:11px 14px;border-radius:9px;font-size:16px;width:100%;font-family:inherit;letter-spacing:.08em;text-transform:uppercase">
    <div style="margin-top:10px"><button class="pill" id="porteOk" style="border-color:var(--amber);color:var(--amber)">Entrer</button></div>
    <p id="porteEtat" style="font-size:13px;color:var(--muted);margin-top:9px"></p>`;
  h.insertBefore(d, h.firstChild);
  const go = async () => {
    const c = $("porteCode").value.trim().toUpperCase(); if(!c) return;
    $("porteEtat").textContent = "Vérification…";
    try{
      const r = await fetch(srvCopilote() + "/api/ping", {headers: {"x-code": c}});
      if(r.status === 401){ $("porteEtat").innerHTML = '<span style="color:var(--clay)">Ce code n\'existe pas. Vérifie-le, ou demande-le à Woidih.</span>'; return; }
      if(!r.ok) throw new Error();
      try{ localStorage.setItem("woidih_code_acces", c); }catch(_){}
      $("porteEtat").innerHTML = '<span style="color:var(--sage)">C\'est bon. J\'ouvre ton espace…</span>';
      setTimeout(() => location.reload(), 700);
    }catch(_){ $("porteEtat").innerHTML = '<span style="color:var(--clay)">Le serveur ne répond pas. Réessaie dans un instant.</span>'; }
  };
  $("porteOk").onclick = go;
  $("porteCode").onkeydown = e => { if(e.key === "Enter") go(); };
})();

// l'app de base affiche « Il manque ta clé » dès qu'il n'y a pas de clé API, même avec un code :
// un testeur n'a pas de clé à avoir, ce message ne ferait que l'inquiéter
if(!actif()){
  const enleve = () => document.querySelectorAll("#home .block").forEach(b => { const t = b.querySelector("h3"); if(t && /Il manque ta clé/.test(t.textContent)) b.remove(); });
  try{ (typeof PRET !== "undefined" && PRET ? PRET : Promise.resolve()).then(() => setTimeout(enleve, 0)); }catch(_){}
  setTimeout(enleve, 1500);
}

const TESTEUR = modeTesteur();
if(!actif() && !TESTEUR) return;
// un testeur ne voit pas les outils de réglage, ni « Ma méthode » (elle montre les fiches et leurs auteurs)
if(TESTEUR){ const st = document.createElement("style"); st.textContent = "#btnMaMethode{display:none!important}"; document.head.appendChild(st); }

/* ---------------------------------------------------------------------
   L'habillage : sobre, neutre, une seule couleur d'accent
   --------------------------------------------------------------------- */
document.documentElement.classList.add("perso");
const police = document.createElement("link");
police.rel = "stylesheet";
police.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
document.head.appendChild(police);
const style = document.createElement("style");
style.textContent = `
html.perso{--bg:#121212;--surface:#1A1A19;--line:#2B2A28;--ink:#ECE9E4;--muted:#8F8B85;--amber:#C9B28C;--clay:#C9705F;--sage:#93B59D;--steel:#A3AEB8;--radius:12px}
html.perso body,html.perso button,html.perso input,html.perso textarea,html.perso select{font-family:'Inter',system-ui,sans-serif}
html.perso h1,html.perso h2,html.perso h3,html.perso .eyebrow,html.perso [style*="Archivo Narrow"]{font-family:'Inter',system-ui,sans-serif!important;letter-spacing:-.01em}
html.perso .eyebrow{letter-spacing:.08em}
html.perso .pill{border-radius:8px;letter-spacing:0;font-weight:500;font-size:12.5px}
html.perso .pill.on{background:rgba(201,178,140,.10)}
html.perso .start{border-radius:10px;box-shadow:none}
html.perso #home{display:flex;padding:0;align-items:stretch;text-align:left;justify-content:flex-start;gap:0}
#cpAncien{display:none;flex-direction:column;align-items:center;gap:28px;padding:24px;text-align:center}
#cpAncien.on{display:flex}
.cp-page{max-width:980px;width:100%;margin:0 auto;padding:34px 22px 70px}
.cp-ecran{display:none;height:100%;overflow-y:auto}
.cp-ecran.on{display:block}
.cp-haut{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:30px}
.cp-marque{font-size:13px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.cp-lien{background:none;border:0;color:var(--muted);font-size:13.5px;cursor:pointer;padding:6px 0}
.cp-lien:hover{color:var(--ink)}
.cp-titre{font-size:clamp(28px,4.4vw,40px);font-weight:600;letter-spacing:-.025em;line-height:1.1;margin:0 0 8px}
.cp-sous{color:var(--muted);font-size:15px;line-height:1.55;margin:0 0 26px;max-width:620px}
.cp-portes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:26px}
.cp-porte{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:24px;text-align:left;cursor:pointer;transition:border-color .15s,transform .15s;color:var(--ink)}
.cp-porte:hover{border-color:#4A4844;transform:translateY(-1px)}
.cp-porte h3{font-size:21px;font-weight:600;margin:12px 0 6px}
.cp-porte p{color:var(--muted);font-size:14px;line-height:1.5;margin:0}
.cp-porte .cp-chiffre{font-size:13px;color:var(--amber);margin-top:14px}
.cp-ico{width:34px;height:34px;border-radius:9px;background:#24231F;display:flex;align-items:center;justify-content:center}
.cp-ico svg{width:18px;height:18px;stroke:var(--amber);fill:none;stroke-width:1.6}
.cp-carte{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:14px}
.cp-carte h4{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;margin:0 0 14px}
.cp-ligne{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line)}
.cp-ligne:first-of-type{border-top:0}
.cp-ligne .cp-l1{flex:1;min-width:0}
.cp-ligne b{font-weight:600}
.cp-ligne small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.cp-btn{background:transparent;border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:8px 13px;font-size:13px;cursor:pointer;white-space:nowrap}
.cp-btn:hover{border-color:#55524D}
.cp-btn.plein{background:var(--ink);color:#121212;border-color:var(--ink);font-weight:600}
.cp-btn.plein:hover{background:#fff}
.cp-btns{display:flex;gap:8px;flex-wrap:wrap}
.cp-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px}
.cp-kpi{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.cp-kpi span{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
.cp-kpi b{font-size:26px;font-weight:600;letter-spacing:-.02em}
.cp-barre{height:6px;border-radius:3px;background:#2A2926;overflow:hidden;width:120px;flex:none}
.cp-barre i{display:block;height:100%;background:var(--amber)}
.cp-onglets{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap}
.cp-onglets button{background:none;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:8px 14px;font-size:13.5px;cursor:pointer}
.cp-onglets button.on{color:var(--ink);border-color:#55524D;background:#1F1E1C}
.cp-coachs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px}
.cp-coach{display:flex;flex-direction:column;align-items:center;gap:7px;background:none;border:1px solid transparent;border-radius:12px;padding:10px 8px;cursor:pointer;color:var(--muted);font-size:12.5px;width:96px}
.cp-coach.on{border-color:var(--line);background:var(--surface);color:var(--ink)}
.cp-mini{width:58px;height:58px;border-radius:50%;overflow:hidden;background:#1d1d1b;border:1px solid var(--line)}
.cp-mini svg,.cp-mini img{width:100%;height:100%;display:block;object-fit:cover}
.cp-pastille{font-size:11.5px;padding:3px 8px;border-radius:6px;background:#24231F;color:var(--muted);white-space:nowrap}
.cp-pastille.ok{color:var(--sage)}.cp-pastille.ko{color:var(--clay)}.cp-pastille.mi{color:var(--amber)}
.cp-vide{color:var(--muted);font-size:14px;line-height:1.6}
#coachPerso .cp-wrap{max-width:780px;margin:0 auto;padding:26px 20px 60px}
.cp-tete{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.cp-tete h2{font-size:22px;font-weight:600;margin:0;flex:1;min-width:200px}
.cp-scene{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.cp-avatar{width:170px;height:170px;border-radius:50%;overflow:hidden;position:relative;flex:none;background:#1d1d1b;border:1px solid var(--line);transition:transform .25s,border-color .2s}
.cp-avatar.parle{border-color:var(--amber)}
.cp-avatar .cp-couche{position:absolute;inset:0;background-size:cover;background-position:center}
.cp-avatar svg{width:100%;height:100%;display:block}
.cp-avatar.placer{cursor:crosshair;outline:2px dashed var(--amber)}
#cpFil{margin-top:18px;display:flex;flex-direction:column;gap:10px}
.cp-msg{padding:11px 14px;border-radius:12px;line-height:1.55;font-size:15px;max-width:88%;white-space:pre-wrap}
.cp-msg.moi{align-self:flex-end;background:#22211F;border:1px solid var(--line)}
.cp-msg.coach{align-self:flex-start;background:var(--surface);border:1px solid var(--line)}
.cp-msg small{display:block;color:var(--muted);font-size:11px;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em}
.cp-saisie{position:sticky;bottom:0;background:var(--bg);padding:12px 0 4px;margin-top:12px}
.cp-saisie textarea{width:100%;min-height:70px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:11px 13px;color:var(--ink);font-family:inherit;font-size:15px}
#coachPerso details{margin-top:14px;border:1px solid var(--line);border-radius:10px;padding:10px 14px}
#coachPerso summary{cursor:pointer;color:var(--muted);font-size:13.5px}
.cp-champ,#coachPerso select,#cpTracking input{width:100%;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:9px 11px;color:var(--ink);margin-top:6px;font-size:14px}
.cp-devoir{display:flex;gap:9px;align-items:flex-start;font-size:14px;padding:6px 0;border-top:1px solid var(--line)}
.cp-devoir:first-child{border-top:0}
.cp-devoir.fait span{text-decoration:line-through;color:var(--muted)}
.cp-etape{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--line);font-size:14px}
.cp-etape:first-child{border-top:0}
.cp-etape small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.cp-etape .cp-num{flex:none;width:22px;height:22px;border-radius:50%;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted)}
.cp-etape.cours .cp-num{border-color:var(--amber);color:var(--amber)}
.cp-etape.cours b{color:var(--ink)}
.cp-etape.fait .cp-num{border-color:var(--sage);color:var(--sage)}
.cp-etape.fait b{color:var(--muted);font-weight:500}
.cp-graph svg{width:100%;height:auto;display:block}
.cp-legende{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--muted);margin-top:8px}
.cp-legende i{display:inline-block;width:14px;height:3px;border-radius:2px;vertical-align:middle;margin-right:6px}
@media(max-width:560px){.cp-barre{width:70px}.cp-avatar{width:130px;height:130px}.cp-ligne{flex-wrap:wrap}}
`;
document.head.appendChild(style);

/* ---------------------------------------------------------------------
   Les écrans
   --------------------------------------------------------------------- */
const ICO = {
  suivi: '<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/></svg>',
  coach: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/></svg>',
  reglages: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>'
};
const home = $("home");
const ancien = document.createElement("div"); ancien.id = "cpAncien";
while(home.firstChild) ancien.appendChild(home.firstChild);
const accueilEl = document.createElement("div"); accueilEl.id = "cpAccueil"; accueilEl.style.width = "100%";
home.appendChild(accueilEl); home.appendChild(ancien);
ancien.insertAdjacentHTML("afterbegin", '<button class="cp-lien" id="cpAncienRetour" style="align-self:flex-start">← Accueil</button><p class="cp-marque" style="margin:0">Réglages et outils</p>');

function ecran(id, html){
  const s = document.createElement("section");
  s.id = id; s.className = "cp-ecran"; s.innerHTML = html;
  document.body.appendChild(s); return s;
}
const ecTracking = ecran("cpTracking", '<div class="cp-page" id="cpTrackingIn"></div>');
const ecCoaching = ecran("cpCoaching", '<div class="cp-page" id="cpCoachingIn"></div>');
const sec = ecran("coachPerso", `<div class="cp-wrap">
  <div class="cp-tete"><button class="cp-lien" id="cpRetour">← Coaching</button><h2 id="cpTitreSeance">Séance</h2>
    <button class="cp-btn" id="cpPause" title="Tout est gardé : tu reprends quand tu veux">Pause, je reprends plus tard</button>
    <button class="cp-btn" id="cpTerminer">Terminer la séance</button></div>
  <div class="cp-scene">
    <div class="cp-avatar" id="cpAvatar" title="Ton coach"></div>
    <div style="flex:1;min-width:220px">
      <label style="font-size:12.5px;color:var(--muted)">Qui te coache</label>
      <select id="cpQui"></select>
      <p id="cpEtat" style="font-size:13px;color:var(--muted);margin-top:8px"></p>
    </div>
  </div>
  <div class="cp-carte" id="cpDevoirsBloc" style="margin-top:16px;display:none">
    <h4>Ton travail en cours</h4><div id="cpDevoirs"></div>
  </div>
  <div class="cp-carte" id="cpPlan" style="margin-top:16px;display:none"></div>
  <div id="cpFil"></div>
  <div id="cpEntrainer" style="display:none;margin-top:10px"></div>
  <div class="cp-saisie">
    <p id="cpCallJoint" style="font-size:12.5px;color:var(--amber);margin-bottom:6px"></p>
    <textarea id="cpMoi" placeholder="Réponds-lui, ou raconte. Ctrl + Entrée pour envoyer."></textarea>
    <div class="cp-btns" style="margin-top:8px;align-items:center">
      <button class="cp-btn" id="cpMicro">Parler au micro</button>
      <button class="cp-btn plein" id="cpEnvoi">Envoyer</button>
      <button class="cp-btn" id="cpQuestion" title="Il répond directement à ta question, puis te propose de reprendre l'exercice">Question au coach</button>
      <button class="cp-btn" id="cpStop">Le faire taire</button>
      <label style="font-size:13px;color:var(--muted);display:flex;gap:6px;align-items:center"><input type="checkbox" id="cpVoix" checked> Il me répond à voix haute</label>
    </div>
  </div>
  <details><summary>Réglages du coach</summary>
    <p style="font-size:12.5px;color:var(--muted);margin-top:10px">Sa voix (celle de ton studio voix, réglée dans le Roleplay) :</p>
    <select id="cpVoixId"></select>
    <p style="font-size:12.5px;color:var(--muted);margin-top:12px">Sa photo. Ensuite, clique sur « Placer la bouche » puis sur sa bouche dans la photo : c'est ce qui la fait bouger.</p>
    <div class="cp-btns" style="margin-top:6px"><input type="file" id="cpPhoto" accept="image/*" style="color:var(--muted)">
      <button class="cp-btn" id="cpBouche">Placer la bouche</button><button class="cp-btn" id="cpSansPhoto">Enlever la photo</button></div>
  </details>
</div>`);
const ECRANS = [ecTracking, ecCoaching, sec];
function montre(el){
  ECRANS.forEach(e => e.classList.toggle("on", e === el));
  home.style.display = el ? "none" : "flex";
  if(el) el.scrollTop = 0;
}
function accueil(){
  arreteVoix(); ancien.classList.remove("on"); accueilEl.style.display = ""; montre(null); rendAccueil();
  // un testeur revient d'un jeu de rôle ou d'une séance : son essai a bougé
  if(TESTEUR) majEssai().then(() => { if(home.style.display !== "none" && accueilEl.style.display !== "none") rendAccueil(); });
}
$("cpAncienRetour").onclick = () => { ancien.classList.remove("on"); accueilEl.style.display = ""; home.scrollTop = 0; };

/* ---------------------------------------------------------------------
   L'état, gardé dans ton navigateur
   --------------------------------------------------------------------- */
const CP = {seances: [], actuelle: null, devoirs: [], entrainements: [], regl: {}, suivi: {url: "", mdp: ""},
            stats: null, statsTout: null, calls: [], suiviErreur: "", charge: null, enCours: false, rec: null, qui: "mix", onglet: "phases"};

/* --- deux espaces : le tien et celui de ta femme. Chacun a ses séances, ses devoirs,
       ses entraînements et son suivi de calls. Les photos et les voix des coachs sont communes. --- */
const PROFILS_DEFAUT = [
  {id: "woidih", nom: "Woidih", feminin: false, desc: "un closer francophone qui vend en high ticket, surtout en B2B, et qui perd trop de calls", coachs: null},
  {id: "p2", nom: "", feminin: true, desc: "une closeuse francophone qui vend en high ticket", coachs: ["josh lyons", "bill walsh"]}
];
let PROFILS = PROFILS_DEFAUT.map(p => Object.assign({}, p));
let PROFIL = "woidih";
try{ PROFIL = localStorage.getItem("woidih_profil_actif") || "woidih"; }catch(_){}
// un testeur : un seul espace, le sien, avec Coach Vérité et Coach Objections
if(TESTEUR){
  PROFILS = [{id: "t", nom: "", feminin: false, desc: "un closer francophone qui vend en high ticket", coachs: ["verite", "objections"]}];
  PROFIL = "t";
}
const COACHS_TESTEUR = [{k: "verite", nom: "Coach Vérité", court: "Coach Vérité"}, {k: "objections", nom: "Coach Objections", court: "Coach Objections", src: "bill walsh"}];
const profil = () => PROFILS.find(p => p.id === PROFIL) || PROFILS[0];
const nomProfil = () => profil().nom || "Toi";
const K = base => base + (PROFIL === "woidih" ? "" : "__" + PROFIL);   // tes données gardent leurs anciens noms
const sauve = () => {
  Store.set(K("coach_perso_seances"), CP.seances.slice(-60).map(s => Object.assign({}, s, {conv: s.conv.slice(-80)})));
  Store.set(K("coach_perso_devoirs"), CP.devoirs.slice(-60));
  Store.set(K("coach_perso_entrainements"), CP.entrainements.slice(-400));
  Store.set(K("coach_perso_qui"), CP.qui);
  Store.set("coach_perso_regl", CP.regl);
};
async function chargeProfil(){
  CP.seances = (await Store.get(K("coach_perso_seances"))) || [];
  CP.devoirs = (await Store.get(K("coach_perso_devoirs"))) || [];
  CP.entrainements = (await Store.get(K("coach_perso_entrainements"))) || [];
  CP.actuelle = null; CP.stats = null; CP.statsTout = null; CP.calls = []; CP.charge = null; CP.suiviErreur = "";
  const autorises = profil().coachs;
  CP.qui = (await Store.get(K("coach_perso_qui"))) || (PROFIL === "woidih" ? (CP.regl._qui || "mix") : autorises[0]);
  if(autorises && !autorises.includes(CP.qui)) CP.qui = autorises[0];
  const s = (await Store.get(K("coach_perso_suivi"))) || {};
  let defaut = "";
  if(PROFIL === "woidih" || TESTEUR){ try{ defaut = srvCopilote().replace(/\/copilot\/?$/, "") + "/suivi"; }catch(_){} }
  // un testeur entre dans son suivi avec son code d'accès : rien à taper
  CP.suivi = TESTEUR ? {url: defaut, mdp: "", code: codeAcces()} : {url: s.url || defaut, mdp: s.mdp || ""};
}
async function changeProfil(id){
  arreteVoix();
  PROFIL = id; try{ localStorage.setItem("woidih_profil_actif", id); }catch(_){}
  await chargeProfil();
  accueil();
  await chargeSuivi();
  if(home.style.display !== "none" && accueilEl.style.display !== "none") rendAccueil();
}
const seance = () => CP.seances.find(s => s.id === CP.actuelle) || null;
const jour = t => new Date(t).toLocaleDateString("fr-FR", {day: "numeric", month: "short"});
const aujourdhui = () => new Date().toISOString().slice(0, 10);

/* --- les coachs disponibles --- */
function coachs(){
  if(TESTEUR) return COACHS_TESTEUR;
  const l = [{k: "mix", nom: "Ton coach", court: "Ton coach"}];
  Object.keys(DOCTRINES).sort().forEach(k => {
    if(!DOCTRINES[k] || !DOCTRINES[k].cerveau || !docVisible(k)) return;
    const nom = (ECOLES[k] && ECOLES[k].nom) || k;
    l.push({k, nom, court: nom.split(" ")[0]});
  });
  Object.keys(typeof MANIERE_COACH === "object" ? MANIERE_COACH : {}).forEach(k => {
    if(l.some(x => x.k === k)) return;
    if(!(FICHES || []).some(f => f.ecole === k)) return;
    const nom = (ECOLES[k] && ECOLES[k].nom) || MANIERE_COACH[k].nom || k;
    l.push({k, nom, court: nom.split(" ")[0]});
  });
  const autorises = profil().coachs;
  if(autorises){
    // son espace : seulement ses coachs, même si un cerveau n'est pas encore construit
    return autorises.map(k => l.find(x => x.k === k) || {k, nom: (ECOLES[k] && ECOLES[k].nom) || (typeof MANIERE_COACH === "object" && MANIERE_COACH[k] && MANIERE_COACH[k].nom) || k, court: String(k).split(" ")[0].replace(/^./, c => c.toUpperCase())});
  }
  return l;
}
const coachDe = k => coachs().find(c => c.k === k) || coachs()[0];
const coachCourant = () => coachDe(CP.qui);

/* --- un visage par coach, tant que tu n'as pas mis sa photo --- */
const VISAGES = {
  "mix":         {peau: "#B98E72", cheveux: "#3A3530", coupe: "court", barbe: false, lunettes: false},
  "josh lyons":  {peau: "#D1A98A", cheveux: "#2B2420", coupe: "court", barbe: true,  lunettes: false},
  "keenan":      {peau: "#D4AE93", cheveux: "#6B5B4E", coupe: "rase",  barbe: true,  lunettes: false},
  "bill walsh":  {peau: "#C99878", cheveux: "#9C9890", coupe: "court", barbe: false, lunettes: true},
  "ben byrne":   {peau: "#D8B49A", cheveux: "#5A4130", coupe: "haut",  barbe: false, lunettes: false},
  "sami":        {peau: "#A97B5E", cheveux: "#1E1A18", coupe: "court", barbe: true,  lunettes: false},
  "verite":      {peau: "#C9A487", cheveux: "#2F2722", coupe: "court", barbe: false, lunettes: false},
  "objections":  {peau: "#C49676", cheveux: "#6E6A64", coupe: "rase",  barbe: true,  lunettes: true}
};
function visage(k, idBouche){
  const v = VISAGES[k] || Object.assign({}, VISAGES.mix, {peau: ["#C29A7E", "#B0856A", "#D6B092"][String(k).length % 3]});
  const cheveux = v.coupe === "rase" ? `<path d="M50 84 Q54 40 100 38 Q146 40 150 84 Q140 62 100 60 Q60 62 50 84Z" fill="${v.cheveux}" opacity=".35"/>`
    : v.coupe === "haut" ? `<path d="M46 88 Q46 26 100 24 Q154 26 154 88 Q142 50 100 50 Q58 50 46 88Z" fill="${v.cheveux}"/>`
    : `<path d="M48 86 Q52 34 100 34 Q148 34 152 86 Q140 58 100 56 Q62 58 48 86Z" fill="${v.cheveux}"/>`;
  const barbe = v.barbe ? `<path d="M56 128 Q100 182 144 128 Q138 162 100 168 Q62 162 56 128Z" fill="${v.cheveux}" opacity=".55"/>` : "";
  const lunettes = v.lunettes ? `<g fill="none" stroke="#1a1a1a" stroke-width="3"><circle cx="80" cy="96" r="12"/><circle cx="120" cy="96" r="12"/><path d="M92 96h16"/></g>` : "";
  return `<svg viewBox="0 0 200 200"><rect width="200" height="200" fill="#1d1d1b"/>
    <ellipse cx="100" cy="214" rx="80" ry="54" fill="#2E2D2A"/>
    <ellipse cx="100" cy="100" rx="52" ry="62" fill="${v.peau}"/>${cheveux}${barbe}
    <g class="cp-yeux"><ellipse cx="80" cy="96" rx="5.5" ry="5.5" fill="#1a1512"/><ellipse cx="120" cy="96" rx="5.5" ry="5.5" fill="#1a1512"/></g>${lunettes}
    <path d="M68 82 Q80 77 92 82" stroke="${v.cheveux}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M108 82 Q120 77 132 82" stroke="${v.cheveux}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse ${idBouche ? 'id="cpBoucheSvg"' : ""} cx="100" cy="134" rx="14" ry="2" fill="#5a2c2a"/></svg>`;
}
const miniature = k => { const p = (CP.regl[k] || {}).photo; return p ? `<img src="${p}" alt="">` : visage(k, false); };

/* --- l'avatar de la séance : la mâchoire suit le son --- */
let AMP = 0;
function rendAvatar(){
  const el = $("cpAvatar"), r = CP.regl[CP.qui] || {};
  if(r.photo){
    const y = r.bouche || 66;
    el.innerHTML = `<div class="cp-couche" style="background-image:url('${r.photo}')"></div>
      <div id="cpTrou" style="position:absolute;left:50%;top:${y}%;width:17%;height:0;transform:translate(-50%,-30%);border-radius:50%;background:#2a1414;box-shadow:inset 0 2px 4px #000"></div>
      <div class="cp-couche" id="cpBas" style="background-image:url('${r.photo}');clip-path:inset(${y}% 27% 0 27% round 0 0 45% 45%)"></div>`;
  } else el.innerHTML = visage(CP.qui, true);
}
function bouge(a){
  AMP = AMP * 0.55 + a * 0.45;
  const bas = $("cpBas"), b = $("cpBoucheSvg"), av = $("cpAvatar"), trou = $("cpTrou");
  if(bas) bas.style.transform = "translateY(" + (AMP * 4.5).toFixed(2) + "%)";
  if(trou) trou.style.height = (AMP * 5.5).toFixed(2) + "%";
  if(b) b.setAttribute("ry", (2 + AMP * 11).toFixed(1));
  if(av) av.style.transform = AMP > 0.05 ? "rotate(" + (Math.sin(Date.now() / 380) * 1.2).toFixed(2) + "deg)" : "";
}
setInterval(() => {
  const y = document.querySelector("#cpAvatar .cp-yeux"); if(!y) return;
  y.setAttribute("transform", "translate(0 96) scale(1 0.1) translate(0 -96)");
  setTimeout(() => y.removeAttribute("transform"), 140);
}, 4200);

/* --- sa voix --- */
let CTX = null, AUDIO = null, ANIM = null;
function arreteVoix(){
  if(AUDIO){ try{ AUDIO.pause(); }catch(_){} AUDIO = null; }
  try{ speechSynthesis.cancel(); }catch(_){}
  cancelAnimationFrame(ANIM); bouge(0); bouge(0);
  if($("cpAvatar")) $("cpAvatar").classList.remove("parle");
}
function joue(url){
  return new Promise(async fin => {
    const a = new Audio(url); AUDIO = a;
    try{
      CTX = CTX || new (window.AudioContext || window.webkitAudioContext)();
      await CTX.resume();
      const src = CTX.createMediaElementSource(a), an = CTX.createAnalyser();
      an.fftSize = 512; src.connect(an); an.connect(CTX.destination);
      const d = new Uint8Array(an.fftSize);
      const tic = () => {
        an.getByteTimeDomainData(d);
        let s = 0; for(let i = 0; i < d.length; i++){ const v = (d[i] - 128) / 128; s += v * v; }
        bouge(Math.min(1, Math.sqrt(s / d.length) * 5.5));
        ANIM = requestAnimationFrame(tic);
      };
      tic();
    }catch(_){}
    $("cpAvatar").classList.add("parle");
    const termine = () => { cancelAnimationFrame(ANIM); bouge(0); bouge(0); $("cpAvatar").classList.remove("parle"); try{ URL.revokeObjectURL(url); }catch(_){} if(AUDIO === a) AUDIO = null; fin(); };
    a.onended = termine; a.onerror = termine;
    a.play().catch(termine);
  });
}
async function parle(txt){
  arreteVoix();
  const t = String(txt || "").replace(/<<[^>]*>>/g, "").trim();
  if(!t || !$("cpVoix").checked) return;
  const cle = (typeof CLE_VOIX !== "undefined" && CLE_VOIX) || ($("cleVoix") ? $("cleVoix").value.trim() : "");
  const voix = (CP.regl[CP.qui] || {}).voix || ($("voixCoach") ? $("voixCoach").value.trim() : "");
  if(typeof MOTEUR_VOIX !== "undefined" && MOTEUR_VOIX !== "nav" && cle){
    try{
      const r = MOTEUR_VOIX === "eleven"
        ? await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voix || VOIX_DEFAUT), {method: "POST",
            headers: {"xi-api-key": cle, "Content-Type": "application/json", "Accept": "audio/mpeg"},
            body: JSON.stringify({text: t, model_id: "eleven_multilingual_v2", voice_settings: {stability: 0.45, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true}})})
        : await fetch("https://api.openai.com/v1/audio/speech", {method: "POST",
            headers: {"Authorization": "Bearer " + cle, "Content-Type": "application/json"},
            body: JSON.stringify({model: "gpt-4o-mini-tts", voice: voix || "onyx", input: t, response_format: "mp3"})});
      if(!r.ok) throw new Error("voix " + r.status);
      const blob = await r.blob();
      if(blob.size > 500) return joue(URL.createObjectURL(blob));
    }catch(e){ $("cpEtat").textContent = "Sa voix n'a pas répondu (" + e.message + "), je passe sur celle du navigateur."; }
  }
  if(!("speechSynthesis" in window)) return;
  return new Promise(fin => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "fr-FR"; u.rate = 0.96; u.pitch = 0.9;
    if(typeof VOIX_FR !== "undefined" && VOIX_FR.length) u.voice = VOIX_FR[0];
    let pulse = null;
    u.onstart = () => { $("cpAvatar").classList.add("parle"); pulse = setInterval(() => bouge(0.25 + Math.random() * 0.6), 90); };
    u.onboundary = () => bouge(0.9);
    u.onend = u.onerror = () => { clearInterval(pulse); bouge(0); bouge(0); $("cpAvatar").classList.remove("parle"); fin(); };
    speechSynthesis.speak(u);
  });
}

/* ---------------------------------------------------------------------
   Ton suivi de calls
   --------------------------------------------------------------------- */
/* un testeur : son prénom et où en est son essai, d'après le Serveur Copilot */
async function majEssai(){
  if(!TESTEUR) return;
  try{
    const r = await fetch(srvCopilote() + "/api/ping", {headers: {"x-code": codeAcces()}});
    if(r.status === 401){ CP.essaiRefuse = true; return; }
    const d = await r.json().catch(() => ({}));
    if(d.compte){
      CP.essai = d.compte; CP.essaiEtat = d.essai || {ok: true};
      const p = PROFILS[0];
      p.nom = d.compte.nom || ""; p.feminin = !!d.compte.feminin;
      p.desc = (p.feminin ? "une closeuse francophone" : "un closer francophone") + " qui vend en high ticket";
    }
  }catch(_){}
}
const ligneEssai = () => !CP.essai ? "" : `Ton essai : ${CP.essai.call.fait}/${CP.essai.call.max} calls analysés · ${CP.essai.roleplay.fait}/${CP.essai.roleplay.max} jeux de rôle · ${CP.essai.coaching.fait}/${CP.essai.coaching.max} séances de coaching`;
const suiviConnecte = () => !!(CP.suivi.url && (CP.suivi.mdp || CP.suivi.code));
async function suivi(chemin, methode, corps){
  const s = CP.suivi; if(!suiviConnecte()) throw new Error("suivi non connecté");
  const h = s.code ? {"x-code": s.code} : {"x-mot-de-passe": s.mdp};
  if(corps) h["Content-Type"] = "application/json";
  const r = await fetch(s.url.replace(/\/+$/, "") + chemin, {method: methode || "GET", headers: h, body: corps ? JSON.stringify(corps) : undefined});
  if(r.status === 401) throw new Error(s.code ? "ton code d'accès est refusé par le suivi" : "mot de passe du suivi refusé");
  if(!r.ok){ const d = await r.json().catch(() => ({})); throw new Error(d.erreur || ("suivi : erreur " + r.status)); }
  return chemin.endsWith("/transcript") ? r.text() : r.json();
}
function chargeSuivi(force){
  if(CP.charge && !force) return CP.charge;
  CP.charge = (async () => {
    if(!suiviConnecte()){ CP.suiviErreur = "non connecté"; return; }
    // un testeur sans clé Fathom : on le lui demande, plutôt que d'afficher un suivi vide
    if(TESTEUR){
      try{ const c = await suivi("/api/compte"); CP.fathomOk = !!c.fathom; }catch(e){ CP.suiviErreur = e.message; return; }
      if(!CP.fathomOk){ CP.suiviErreur = "fathom"; return; }
    }
    try{
      const depuis = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
      const [st, tout, ca] = await Promise.all([suivi("/api/stats?depuis=" + depuis), suivi("/api/stats"), suivi("/api/calls")]);
      CP.stats = st; CP.statsTout = tout;
      CP.calls = (ca || []).filter(c => c.vente !== false).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      CP.suiviErreur = "";
    }catch(e){ CP.suiviErreur = e.message; }
  })();
  return CP.charge;
}
const valeur = s => s === "fait" ? 1 : s === "partiel" ? 0.5 : s === "non" ? 0 : null;
const scoreCall = c => { if(!c.grille) return null; const v = Object.values(c.grille).map(x => valeur(x && x.s)).filter(x => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 100) : null; };
const lignesGrille = () => (((CP.stats || {}).grille || {}).lignes || []);
const nomPhase = k => (lignesGrille().find(l => l.k === k) || {}).nom || k;
const callsRates = k => CP.calls.filter(c => c.grille && c.grille[k] && (c.grille[k].s === "non" || c.grille[k].s === "partiel"));
const etiquetteIssue = i => { const x = String(i || "?"); return `<span class="cp-pastille ${/sign/i.test(x) ? "ok" : /perd/i.test(x) ? "ko" : "mi"}">${escapeHTML(x)}</span>`; };
const nomCall = c => (c.prospect || c.titre || "call");

/* le taux d'une phase avant ton premier entraînement dessus, et depuis */
function avantApres(k){
  const e = CP.entrainements.filter(x => x.k === k).sort((a, b) => a.t - b.t)[0];
  if(!e) return null;
  const date = new Date(e.t).toISOString().slice(0, 10);
  const avec = CP.calls.filter(c => c.grille && c.grille[k] && valeur(c.grille[k].s) !== null);
  const moy = l => l.length ? Math.round(l.reduce((a, c) => a + valeur(c.grille[k].s), 0) / l.length * 100) : null;
  const av = avec.filter(c => String(c.date || "") < date), ap = avec.filter(c => String(c.date || "") >= date);
  return {date, avant: moy(av), nAvant: av.length, apres: moy(ap), nApres: ap.length, fois: CP.entrainements.filter(x => x.k === k).length};
}

/* ---------------------------------------------------------------------
   L'accueil
   --------------------------------------------------------------------- */
function rendAccueil(){
  const st = CP.stats, enCours = CP.seances.filter(s => s.etat !== "terminee").sort((a, b) => b.maj - a.maj);
  const prio = st && st.grille && st.grille.faiblesses && st.grille.faiblesses[0];
  const heure = new Date().getHours();
  accueilEl.innerHTML = `<div class="cp-page">
    <div class="cp-haut"><span class="cp-marque">Closing Copilot</span>
      ${TESTEUR ? "" : '<button class="cp-lien" id="cpVersReglages">Réglages et outils</button>'}</div>
    ${TESTEUR && CP.essaiRefuse ? `<div class="cp-carte" style="border-color:var(--clay)"><h4>Ton code n'est plus valide</h4><p class="cp-vide">Demande un nouveau code à Woidih.</p>
      <div class="cp-btns" style="margin-top:10px"><button class="cp-btn plein" id="cpChangeCode">Entrer un autre code</button></div></div>` : ""}
    ${TESTEUR && CP.essaiEtat && !CP.essaiEtat.ok ? `<div class="cp-carte" style="border-color:var(--clay)"><p class="cp-vide" style="color:var(--ink)">${escapeHTML(CP.essaiEtat.raison || "Ton essai est arrivé au bout.")}</p></div>` : ""}
    <div class="cp-onglets" style="margin-bottom:22px;${TESTEUR ? "display:none" : ""}">${PROFILS.map(p => `<button data-espace="${p.id}" class="${p.id === PROFIL ? "on" : ""}">${p.nom ? "Espace de " + escapeHTML(p.nom) : "Créer l'espace de ta femme"}</button>`).join("")}</div>
    <div class="cp-carte" id="cpNouveauProfil" style="display:none"><h4>Son espace</h4>
      <p class="cp-vide">Son prénom, et en une phrase ce qu'elle vend. Ses coachs : Josh et Bill. Elle aura ses propres séances, devoirs et calls.</p>
      <input class="cp-champ" id="cpProfilNom" placeholder="Son prénom">
      <input class="cp-champ" id="cpProfilDesc" placeholder="Ce qu'elle vend (facultatif)">
      <div class="cp-btns" style="margin-top:10px"><button class="cp-btn plein" id="cpProfilOk">Créer son espace</button></div></div>
    <h1 class="cp-titre">${heure < 18 ? "Bonjour" : "Bonsoir"} ${escapeHTML(nomProfil())}.</h1>
    <p class="cp-sous">${prio ? "En ce moment, ce qui te coûte le plus : <b style='color:var(--ink)'>" + escapeHTML(prio.nom) + "</b>, réussi dans " + prio.taux + " % de tes calls." : "Tes calls d'un côté, ton travail de l'autre. Les deux sont reliés."}</p>
    ${TESTEUR && CP.essai ? `<p style="font-size:13px;color:var(--muted);margin:-10px 0 22px">${escapeHTML(ligneEssai())}</p>` : ""}
    <div class="cp-portes">
      <button class="cp-porte" id="cpPorteTracking"><div class="cp-ico">${ICO.suivi}</div><h3>Tracking</h3>
        <p>Tes vrais calls, ta grille, ta progression semaine après semaine.</p>
        <div class="cp-chiffre">${st ? st.calls + " calls sur 45 jours · " + st.signes + " signés" + (st.taux_prospect != null ? " · " + st.taux_prospect + " % par prospect" : "") : (CP.suiviErreur === "non connecté" ? "À connecter" : "&nbsp;")}</div></button>
      <button class="cp-porte" id="cpPorteCoaching"><div class="cp-ico">${ICO.coach}</div><h3>Coaching</h3>
        <p>Analyse de call, roleplay, questions-réponses. Sur ce que tes calls montrent.</p>
        <div class="cp-chiffre">${enCours.length ? enCours.length + " séance" + (enCours.length > 1 ? "s" : "") + " à reprendre" : (prio ? "Phase prioritaire : " + escapeHTML(prio.nom) : "&nbsp;")}</div></button>
    </div>
    ${enCours[0] ? `<div class="cp-carte"><h4>À reprendre</h4><div class="cp-ligne"><div class="cp-l1"><b>${escapeHTML(enCours[0].titre)}</b><small>${escapeHTML(coachDe(enCours[0].qui).nom)} · commencée le ${jour(enCours[0].debut)} · ${enCours[0].conv.length} échanges</small></div>
      <button class="cp-btn plein" data-reprendre="${enCours[0].id}">Reprendre</button></div></div>` : ""}
    ${devoirsOuverts().length ? `<div class="cp-carte"><h4>Ton travail en cours</h4>${devoirsOuverts().slice(-3).map(d => `<div class="cp-ligne"><div class="cp-l1">${escapeHTML(d.txt)}<small>donné le ${escapeHTML(d.date)}</small></div></div>`).join("")}</div>` : ""}
  </div>`;
  $("cpPorteTracking").onclick = ouvreTracking;
  $("cpPorteCoaching").onclick = ouvreCoaching;
  if($("cpVersReglages")) $("cpVersReglages").onclick = () => { accueilEl.style.display = "none"; ancien.classList.add("on"); home.scrollTop = 0; };
  if($("cpChangeCode")) $("cpChangeCode").onclick = () => { try{ localStorage.removeItem("woidih_code_acces"); }catch(_){} location.reload(); };
  accueilEl.querySelectorAll("[data-reprendre]").forEach(b => b.onclick = () => reprend(b.dataset.reprendre));
  accueilEl.querySelectorAll("[data-espace]").forEach(b => b.onclick = () => {
    const p = PROFILS.find(x => x.id === b.dataset.espace);
    if(!p.nom){ $("cpNouveauProfil").style.display = "block"; $("cpProfilNom").focus(); return; }
    if(p.id !== PROFIL) changeProfil(p.id);
  });
  $("cpProfilOk").onclick = async () => {
    const nom = $("cpProfilNom").value.trim(); if(!nom) return toast("Écris son prénom.");
    const p = PROFILS.find(x => x.id === "p2");
    p.nom = nom; const d = $("cpProfilDesc").value.trim(); if(d) p.desc = "une closeuse francophone qui vend " + d.replace(/^(je |elle )?vends? /i, "");
    await Store.set("coach_perso_profils", PROFILS);
    changeProfil("p2");
  };
}
const devoirsOuverts = () => CP.devoirs.filter(d => !d.fait);

/* ---------------------------------------------------------------------
   Tracking
   --------------------------------------------------------------------- */
async function ouvreTracking(){
  montre(ecTracking);
  const el = $("cpTrackingIn");
  el.innerHTML = '<button class="cp-lien" id="cpTrRetour">← Accueil</button><p class="cp-vide" style="margin-top:20px">Je récupère tes calls…</p>';
  $("cpTrRetour").onclick = accueil;
  await chargeSuivi();
  rendTracking();
}
function formulaireSuivi(){
  if(TESTEUR){
    const err = CP.suiviErreur && !["non connecté", "fathom"].includes(CP.suiviErreur) ? "<span style='color:var(--clay)'>" + escapeHTML(CP.suiviErreur) + "</span><br>" : "";
    return `<div class="cp-carte"><h4>Connecter tes calls Fathom</h4>
      <p class="cp-vide">${err}Colle ta clé Fathom une seule fois. Tes calls seront ensuite récupérés et analysés tout seuls${CP.essai ? ", dans la limite de ton essai (" + CP.essai.call.max + " calls)" : ""}.</p>
      <p class="cp-vide" style="font-size:13px;margin-top:8px">Où la trouver : dans Fathom, ouvre <b style="color:var(--ink)">Réglages</b>, puis <b style="color:var(--ink)">API</b>, et crée une clé.</p>
      <input class="cp-champ" id="cpFathomCle" type="password" placeholder="ta clé Fathom" autocomplete="off">
      <p style="font-size:12.5px;color:var(--muted);margin-top:10px;line-height:1.5">Bon à savoir : tes calls (leur transcription et leur analyse) sont stockés sur le serveur de Woidih, uniquement pour ton coaching. Il les supprime dès que tu le lui demandes.</p>
      <div class="cp-btns" style="margin-top:12px"><button class="cp-btn plein" id="cpFathomOk">Connecter mes calls</button></div>
      <p id="cpFathomEtat" style="font-size:13px;color:var(--muted);margin-top:8px"></p></div>`;
  }
  return `<div class="cp-carte"><h4>Connecter ton suivi</h4>
    <p class="cp-vide">${CP.suiviErreur && CP.suiviErreur !== "non connecté" ? "<span style='color:var(--clay)'>" + escapeHTML(CP.suiviErreur) + "</span><br>" : ""}Une seule fois : ta page « Mon suivi » s'ouvre un instant et passe elle-même ton mot de passe. Tu n'as rien à taper.</p>
    <div class="cp-btns" style="margin-top:12px"><button class="cp-btn plein" id="cpSuiviAuto">Connecter mon suivi</button></div>
    <details style="margin-top:14px"><summary style="cursor:pointer;color:var(--muted);font-size:13px">Ou le taper à la main</summary>
    <input class="cp-champ" id="cpSuiviUrl" placeholder="https://…ts.net/suivi" value="${escapeHTML(CP.suivi.url)}">
    <input class="cp-champ" id="cpSuiviMdp" type="password" placeholder="le mot de passe de ta page Mon suivi" value="">
    <div class="cp-btns" style="margin-top:10px"><button class="cp-btn" id="cpSuiviOk">Connecter</button></div></details></div>`;
}
/* ta page « Mon suivi » connaît déjà ton mot de passe : on le lui demande */
let APRES_LIEN = null;
window.addEventListener("message", async e => {
  let attendu = ""; try{ attendu = new URL(CP.suivi.url).origin; }catch(_){}
  if(!e.data || e.data.type !== "suivi-lie" || e.origin !== attendu || !e.data.mdp) return;
  CP.suivi = {url: String(e.data.url || CP.suivi.url), mdp: String(e.data.mdp)};
  await Store.set(K("coach_perso_suivi"), CP.suivi);
  await chargeSuivi(true);
  toast(CP.suiviErreur ? "Suivi : " + CP.suiviErreur : "Ton suivi est connecté.");
  if(APRES_LIEN) APRES_LIEN();
});
// un testeur : sa clé Fathom, puis la première relève de ses calls
async function releveTesteur(etat){
  const dit = t => { if(etat) etat.innerHTML = t; };
  dit("Je récupère tes calls et je les analyse. Compte une minute environ par call, tu peux attendre ici…");
  try{
    await suivi("/api/fathom", "POST", {});
    // l'analyse tourne sur le serveur : on suit son avancement
    let r = {};
    for(let i = 0; i < 180; i++){
      await new Promise(ok => setTimeout(ok, 5000));
      const p = await suivi("/api/ping").catch(() => null);
      if(p && p.releve && !p.releve.en_cours){ r = p.releve; break; }
      if(i % 6 === 5) dit("Toujours en train d'analyser tes calls… (" + Math.round((i + 1) * 5 / 60) + " min)");
    }
    const err = (r.erreurs || []).filter(Boolean);
    dit(r.nouveaux ? `<span style="color:var(--sage)">${r.nouveaux} call${r.nouveaux > 1 ? "s" : ""} analysé${r.nouveaux > 1 ? "s" : ""}.</span>` + (err.length ? " " + escapeHTML(err[0]) : "")
                   : (err.length ? '<span style="color:var(--clay)">' + escapeHTML(err[0]) + "</span>" : "Pas de nouveau call pour l'instant."));
  }catch(e){ dit('<span style="color:var(--clay)">' + escapeHTML(e.message) + "</span>"); }
  await majEssai();
}
function brancheFormulaireSuivi(apres){
  const fo = $("cpFathomOk");
  if(fo) fo.onclick = async () => {
    const cle = $("cpFathomCle").value.trim(), etat = $("cpFathomEtat");
    if(!cle) return toast("Colle ta clé Fathom.");
    fo.disabled = true; etat.textContent = "Je vérifie ta clé auprès de Fathom…";
    try{ await suivi("/api/compte", "PUT", {fathom: cle}); }
    catch(e){ fo.disabled = false; etat.innerHTML = '<span style="color:var(--clay)">' + escapeHTML(e.message) + "</span>"; return; }
    CP.fathomOk = true;
    await releveTesteur(etat);
    await chargeSuivi(true); apres();
  };
  const a = $("cpSuiviAuto");
  if(a) a.onclick = () => {
    APRES_LIEN = apres;
    const url = (CP.suivi.url || "").replace(/\/+$/, "");
    if(!url) return toast("Ouvre « Ou le taper à la main » et mets l'adresse de ton suivi.");
    const f = window.open(url + "/?lier=" + encodeURIComponent(location.origin), "lierSuivi", "width=520,height=640");
    if(!f) toast("Ton navigateur a bloqué la fenêtre : autorise les fenêtres pour cette page.");
    else toast("Si ta page Mon suivi te demande ton mot de passe, entre-le là-bas une dernière fois.");
  };
  const b = $("cpSuiviOk"); if(!b) return;
  b.onclick = async () => {
    CP.suivi = {url: $("cpSuiviUrl").value.trim(), mdp: $("cpSuiviMdp").value.trim()};
    await Store.set(K("coach_perso_suivi"), CP.suivi);
    b.textContent = "Connexion…";
    await chargeSuivi(true); apres();
  };
}
function rendTracking(){
  const el = $("cpTrackingIn"), st = CP.stats;
  let h = `<div class="cp-haut"><button class="cp-lien" id="cpTrRetour">← Accueil</button>
    <div class="cp-btns"><button class="cp-btn" id="cpTrMaj">Actualiser</button>${TESTEUR ? (CP.fathomOk ? '<button class="cp-btn" id="cpTrReleve">Relever mes nouveaux calls</button>' : "")
      : (CP.suivi.url ? `<a class="cp-btn" style="text-decoration:none" target="_blank" rel="noopener" href="${escapeHTML(CP.suivi.url)}">Page complète du suivi</a>` : "")}</div></div>
    <h1 class="cp-titre">Tracking</h1><p class="cp-sous">Les 45 derniers jours, analysés avec ta grille. La courbe montre toute ta progression.</p>
    ${TESTEUR ? `<p id="cpTrEtat" style="font-size:13px;color:var(--muted);margin:-8px 0 16px">${CP.essai ? "Ton essai : " + CP.essai.call.fait + "/" + CP.essai.call.max + " calls analysés. Tes nouveaux calls sont relevés tout seuls toutes les heures." : ""}</p>` : ""}`;
  if(!st){ el.innerHTML = h + formulaireSuivi(); branche(); brancheFormulaireSuivi(rendTracking); return; }
  const scoreMoy = (() => { const v = CP.calls.filter(c => String(c.date || "") >= new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10)).map(scoreCall).filter(x => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; })();
  h += `<div class="cp-kpis">
    <div class="cp-kpi"><span>Calls</span><b>${st.calls}</b></div>
    <div class="cp-kpi"><span>Signés</span><b>${st.signes}</b></div>
    <div class="cp-kpi"><span>Taux par prospect</span><b>${st.taux_prospect ?? "–"}${st.taux_prospect != null ? " %" : ""}</b></div>
    <div class="cp-kpi"><span>Grille respectée</span><b>${scoreMoy ?? "–"}${scoreMoy != null ? " %" : ""}</b></div></div>`;
  h += `<div class="cp-carte"><h4>Ta progression</h4>${graphique()}</div>`;
  const trav = [...new Set(CP.entrainements.map(e => e.k).filter(Boolean))].map(k => [k, avantApres(k)]).filter(x => x[1]);
  if(trav.length) h += `<div class="cp-carte"><h4>Avant et après tes entraînements</h4>${trav.map(([k, a]) => `<div class="cp-ligne"><div class="cp-l1"><b>${escapeHTML(nomPhase(k))}</b>
      <small>${a.fois} entraînement${a.fois > 1 ? "s" : ""} depuis le ${jour(a.date)}</small></div>
      <span class="cp-pastille">avant ${a.avant ?? "–"}${a.avant != null ? " %" : ""} <small style="display:inline">(${a.nAvant} calls)</small></span>
      <span class="cp-pastille ${a.apres != null && a.avant != null ? (a.apres > a.avant ? "ok" : a.apres < a.avant ? "ko" : "") : ""}">depuis ${a.nApres >= 1 ? a.apres + " %" : "–"} <small style="display:inline">(${a.nApres} calls)</small></span></div>`).join("")}
    <p class="cp-vide" style="font-size:12.5px;margin-top:10px">Tant qu'il y a moins de 3 calls « depuis », c'est une tendance, pas une preuve.</p></div>`;
  const lignes = lignesGrille().filter(l => l.n);
  h += `<div class="cp-carte"><h4>Ta grille, phase par phase</h4>${lignes.length ? lignes.map(l => `<div class="cp-ligne"><div class="cp-l1"><b>${escapeHTML(l.nom)}</b>
      <small>${l.signe_si_fait != null ? "signé " + l.signe_si_fait + " % quand tu le fais" : ""}${l.signe_si_fait != null && l.signe_si_rate != null ? " · " : ""}${l.signe_si_rate != null ? l.signe_si_rate + " % quand tu le rates" : ""}</small></div>
      <div class="cp-barre"><i style="width:${l.taux || 0}%"></i></div><span style="width:42px;text-align:right;font-size:14px">${l.taux ?? "–"} %</span>
      <button class="cp-btn" data-travailler="${l.k}">Travailler</button></div>`).join("") : '<p class="cp-vide">Pas encore de call analysé avec la grille.</p>'}</div>`;
  h += `<div class="cp-carte"><h4>Tes calls</h4>${CP.calls.slice(0, 40).map(c => `<div class="cp-ligne"><div class="cp-l1"><b>${escapeHTML(nomCall(c))}</b>
      <small>${escapeHTML(c.date || "")} · ${escapeHTML(c.etape || "")}${c.offre ? " · " + escapeHTML(c.offre) : ""}${scoreCall(c) != null ? " · grille " + scoreCall(c) + " %" : ""}</small></div>
      ${etiquetteIssue(c.issue)}<button class="cp-btn" data-analyser="${escapeHTML(c.id)}">Analyser avec le coach</button></div>`).join("") || '<p class="cp-vide">Aucun call pour l\'instant.</p>'}</div>`;
  el.innerHTML = h; branche();
  function branche(){
    $("cpTrRetour").onclick = accueil;
    if($("cpTrMaj")) $("cpTrMaj").onclick = async () => { $("cpTrMaj").textContent = "…"; await chargeSuivi(true); rendTracking(); };
    if($("cpTrReleve")) $("cpTrReleve").onclick = async () => { $("cpTrReleve").disabled = true; await releveTesteur($("cpTrEtat")); await chargeSuivi(true); rendTracking(); };
    el.querySelectorAll("[data-analyser]").forEach(b => b.onclick = () => nouvelleAnalyse(CP.calls.find(c => c.id === b.dataset.analyser)));
    el.querySelectorAll("[data-travailler]").forEach(b => b.onclick = () => { CP.onglet = "phases"; ouvreCoaching(b.dataset.travailler); });
  }
}
/* la courbe : ta grille (calls réels) et ton taux de signature, semaine par semaine, avec tes entraînements */
function graphique(){
  const sem = ((CP.statsTout || {}).semaines || []).slice(-16);
  if(sem.length < 2) return '<p class="cp-vide">La courbe apparaîtra dès qu\'il y aura deux semaines de calls.</p>';
  const W = 900, H = 230, g = 36, d = 14, hh = 20, bas = 30;
  const x = i => g + i * (W - g - d) / (sem.length - 1), y = v => hh + (100 - v) * (H - hh - bas) / 100;
  const chemin = vals => vals.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean).map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const grille = sem.map(s => s.grille), signes = sem.map(s => s.calls ? Math.round(s.signes / s.calls * 100) : null);
  const ent = sem.map((s, i) => { const deb = new Date(s.semaine + "T00:00:00").getTime(), fin = deb + 7 * 86400000; return CP.entrainements.filter(e => e.t >= deb && e.t < fin).length; });
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Progression par semaine">`;
  [0, 25, 50, 75, 100].forEach(v => svg += `<line x1="${g}" x2="${W - d}" y1="${y(v)}" y2="${y(v)}" stroke="#2B2A28" stroke-width="1"/><text x="${g - 8}" y="${y(v) + 4}" fill="#8F8B85" font-size="11" text-anchor="end">${v}</text>`);
  ent.forEach((n, i) => { if(n) svg += `<rect x="${x(i) - 9}" y="${H - bas - Math.min(60, n * 12)}" width="18" height="${Math.min(60, n * 12)}" rx="3" fill="#3A3833"><title>${n} entraînement(s)</title></rect>`; });
  svg += `<path d="${chemin(signes)}" fill="none" stroke="#A3AEB8" stroke-width="2" stroke-dasharray="5 5"/>`;
  svg += `<path d="${chemin(grille)}" fill="none" stroke="#C9B28C" stroke-width="2.5"/>`;
  grille.forEach((v, i) => { if(v != null) svg += `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#C9B28C"><title>Semaine du ${sem[i].semaine} : grille ${v} %, ${sem[i].signes}/${sem[i].calls} signés</title></circle>`; });
  sem.forEach((s, i) => { if(i % Math.ceil(sem.length / 8) === 0 || i === sem.length - 1) svg += `<text x="${x(i)}" y="${H - 8}" fill="#8F8B85" font-size="11" text-anchor="middle">${jour(s.semaine + "T12:00:00")}</text>`; });
  svg += "</svg>";
  return `<div class="cp-graph">${svg}</div><div class="cp-legende"><span><i style="background:#C9B28C"></i>Grille respectée (%)</span>
    <span><i style="background:#A3AEB8"></i>Calls signés (%)</span><span><i style="background:#3A3833;height:9px"></i>Tes entraînements</span></div>`;
}

/* ---------------------------------------------------------------------
   Coaching
   --------------------------------------------------------------------- */
async function ouvreCoaching(phaseOuverte){
  montre(ecCoaching);
  rendCoaching(phaseOuverte);
  if(!CP.stats && CP.suiviErreur !== "non connecté"){ await chargeSuivi(); rendCoaching(phaseOuverte); }
}
function rendCoaching(phaseOuverte){
  const el = $("cpCoachingIn"), st = CP.stats;
  const enCours = CP.seances.filter(s => s.etat !== "terminee").sort((a, b) => b.maj - a.maj);
  const faibles = st ? (st.grille.faiblesses || []).map(f => f.k) : [];
  const phases = lignesGrille().filter(l => l.n && l.taux != null).sort((a, b) => { const fa = faibles.indexOf(a.k), fb = faibles.indexOf(b.k);
    return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb) || (a.taux - b.taux); });
  let h = `<div class="cp-haut"><button class="cp-lien" id="cpCoRetour">← Accueil</button></div>
    <h1 class="cp-titre">Coaching</h1><p class="cp-sous">Choisis ton coach, puis ce que tu travailles. Tu peux t'arrêter quand tu veux : la séance t'attend.</p>
    <div class="cp-coachs">${coachs().map(c => `<button class="cp-coach ${c.k === CP.qui ? "on" : ""}" data-coach="${escapeHTML(c.k)}"><div class="cp-mini">${miniature(c.k)}</div>${escapeHTML(c.nom)}</button>`).join("")}</div>
    <div class="cp-onglets">
      <button data-onglet="phases" class="${CP.onglet === "phases" ? "on" : ""}">Phases à travailler</button>
      <button data-onglet="analyse" class="${CP.onglet === "analyse" ? "on" : ""}">Analyse de call</button>
      <button data-onglet="roleplay" class="${CP.onglet === "roleplay" ? "on" : ""}">Roleplay</button>
      <button data-onglet="qr" class="${CP.onglet === "qr" ? "on" : ""}">Questions-réponses</button>
    </div>`;
  if(enCours.length) h += `<div class="cp-carte"><h4>À reprendre</h4>${enCours.slice(0, 5).map(s => `<div class="cp-ligne"><div class="cp-l1"><b>${escapeHTML(s.titre)}</b>
      <small>${escapeHTML(coachDe(s.qui).nom)} · ${jour(s.debut)} · ${(n => n + " réponse" + (n > 1 ? "s" : ""))(s.conv.filter(m => m.role === "moi").length)} de ta part</small></div>
      <button class="cp-btn plein" data-reprendre="${s.id}">Reprendre</button><button class="cp-btn" data-clore="${s.id}" title="La ranger sans bilan">Ranger</button></div>`).join("")}</div>`;
  if(CP.onglet === "phases"){
    if(!st) h += formulaireSuivi();
    else if(!phases.length) h += '<div class="cp-carte"><p class="cp-vide">Pas encore de call analysé avec la grille. Dès qu\'il y en aura, tes phases à travailler apparaîtront ici.</p></div>';
    else h += `<div class="cp-carte"><h4>Tes phases, de la plus urgente à la plus solide</h4>${phases.map(l => {
      const a = avantApres(l.k), rates = callsRates(l.k), ouverte = phaseOuverte === l.k;
      return `<div class="cp-ligne" style="flex-wrap:wrap"><div class="cp-l1"><b>${escapeHTML(l.nom)}</b>${faibles.includes(l.k) ? ' <span class="cp-pastille mi">priorité</span>' : ""}
          <small>${l.taux} % de tes calls${l.signe_si_rate != null ? " · quand tu le rates, tu signes " + l.signe_si_rate + " %" : ""}${a ? " · " + a.fois + " entraînement" + (a.fois > 1 ? "s" : "") : ""}</small></div>
        <div class="cp-barre"><i style="width:${l.taux}%"></i></div>
        <div class="cp-btns"><button class="cp-btn plein" data-entrainer="${l.k}">M'entraîner</button><button class="cp-btn" data-comprendre="${l.k}">Comprendre</button>
          <button class="cp-btn" data-voir="${l.k}">${rates.length} call${rates.length > 1 ? "s" : ""} raté${rates.length > 1 ? "s" : ""}</button></div>
        ${ouverte ? `<div style="flex-basis:100%;padding:8px 0 0 14px;border-left:2px solid var(--line);margin-top:8px">${rates.slice(0, 8).map(c => `<div class="cp-ligne"><div class="cp-l1">${escapeHTML(nomCall(c))}
            <small>${escapeHTML(c.date || "")} · ${escapeHTML(c.grille[l.k].p || c.grille[l.k].s)}</small></div>${etiquetteIssue(c.issue)}<button class="cp-btn" data-analyser="${escapeHTML(c.id)}" data-phase="${l.k}">Analyser</button></div>`).join("") || '<p class="cp-vide">Aucun.</p>'}</div>` : ""}
      </div>`; }).join("")}</div>`;
  } else if(CP.onglet === "analyse"){
    h += st ? `<div class="cp-carte"><h4>Choisis un call : ton coach le lit avec toi</h4>${CP.calls.slice(0, 30).map(c => `<div class="cp-ligne"><div class="cp-l1"><b>${escapeHTML(nomCall(c))}</b>
      <small>${escapeHTML(c.date || "")} · ${escapeHTML(c.etape || "")}${scoreCall(c) != null ? " · grille " + scoreCall(c) + " %" : ""}</small></div>${etiquetteIssue(c.issue)}
      <button class="cp-btn plein" data-analyser="${escapeHTML(c.id)}">Analyser</button></div>`).join("") || '<p class="cp-vide">Aucun call.</p>'}</div>` : formulaireSuivi();
  } else if(CP.onglet === "roleplay"){
    h += `<div class="cp-carte"><h4>Roleplay</h4><p class="cp-vide" style="margin-bottom:14px">Le plus utile : un prospect construit pour la phase que tu rates le plus. Ou un roleplay libre.</p>
      <div class="cp-btns">${faibles.slice(0, 3).map(k => `<button class="cp-btn plein" data-entrainer="${k}">Sur « ${escapeHTML(nomPhase(k))} »</button>`).join("")}
      <button class="cp-btn" id="cpRpLibre">Roleplay libre</button></div></div>`;
  } else {
    h += `<div class="cp-carte"><h4>Questions-réponses</h4><p class="cp-vide" style="margin-bottom:14px">Raconte un call, une situation, un doute. Il te fera chercher avant de te répondre.</p>
      <button class="cp-btn plein" id="cpNouvelleQR">Nouvelle séance avec ${escapeHTML(coachCourant().nom)}</button></div>`;
  }
  h += `<div class="cp-carte" id="cpMemoire" style="display:none"></div>`;
  const finies = CP.seances.filter(s => s.etat === "terminee").sort((a, b) => b.maj - a.maj).slice(0, 6);
  if(finies.length) h += `<div class="cp-carte"><h4>Tes dernières séances</h4>${finies.map(s => `<div class="cp-ligne"><div class="cp-l1"><b>${escapeHTML(s.titre)}</b>
      <small>${jour(s.maj)} · ${escapeHTML(coachDe(s.qui).nom)}${s.bilan ? " · " + escapeHTML(s.bilan.slice(0, 140)) + (s.bilan.length > 140 ? "…" : "") : ""}</small></div>
      <button class="cp-btn" data-relire="${s.id}">Relire</button></div>`).join("")}</div>`;
  el.innerHTML = h;
  rendMemoire();
  $("cpCoRetour").onclick = accueil;
  brancheFormulaireSuivi(() => rendCoaching());
  el.querySelectorAll("[data-coach]").forEach(b => b.onclick = () => { CP.qui = b.dataset.coach; sauve(); rendCoaching(phaseOuverte); });
  el.querySelectorAll("[data-onglet]").forEach(b => b.onclick = () => { CP.onglet = b.dataset.onglet; rendCoaching(); });
  el.querySelectorAll("[data-reprendre]").forEach(b => b.onclick = () => reprend(b.dataset.reprendre));
  el.querySelectorAll("[data-relire]").forEach(b => b.onclick = () => reprend(b.dataset.relire));
  el.querySelectorAll("[data-clore]").forEach(b => b.onclick = () => { const s = CP.seances.find(x => x.id === b.dataset.clore); if(s){ s.etat = "terminee"; s.maj = Date.now(); sauve(); memoSeance(s); rendCoaching(); } });
  el.querySelectorAll("[data-entrainer]").forEach(b => b.onclick = () => entrainePhase(b.dataset.entrainer, b));
  el.querySelectorAll("[data-comprendre]").forEach(b => b.onclick = () => nouvelleSeance({type: "phase", k: b.dataset.comprendre, titre: "Comprendre : " + nomPhase(b.dataset.comprendre),
      ouverture: "Je veux travailler « " + nomPhase(b.dataset.comprendre) + " ». D'après ma grille, je le réussis dans " + ((lignesGrille().find(l => l.k === b.dataset.comprendre) || {}).taux ?? "?") + " % de mes calls. Aide-moi à comprendre ce que je rate."}));
  el.querySelectorAll("[data-voir]").forEach(b => b.onclick = () => rendCoaching(phaseOuverte === b.dataset.voir ? null : b.dataset.voir));
  el.querySelectorAll("[data-analyser]").forEach(b => b.onclick = () => nouvelleAnalyse(CP.calls.find(c => c.id === b.dataset.analyser), b.dataset.phase));
  if($("cpRpLibre")) $("cpRpLibre").onclick = () => lanceRoleplay("");
  if($("cpNouvelleQR")) $("cpNouvelleQR").onclick = () => nouvelleSeance({type: "qr", titre: "Questions-réponses"});
}

/* ce que tes coachs ont en tête : le même fil que celui qu'ils relisent */
async function rendMemoire(){
  let rp = []; try{ rp = (await filLit()).filter(e => e.type === "roleplay" && (e.t || 0) > DEPART_FIL); }catch(_){}
  const el = $("cpMemoire"); if(!el) return;
  const l = rp.map(e => ({t: e.t, titre: e.titre, txt: e.a_travailler || e.faute || e.vu || ""}))
    .concat(CP.seances.filter(s => (s.maj || 0) > DEPART_FIL && (s.conv.some(m => m.role === "moi") || s.plan))
      .map(s => ({t: s.maj, titre: s.titre, txt: (s.memo && s.memo.txt) || s.bilan || (s.call && s.call.joue && s.call.joue.quoi) || ""})))
    .sort((a, b) => b.t - a.t);
  if(!l.length) return;
  el.style.display = "block";
  el.innerHTML = `<h4>Ce que tes coachs ont en mémoire</h4>
    <p class="cp-vide" style="font-size:12.5px;margin-bottom:8px">${l.length} moment${l.length > 1 ? "s" : ""} de travail gardé${l.length > 1 ? "s" : ""} (analyses de calls, séances, roleplays). À chaque séance, ton coach relit les 14 plus récents et fait les liens entre eux.</p>
    ${l.slice(0, 6).map(x => `<div class="cp-ligne"><div class="cp-l1"><b>${escapeHTML(x.titre)}</b>
      <small>${jour(x.t)}${x.txt ? " · " + escapeHTML(x.txt.slice(0, 150)) + (x.txt.length > 150 ? "…" : "") : ""}</small></div></div>`).join("")}`;
}

/* un prospect construit pour la phase que tu rates, à partir de tes vrais calls */
async function entrainePhase(k, bouton){
  const l = lignesGrille().find(x => x.k === k) || {nom: k};
  const ex = ((CP.stats || {}).grille.faiblesses || []).find(f => f.k === k);
  const rates = callsRates(k).slice(0, 4).map(c => "- " + (c.etape || "") + " " + (c.offre || "") + " : " + (c.resume || "") + (c.grille[k].p ? " (ce qui s'est passé : " + c.grille[k].p + ")" : "")).join("\n");
  if(bouton){ bouton.disabled = true; bouton.textContent = "Je prépare ton prospect…"; }
  let desc = "";
  try{
    desc = await appelCerveau(`${nomProfil()}, ${profil().feminin ? "closeuse" : "closer"} high ticket, veut s'entraîner en roleplay sur une phase précise de son call : « ${l.nom} ». Il la réussit dans ${l.taux ?? "?"} % de ses calls.
${ex && ex.exercice ? "Exercice conseillé : " + ex.exercice + "\n" : ""}${rates ? "Ses vrais calls où il l'a ratée :\n" + rates + "\n" : ""}
Écris la description du prospect qu'une IA va jouer, en 4 à 6 phrases : qui il est, sa situation (avec des chiffres seulement s'il en a de vrais), ce qu'il vit au quotidien, son caractère, ce qu'il cache.
Il doit ressembler aux prospects réels ci-dessus (même type de marché, même offre), et rendre cette phase difficile à réussir sans la rendre impossible : il ne donne l'information que si ${nomProfil()} pose la bonne question et creuse.
Termine par une phrase « Objectif de l'exercice : … » qui dit précisément ce que ${nomProfil()} doit obtenir. Réponds avec la description seule, sans titre ni liste.`, {max: 600, effort: "low"});
  }catch(e){ toast("Je n'ai pas pu préparer le prospect : " + e.message); }
  if(bouton){ bouton.disabled = false; bouton.textContent = "M'entraîner"; }
  if(!desc) return;
  CP.entrainements.push({t: Date.now(), k, type: "roleplay"}); sauve();
  lanceRoleplay(desc.trim());
}
function lanceRoleplay(scenario){
  arreteVoix();
  montre(null); home.style.display = "none";
  $("btnSpar").click();
  setTimeout(() => {
    const d = $("sparDesc");
    if(d && scenario){ d.value = scenario; d.dispatchEvent(new Event("input", {bubbles: true})); d.scrollIntoView({block: "center"}); }
    if(scenario) toast("Ton prospect est prêt. Lance le roleplay.");
  }, 400);
}

/* ---------------------------------------------------------------------
   Les séances : on s'arrête, on reprend un autre jour
   --------------------------------------------------------------------- */
// un testeur : chaque nouvelle séance compte dans son essai (le serveur refuse au bout)
async function annonceCoaching(){
  if(!TESTEUR) return true;
  try{
    const r = await fetch(srvCopilote() + "/api/exercice", {method: "POST", headers: {"Content-Type": "application/json", "x-code": codeAcces()}, body: JSON.stringify({type: "coaching"})});
    const d = await r.json().catch(() => ({}));
    if(d.essai) CP.essai = d.essai;
    if(r.status === 402){ toast(d.erreur || "Ton essai est arrivé au bout."); return false; }
    return true;
  }catch(_){ return true; }          // réseau capricieux : on ne bloque pas la séance
}
async function nouvelleSeance(o){
  if(!(await annonceCoaching())) return false;
  rattrapeMemos();
  const s = {id: "s" + Date.now(), titre: o.titre || "Séance", type: o.type || "qr", k: o.k || null, call: o.call || null,
             qui: CP.qui, conv: [], etat: "en_cours", debut: Date.now(), maj: Date.now(), texte: o.texte || ""};
  CP.seances.push(s); CP.actuelle = s.id;
  if(s.k) CP.entrainements.push({t: Date.now(), k: s.k, type: s.type});
  sauve(); ouvreSeance();
  if(o.ouverture){ $("cpMoi").value = o.ouverture; envoie(); }
  else if(!o.silence){ s.conv.push({role: "coach", nom: coachDe(s.qui).court, t: Date.now(), txt: ouvertureCoach()}); sauve(); rendFil(); }
  return true;
}
function ouvertureCoach(){
  const d = devoirsOuverts().slice(-1)[0];
  return d ? "Avant tout : la dernière fois, je t'ai demandé ça. « " + d.txt + " » Tu l'as fait ? Raconte-moi ce que ça a donné."
           : "Salut. Raconte-moi ton dernier call, ou ce qui te bloque en ce moment. On part de là.";
}
async function nouvelleAnalyse(c, k){
  if(!c) return;
  if(!(await nouvelleSeance({type: "analyse", titre: "Analyse : " + nomCall(c) + " (" + (c.date || "") + ")", call: c, k: k || null, silence: true}))) return;
  const s = seance();
  $("cpCallJoint").textContent = "Je récupère la transcription…";
  try{ s.texte = await suivi("/api/call/" + encodeURIComponent(c.id) + "/transcript"); }catch(e){ toast("Transcription non récupérée : " + e.message); }
  majCallJoint();
  // comme Josh avant une revue : il lit tout le call, puis il annonce où on va
  if(await preparePlan(s, k)) return;
  $("cpMoi").value = k ? "Analyse ce call avec moi, surtout « " + nomPhase(k) + " »." : "Analyse ce call avec moi.";
  envoie();
}

/* ---------------------------------------------------------------------
   La carte de la séance : d'où on part, où on va, et pourquoi
   --------------------------------------------------------------------- */
const ACCORDS = [["probleme", "Un problème qui le brûle"], ["desir", "Un vrai désir de le régler"], ["seul", "Il ne peut pas seul"], ["confiance", "Il croit en l'offre, et pourquoi maintenant"]];
const minuteOk = v => /^\d{1,3}:\d\d$/.test(String(v || "").trim()) ? String(v).trim() : null;
function litJsonCoach(txt){
  let t = String(txt || "").replace(/```json|```/g, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if(a < 0 || b < a) return null;
  t = t.slice(a, b + 1);
  try{ return JSON.parse(t); }catch(_){ try{ return JSON.parse(t.replace(/,(\s*[}\]])/g, "$1")); }catch(__){ return null; } }
}
function promptPlan(s, k, fil){
  const dest = coachCourant().k === "keenan"
    ? "l'écart entre sa situation actuelle et la situation qu'il vise, ce que cet écart lui coûte, et pourquoi le combler maintenant"
    : "les quatre accords qui font une vente : un problème qui le brûle ; un vrai désir de le régler ; il admet qu'il ne peut pas le régler seul ; il croit que l'offre peut l'aider, et il sait pourquoi maintenant";
  return `${texteProfil()}${fil ? "\n" + TITRE_FIL + "\n" + fil + "\nSi ce call répète quelque chose de ce fil (la même faute, le même moment qui lâche), tu le relies dans ton premier message : c'est souvent là que se trouve le vrai travail.\n" : ""}${texteDuCall(s)}
${k ? "Il veut surtout travailler « " + nomPhase(k) + " ».\n" : ""}
Avant de commencer la séance, tu lis tout ce call comme pour une revue de call, et tu prépares la carte de la séance : d'où il part, où vous allez, et pourquoi.
1. La destination d'un call de vente, c'est ${dest}. Pour chacun des quatre accords : obtenu ou non dans ce call, et à quelle minute si la transcription a les minutes.
2. Le temps : en une ou deux phrases, où le temps de ce call est passé. Par exemple : « 15 minutes sur le budget avant d'avoir compris son problème ». Une découverte complète tient en général en une vingtaine de minutes.
3. Les 2 ou 3 moments qui ont décidé de ce call, dans l'ordre du call : ceux où le travailler changera le plus ses prochains calls. Pour chacun : la minute, un titre court, et ce qu'il doit savoir faire à la fin de ce moment.
4. Ce qu'il saura faire à la fin de la séance, en une phrase.
5. Ton premier message, à l'oral, en tutoyant, 5 à 8 phrases sans liste : le call en une phrase, ce que ce call devait obtenir, où ça s'est joué, les moments que vous allez faire dans l'ordre et pourquoi ceux-là, puis ta première question sur le premier moment.
Réponds uniquement avec ce JSON :
{"accords":{"probleme":{"ok":true,"minute":"mm:ss ou null"},"desir":{"ok":false,"minute":null},"seul":{"ok":false,"minute":null},"confiance":{"ok":false,"minute":null}},
 "temps":"où le temps du call est passé","moments":[{"minute":"mm:ss ou null","titre":"titre court","objectif":"ce qu'il saura faire à la fin de ce moment"}],
 "but":"ce qu'il saura faire à la fin de la séance","ouverture":"ton premier message"}`;
}
async function preparePlan(s, k){
  const c = coachCourant();
  CP.enCours = true; $("cpEtat").textContent = c.court + " lit tout ton call et prépare la séance…";
  try{
    let fil = ""; try{ fil = await texteFil(14, s); }catch(_){}
    const j = litJsonCoach(await appelCerveau(promptPlan(s, k, fil), {systeme: systemeCoach(), max: 1800, effort: "medium"}));
    const moments = (j && Array.isArray(j.moments) ? j.moments : []).filter(m => m && m.titre).slice(0, 3)
      .map(m => ({minute: minuteOk(m.minute), titre: String(m.titre).slice(0, 90), objectif: m.objectif ? String(m.objectif).slice(0, 200) : ""}));
    if(!moments.length || !j.ouverture) throw new Error("carte illisible");
    const accords = {};
    ACCORDS.forEach(([a]) => { const v = j.accords && j.accords[a]; if(v && typeof v.ok === "boolean") accords[a] = {ok: v.ok, minute: minuteOk(v.minute)}; });
    const ouverture = String(j.ouverture).replace(/<<[\s\S]*?>>/g, "").trim();
    s.conv.push({role: "coach", nom: c.court, txt: ouverture, t: Date.now()});
    s.plan = {moments, courant: 0, debut: s.conv.length, but: j.but ? String(j.but).slice(0, 220) : "", temps: j.temps ? String(j.temps).slice(0, 300) : "",
              accords: Object.keys(accords).length ? accords : null};
    s.maj = Date.now(); sauve(); rendFil(); rendPlan();
    $("cpEtat").textContent = "";
    await parle(ouverture);
    return true;
  }catch(e){
    $("cpEtat").textContent = "";
    return false;
  }finally{ CP.enCours = false; }
}
function rendPlan(){
  const s = seance(), el = $("cpPlan");
  if(!s || !s.plan){ el.style.display = "none"; el.innerHTML = ""; return; }
  const p = s.plan, fini = p.courant >= p.moments.length;
  el.style.display = "block";
  el.innerHTML = `<h4>Où on va</h4>${p.but ? `<p style="font-size:14px;margin-bottom:8px">${escapeHTML(p.but)}</p>` : ""}
    <div>${p.moments.map((m, i) => `<div class="cp-etape ${i < p.courant ? "fait" : i === p.courant ? "cours" : ""}"><span class="cp-num">${i < p.courant ? "✓" : i + 1}</span>
      <span><b>${m.minute ? "Minute " + escapeHTML(m.minute) + " · " : ""}${escapeHTML(m.titre)}</b>${m.objectif ? `<small>${escapeHTML(m.objectif)}</small>` : ""}</span></div>`).join("")}
      <div class="cp-etape ${fini ? "cours" : ""}"><span class="cp-num">${p.moments.length + 1}</span><span><b>Ce que tu retiens</b><small>Puis le bilan et ton travail pour la prochaine fois.</small></span></div></div>
    ${p.accords ? `<div class="cp-btns" style="margin-top:12px;gap:6px">${ACCORDS.filter(([a]) => p.accords[a]).map(([a, nom]) => { const x = p.accords[a];
      return `<span class="cp-pastille ${x.ok ? "ok" : "ko"}">${x.ok ? "✓" : "✗"} ${escapeHTML(nom)}${x.ok && x.minute ? " · " + escapeHTML(x.minute) : ""}</span>`; }).join("")}</div>
      <p style="font-size:12px;color:var(--muted);margin-top:6px">Les quatre accords, dans ton vrai call.</p>` : ""}
    ${p.temps ? `<p style="font-size:13px;color:var(--muted);margin-top:8px">${escapeHTML(p.temps)}</p>` : ""}`;
}
function textePlan(s){
  if(!s || !s.plan) return "";
  const p = s.plan, n = p.moments.length;
  const ech = s.conv.slice(p.debut || 0).filter(m => m.role === "moi" && !m.question).length;
  const liste = p.moments.map((m, i) => `  ${i + 1}. ${m.minute ? "[" + m.minute + "] " : ""}${m.titre}${m.objectif ? " — à la fin, il sait : " + m.objectif : ""} (${i < p.courant ? "fait" : i === p.courant ? "EN COURS" : "à venir"})`).join("\n");
  const ou = p.courant >= n
    ? "Tous les moments sont faits. Demande-lui ce qu'il retient de la séance, une ou deux choses avec ses mots, réagis-y, puis propose-lui de terminer la séance pour avoir son bilan."
    : `Vous travaillez le moment ${p.courant + 1} sur ${n}. Ça fait ${ech} échange${ech > 1 ? "s" : ""} sur ce moment.` +
      (ech >= 6 ? " C'est trop long : conclus ce moment maintenant (donne-lui la phrase juste s'il ne l'a pas trouvée) et passe au suivant." : "");
  return `\nLA CARTE DE CETTE SÉANCE (il la voit à l'écran) :
Ce qu'il saura faire à la fin : ${p.but || "—"}
${liste}
${ou}
Sur un moment, tu fais comme en revue de call : tu le replaces dans le call (la minute, ce qui s'est dit), tu lui demandes ce qu'il cherchait à obtenir à cet endroit, tu lui montres pourquoi ça n'a pas marché en le reliant à la destination du call, et tu lui fais refaire sa phrase (deux essais, puis tu donnes la tienne et il la redit avec ses mots). Tu ne pars pas dans un détail qui ne sert pas ce moment.
Quand le moment est réglé (il a compris pourquoi et il a dit une phrase juste), tu fais le point en une phrase (« on a ça, maintenant on va là »), tu ouvres directement le moment suivant dans le même message, et tu écris <<MOMENT_FAIT>> seul sur la dernière ligne.
`;
}
async function reprend(id){
  const s = CP.seances.find(x => x.id === id); if(!s) return;
  CP.actuelle = id; CP.qui = s.qui || CP.qui;
  if(s.call && !s.texte){ try{ s.texte = await suivi("/api/call/" + encodeURIComponent(s.call.id) + "/transcript"); }catch(_){} }
  // après une pause d'au moins quelques heures, il reprend le fil lui-même
  const dernier = s.conv[s.conv.length - 1];
  if(s.etat !== "terminee" && dernier && Date.now() - (dernier.t || 0) > 4 * 3600000){
    const q = [...s.conv].reverse().find(m => m.role === "coach");
    s.conv.push({role: "coach", nom: coachDe(s.qui).court, t: Date.now(), reprise: true,
      txt: "On reprend où on s'était arrêtés" + (q ? ". Je t'avais dit : « " + q.txt.slice(0, 260) + (q.txt.length > 260 ? "…" : "") + " » Vas-y." : ". Vas-y.")});
  }
  if(s.etat === "terminee") s.etat = "en_cours";
  sauve(); ouvreSeance();
}
function ouvreSeance(){
  const s = seance(); if(!s) return;
  montre(sec);
  $("cpTitreSeance").textContent = s.titre;
  majQui(); rendAvatar(); majVoixChoix(); rendFil(); rendDevoirs(); majCallJoint(); rendPlan();
  $("cpEntrainer").style.display = "none";
  setTimeout(() => { sec.scrollTop = sec.scrollHeight; }, 50);
}
function majCallJoint(){ const s = seance(); $("cpCallJoint").textContent = s && s.call ? "On parle du call : " + nomCall(s.call) + " (" + (s.call.date || "") + ")" + (s.texte ? "" : " · sans transcription") : ""; }
$("cpPause").onclick = () => { const s = seance(); if(s){ s.maj = Date.now(); sauve(); memoSeance(s); } arreteVoix(); toast("Séance gardée. Tu la retrouves dans Coaching, « À reprendre »."); ouvreCoaching(); };
$("cpRetour").onclick = $("cpPause").onclick;
$("cpTerminer").onclick = async () => {
  const s = seance(); if(!s) return;
  if(s.conv.filter(m => m.role === "moi").length < 2){ s.etat = "terminee"; s.maj = Date.now(); sauve(); memoSeance(s); return ouvreCoaching(); }
  $("cpMoi").value = "On s'arrête là pour cette séance. Fais-moi le bilan : ce que j'ai compris, ce qui reste fragile, et ce que je dois travailler d'ici la prochaine fois.";
  await envoie(true);
  s.etat = "terminee"; s.maj = Date.now();
  const der = [...s.conv].reverse().find(m => m.role === "coach"); if(der) s.bilan = der.txt;
  sauve(); memoSeance(s);
  $("cpEtat").innerHTML = 'Séance terminée. <a href="#" id="cpVersCoaching" style="color:var(--ink)">Retour au coaching</a>';
  $("cpVersCoaching").onclick = e => { e.preventDefault(); ouvreCoaching(); };
};

/* ---------------------------------------------------------------------
   Le cerveau du coach
   --------------------------------------------------------------------- */
const NOMS_G = {cadrage:"cadrage", situation:"situation réelle", probleme:"problème creusé", impact:"ce que ça lui coûte (vécu ou chiffré)", cause:"cause et tentatives", vise:"objectif et pourquoi", ecart:"écart ressenti (émotionnel ou chiffré)", enjeu:"enjeu personnel", declencheur:"pourquoi maintenant", responsabilite:"sa responsabilité", plan_b:"plan B fermé", decision:"circuit de décision", presentation:"présentation au bon moment", objections:"objections ramenées à son but", engagement:"engagement verrouillé"};
function texteDuCall(s){
  if(!s || !s.call) return "";
  const c = s.call;
  const g = c.grille ? Object.keys(NOMS_G).filter(k => c.grille[k] && c.grille[k].s !== "na")
      .map(k => "  - " + NOMS_G[k] + " : " + c.grille[k].s + (c.grille[k].p ? " (« " + c.grille[k].p + " »)" : "")).join("\n") : "";
  const j = c.joue ? `Là où tout s'est joué${c.joue.minute ? " (minute " + c.joue.minute + ")" : ""} : ${c.joue.quoi || ""}${c.joue.pourquoi ? " — " + c.joue.pourquoi : ""}${c.joue.a_dire ? " — il aurait pu dire : « " + c.joue.a_dire + " »" : ""}\n` : "";
  const d = (c.deroule || []).length ? "Le déroulé" + (c.duree_min ? " (" + c.duree_min + " min)" : "") + " :\n" + c.deroule.map(p => `  - ${p.de || "?"}${p.a ? "–" + p.a : ""} ${p.partie}${p.note ? " : " + p.note : ""}`).join("\n") + "\n" : "";
  const minutes = /^\[\d+:\d\d\]/m.test(s.texte || "");
  return `\nLE CALL DONT IL VEUT PARLER (${c.date || ""}, ${c.etape || ""}, ${c.offre || ""}, issue : ${c.issue || "?"}${c.duree_min ? ", " + c.duree_min + " minutes" : ""}) :
Résumé : ${c.resume || "—"}
${j}${!c.joue && c.bascule ? "Moment de bascule : " + c.bascule + "\n" : ""}${d}${g ? "Sa grille sur ce call :\n" + g + "\n" : ""}${s.texte ? "LA TRANSCRIPTION" + (minutes ? " (chaque ligne commence par sa minute [mm:ss] : cite-la quand tu parles d'un moment)" : "") + " :\n" + s.texte.slice(0, 80000) : "(transcription non disponible)"}\n`;
}
function texteProfil(){
  const s = CP.stats; if(!s) return "";
  const g = s.grille || {};
  const lignes = (g.lignes || []).filter(l => l.n).map(l => `  - ${l.nom} : ${l.taux} %` + (l.signe_si_fait != null && l.signe_si_rate != null ? ` (signe ${l.signe_si_fait} % quand il le fait, ${l.signe_si_rate} % quand il le rate)` : "")).join("\n");
  const trav = [...new Set(CP.entrainements.map(e => e.k).filter(Boolean))].map(k => { const a = avantApres(k); return a ? `  - ${nomPhase(k)} : ${a.fois} entraînements, ${a.avant ?? "?"} % avant, ${a.nApres ? a.apres + " % depuis (" + a.nApres + " calls)" : "pas encore de call depuis"}` : ""; }).filter(Boolean).join("\n");
  return `\nSES CHIFFRES DES 45 DERNIERS JOURS (depuis son suivi) : ${s.calls} calls, ${s.signes} signés, taux par prospect ${s.taux_prospect ?? "?"} %.
${lignes ? "Sa grille, point par point :\n" + lignes : ""}
${(g.faiblesses || []).length ? "Ses points faibles prioritaires : " + g.faiblesses.map(f => f.nom).join(", ") + "." : ""}
(Cette grille mesure la structure du call, pas la qualité humaine de l'écoute. Si d'anciens calls ont été notés avec l'ancienne grille, un écart ou un impact « raté » veut peut-être seulement dire « pas chiffré » : vérifie dans le call si le prospect a ressenti son écart avant de lui reprocher quoi que ce soit.)
${trav ? "Ce qu'il a déjà travaillé avec toi, et l'effet sur ses vrais calls :\n" + trav : ""}\n`;
}
function systemeCoach(){
  const c = coachCourant();
  const maniere = (typeof MANIERE_COACH === "object" && MANIERE_COACH[c.k]) ? MANIERE_COACH[c.k].ton : "";
  let cerveau = "", vraieTete = false;
  if(c.k === "mix"){
    // Josh d'abord : c'est sa façon de penser qui guide. Keenan ne sert que de complément sur la structure B2B.
    const josh = DOCTRINES["josh lyons"], keenan = DOCTRINES["keenan"];
    if(josh && josh.cerveau){
      vraieTete = true;
      cerveau = "### TA TÊTE\n" + josh.cerveau +
        (keenan && keenan.cerveau ? "\n\n### CE QUE TU AS AUSSI APPRIS D'UN AUTRE COACH (Keenan, Gap Selling) : une structure, à n'utiliser que pour organiser une découverte B2B quand le prospect raisonne lui-même en entreprise et en chiffres. Elle ne remplace jamais ta façon d'écouter l'humain.\n" + keenan.cerveau : "");
    }
    else cerveau = doctrinePour([], "", 45000);
  }
  else if(DOCTRINES[c.k] && DOCTRINES[c.k].cerveau){ vraieTete = true; cerveau = "### TA TÊTE\n" + DOCTRINES[c.k].cerveau; }
  else {
    const f = (FICHES || []).filter(x => x.ecole === (c.src || c.k)).slice(0, 60);
    cerveau = "### CE QUE " + c.nom.toUpperCase() + " ENSEIGNE (ses principes et ses phrases, à faire passer par ta propre réflexion, jamais à réciter)\n" +
      f.map(x => "- " + (x.situation ? x.situation + " → " : "") + "« " + x.phrase + " »" + (x.pourquoi ? " (" + x.pourquoi + ")" : "")).join("\n");
  }
  const quiTuEs = vraieTete
    ? `Le texte en bas de ce message, c'est ta propre tête : ce que tu as vécu, ta façon de voir les gens, d'écouter un call et de coacher un closer. Tu penses avec, comme un homme pense avec son expérience. Tu ne le récites pas, tu n'en cites pas de passages, tu ne nommes pas de méthode.
Les scènes qui y sont racontées sont des souvenirs de vrais calls : elles t'aident à reconnaître ce qui se passe, tu ne les plaques pas sur une situation qui ne leur ressemble pas. Chaque prospect est une personne différente, et ce qui compte pour lui peut être de l'argent, son couple, sa santé, ses enfants, l'image qu'il a de lui ou tout autre chose.`
    : `Tu as passé des années au téléphone avec des prospects, puis à former des closers. Ce qui est en bas de ce message, c'est ce que ce coach enseigne : tu le fais passer par ta propre réflexion, comme quelqu'un qui l'a longtemps écouté, et tu ne le récites jamais. Chaque prospect est une personne différente, et ce qui compte pour lui peut être de l'argent, son couple, sa santé, ses enfants, l'image qu'il a de lui ou tout autre chose.`;
  return `Tu es ${c.k === "mix" ? "le coach personnel" : c.nom + ", le coach personnel"} de ${nomProfil()}, ${profil().desc}. ${profil().feminin ? "Elle" : "Il"} te parle en dehors de ses calls : pour comprendre ce qui s'est passé, et pour progresser.${profil().feminin ? "\nC'est une femme : tu lui parles au féminin. Dans les consignes ci-dessous, « il » désigne " + nomProfil() + "." : ""}

QUI TU ES
Tu n'es pas un assistant, tu ne remplis pas de grille et tu ne récites rien. ${quiTuEs}
${c.k !== "keenan" ? "Un écart peut être chiffré ou simplement vécu. Si le prospect a dit, avec ses mots, ce que sa situation lui fait vivre, l'écart est posé, même sans un seul chiffre : tu ne reproches pas à ton élève de ne pas avoir chiffré.\n" : ""}
COMMENT TU PENSES AVANT DE RÉPONDRE
Avant chaque réponse, tu te demandes en silence : qu'est-ce qui se passe vraiment chez ce prospect, sous ce qu'il dit ? Qu'est-ce que mon élève n'a pas entendu ? Qu'est-ce que j'aurais vu, moi, à cet endroit du call ? Et de quoi mon élève a besoin maintenant : comprendre, essayer, ou se faire secouer ?
Tu ne prends pas un chemin tout fait. Tu réagis à ce qui est dit, comme dans une vraie conversation.

COMMENT TU COACHES
Tu commences par comprendre ce qui s'est vraiment passé, une question à la fois. Tu le fais chercher avant de lui donner ta réponse, et tu la donnes s'il bloque vraiment ou s'il te la demande deux fois.
Quand il te propose une phrase qu'il dirait en call, tu la lui fais refaire tant qu'elle ne sonne pas juste. Tu lui dis pourquoi elle ne touche pas le prospect, et tu lui en demandes une autre. Après deux essais, tu lui donnes la tienne et tu lui demandes de la redire avec ses mots.
Tu t'appuies sur le réel : les mots du prospect, ceux de ton élève, le moment exact du call si tu as la transcription.
Tu es franc. Tu nommes ce qu'il évite, y compris chez lui : sa peur de déranger, sa peur d'aller trop loin, son envie de passer vite à l'offre. Dur quand il le faut, jamais méprisant, et chaleureux quand il est découragé.
Pas de phrase magique. S'il cherche un raccourci, tu le lui dis, et tu le ramènes à ce qui fait progresser : comprendre, répéter, s'entraîner. Tu lui donnes souvent un travail précis, et tu le lui redemandes la fois suivante. Il peut mettre une séance en pause : c'est normal.

COMMENT TU CONDUIS UNE SÉANCE
Il doit toujours savoir d'où il part, où vous allez, et pourquoi. Dès ton premier vrai message, tu lui dis ce que vous cherchez à comprendre ou à obtenir dans cette séance.
La destination d'un call de vente, ${c.k === "keenan" ? "c'est l'écart entre sa situation actuelle et celle qu'il vise, ce que cet écart lui coûte, et pourquoi le combler maintenant" : "ce sont quatre accords : un problème qui le brûle ; un vrai désir de le régler ; il admet qu'il ne peut pas le régler seul ; il croit que l'offre peut l'aider, et il sait pourquoi maintenant"}. Chaque moment que vous travaillez est relié à cette destination, et tu le lui dis.
Un détail du call (le budget, ses chiffres, son taux de conversion, la technique de son métier) ne mérite du temps que s'il sert cette destination. Sinon tu le dis franchement, « ça, ce n'est pas là que ça s'est joué », et tu ramènes.
Tu as le chrono du call en tête : une découverte complète tient en général en une vingtaine de minutes. Si la transcription a les minutes, tu les cites, et tu lui dis quand il a passé trop de temps sur quelque chose.
Un point à la fois. Quand il est acquis, tu le dis, tu fais le point en une phrase (« on a ça, maintenant on va là ») et tu passes au suivant. Tu ne tournes pas plus de cinq ou six échanges sur le même point.
Quand ce n'est pas évident, ta question dit pourquoi tu la poses.
Quand vous avez fait le tour, tu lui demandes ce qu'il retient, avec ses mots, avant de conclure.

TA MÉMOIRE
Tu as en tête le fil de tout votre travail : ses analyses de calls, ses séances, ses roleplays, même ceux faits avec un autre coach ou laissés en pause. Il est écrit plus bas, dans « LE FIL DE VOTRE TRAVAIL ».
Tu fais les liens toi-même, comme un coach qui suit son élève depuis des semaines : quand la même faute revient d'un call ou d'un roleplay à l'autre, tu le lui dis (« c'est le troisième call où ça lâche au même endroit »), et quand il a corrigé quelque chose, tu le remarques.
S'il te parle d'un call, d'un exercice ou d'une séance d'avant, tu le cherches dans ce fil et tu t'en sers. Tu ne lui dis jamais que tu ne sais pas de quoi il parle si c'est dans le fil. Si ce n'est vraiment pas dedans, tu lui demandes de te le rappeler en une phrase.

COMMENT TU PARLES
Tu parles, tu n'écris pas. Pas de listes, pas de titres, pas de gras, pas d'émojis, pas de mots de consultant. Des phrases courtes, à l'oral, en tutoyant, avec tes réactions d'humain (« attends », « tu vois ce qui se passe là ? », « non, écoute-toi »). En général 2 à 6 phrases. Plus long seulement s'il te demande d'expliquer en détail, ou pour un bilan.
${maniere ? "\nTA MANIÈRE\n" + maniere + "\n" : ""}
DEUX REPÈRES, à mettre seulement quand c'est utile, chacun seul sur une ligne à la toute fin :
<<DEVOIR: le travail précis à faire avant votre prochain échange>>
<<ROLEPLAY: le prospect à jouer (qui il est, sa situation, son caractère) et l'objectif précis de l'exercice pour ${nomProfil()}>>

${cerveau}`;
}
/* --- la mémoire des séances : chaque séance quittée laisse un mémo, que tous les coachs relisent --- */
const TITRE_FIL = "LE FIL DE VOTRE TRAVAIL : tout ce qu'il a fait avec ses coachs (analyses de calls, séances, roleplays), du plus ancien au plus récent. C'est ta mémoire :";
function digestSeance(s){
  const c = s.call;
  const tete = s.titre + " (avec " + coachDe(s.qui).nom + (s.etat === "terminee" ? "" : ", pas terminée") + ")";
  const call = c ? " Le call" + (c.issue ? " (" + c.issue + ")" : "") + " : " + String(c.resume || "").slice(0, 220) +
    (c.joue && c.joue.quoi ? " Là où ça s'est joué" + (c.joue.minute ? ", minute " + c.joue.minute : "") + " : " + String(c.joue.quoi).slice(0, 200) : "") : "";
  let fond = "";
  if(s.memo && s.memo.txt) fond = " Ce qu'on en a retenu : " + s.memo.txt;
  else if(s.bilan) fond = " Bilan : " + s.bilan.slice(0, 600);
  else{ const der = s.conv.filter(m => m.role === "coach").slice(-2).map(m => m.txt.slice(0, 300)).join(" / "); if(der) fond = " Les derniers mots du coach : " + der; }
  return tete + " :" + call + fond;
}
filSeances = sauf => CP.seances
  .filter(s => s !== sauf && (s.maj || 0) > DEPART_FIL && (s.conv.some(m => m.role === "moi") || s.plan))
  .map(s => ({t: s.maj, txt: digestSeance(s)}));
async function memoSeance(s){
  if(!s || !s.conv.some(m => m.role === "moi")) return;
  if(s.memo && s.memo.n === s.conv.length) return;
  const n = s.conv.length;
  const conv = s.conv.slice(-40).map(m => (m.role === "moi" ? nomProfil() : (m.nom || "Coach")) + " : " + m.txt.slice(0, 700)).join("\n");
  try{
    const txt = await appelCerveau(`Voici une séance de coaching de ${nomProfil()}, closer high ticket, avec son coach : « ${s.titre} ».
${s.call ? "Le call travaillé : " + (s.call.resume || "") + (s.call.joue && s.call.joue.quoi ? " Là où ça s'est joué : " + s.call.joue.quoi : "") + "\n" : ""}
LA SÉANCE :
${conv}

Écris la note que le coach garde en tête pour les prochaines séances : 3 à 5 phrases, au passé, sans liste. Ce qui ressort de ce call ou de ce travail (avec les mots exacts quand ils comptent), ce que ${nomProfil()} a compris, la phrase juste qu'il a trouvée s'il y en a une, ce qui reste fragile, et le travail donné. Concret, rien de général. Réponds avec la note seule.`, {max: 450, effort: "low"});
    if(txt && txt.trim() && CP.seances.includes(s)){ s.memo = {n, t: Date.now(), txt: txt.replace(/<<[\s\S]*?>>/g, "").trim().slice(0, 900)}; sauve(); }
  }catch(_){}
}
// les séances quittées sans mémo à jour (onglet fermé en pleine séance…) : rattrapées en fond
function rattrapeMemos(){
  CP.seances.filter(s => s.id !== CP.actuelle && (s.maj || 0) > DEPART_FIL && s.conv.some(m => m.role === "moi") && !(s.memo && s.memo.n === s.conv.length))
    .slice(-3).forEach(s => memoSeance(s));
}
function promptCoach(question, estQuestion, fil){
  const c = coachCourant(), s = seance();
  const hist = (s ? s.conv : []).slice(-24, -1).map(m => (m.role === "moi" ? (m.question ? nomProfil().toUpperCase() + " (question à côté)" : nomProfil().toUpperCase()) : (m.nom || "COACH").toUpperCase()) + " : " + m.txt).join("\n");
  // les devoirs ne servent qu'en début de séance (pour les lui redemander) : ensuite ils coloreraient chaque réponse
  const debut = !s || s.conv.filter(m => m.role === "moi").length <= 1;
  // nouveau départ : ce qui a été écrit avant le nouveau cerveau de Josh (19 octobre, ancienne façon de penser) n'est plus relu
  const ouverts = debut ? devoirsOuverts().filter(d => (Number(d.id) || 0) > DEPART_FIL).slice(-3).map(d => "  - (" + d.date + ") " + d.txt).join("\n") : "";
  const avant = fil || "";
  const objet = s && s.k ? `\nCETTE SÉANCE PORTE SUR UNE PHASE PRÉCISE DE SES CALLS : « ${nomPhase(s.k)} ». Reste dessus, sauf quand il te pose une question directe : tu y réponds d'abord.\n` : "";
  const consigneQuestion = estQuestion ? `
ATTENTION : CE MESSAGE EST UNE QUESTION DIRECTE qu'il te pose, à côté de l'exercice. Il veut ta réponse, pas une nouvelle question.
Réponds-y vraiment : clairement, complètement, avec un exemple concret ou la phrase exacte à dire si c'est utile, même si ça sort du sujet de la séance. Ici, tu ne lui retournes pas la question et tu ne le fais pas chercher.
Pas de DEVOIR ni de ROLEPLAY. Termine par une seule courte phrase qui propose de reprendre l'exercice là où vous en étiez.
` : "";
  let sv = ""; try{ sv = souvenirs(question + " " + (s && s.call ? (s.call.resume || "") : "") + (s && s.k ? " " + nomPhase(s.k) : ""), [], "", 6); }catch(_){}
  return `${texteProfil()}${avant ? "\n" + TITRE_FIL + "\n" + avant + "\n" : ""}${ouverts ? "\nLE TRAVAIL QUE TU LUI AS DONNÉ ET QU'IL N'A PAS ENCORE VALIDÉ :\n" + ouverts + "\n" : ""}${objet}${texteDuCall(s)}${textePlan(s)}${sv}
${hist ? "CETTE SÉANCE JUSQU'ICI :\n" + hist + "\n" : ""}
${nomProfil().toUpperCase()}${estQuestion ? " (QUESTION DIRECTE)" : ""} : ${question}
${consigneQuestion}
Réponds-lui maintenant, en ${c.court}.`;
}

/* --- la conversation --- */
function rendFil(){
  const s = seance(), f = $("cpFil");
  f.innerHTML = (s ? s.conv : []).slice(-60).map(m => `<div class="cp-msg ${m.role}"><small>${escapeHTML(m.role === "moi" ? (m.question ? "Toi · question" : "Toi") : (m.nom || "Coach"))}${m.t ? " · " + jour(m.t) : ""}</small>${escapeHTML(m.txt)}</div>`).join("");
  sec.scrollTop = sec.scrollHeight;
}
function rendDevoirs(){
  const l = CP.devoirs.filter(d => !d.fait || Date.now() - (d.faitLe || 0) < 3 * 86400000).slice(-8);
  $("cpDevoirsBloc").style.display = l.length ? "block" : "none";
  $("cpDevoirs").innerHTML = l.map(d => `<label class="cp-devoir ${d.fait ? "fait" : ""}"><input type="checkbox" data-dv="${d.id}" ${d.fait ? "checked" : ""}><span>${escapeHTML(d.txt)} <small style="color:var(--muted)">· ${escapeHTML(d.date)}</small></span></label>`).join("");
  $("cpDevoirs").querySelectorAll("[data-dv]").forEach(x => x.onchange = () => {
    const d = CP.devoirs.find(y => String(y.id) === x.dataset.dv); if(!d) return;
    d.fait = x.checked; d.faitLe = Date.now(); sauve(); rendDevoirs();
  });
}
async function envoie(silencieux, estQuestion){
  const q = $("cpMoi").value.trim(), s = seance();
  if(!q || CP.enCours || !s) return;
  // une clé collée ici partirait chez l'IA : on la retient
  if(!/\s/.test(q) && q.length >= 30 && /[A-Za-z]/.test(q) && /\d/.test(q)){
    $("cpEtat").innerHTML = '<span style="color:var(--clay)">Ça ressemble à une clé : je ne l\'envoie pas au coach. Efface-la d\'ici. Ta clé Fathom se met dans Tracking, à l\'endroit prévu.</span>';
    return;
  }
  arreteVoix();
  const c = coachCourant();
  s.conv.push(Object.assign({role: "moi", txt: q, t: Date.now()}, estQuestion ? {question: true} : {})); s.maj = Date.now(); s.qui = CP.qui;
  $("cpMoi").value = ""; rendFil(); sauve();
  CP.enCours = true; $("cpEtat").textContent = c.court + " réfléchit…";
  try{
    let fil = ""; try{ fil = await texteFil(14, s); }catch(_){}
    let rep = await appelCerveau(promptCoach(q, estQuestion, fil), {systeme: systemeCoach(), max: 1400, effort: "medium"});
    const dv = rep.match(/<<\s*DEVOIR\s*:\s*([\s\S]*?)>>/i), rp = rep.match(/<<\s*ROLEPLAY\s*:\s*([\s\S]*?)>>/i);
    const momentFait = /<<\s*MOMENT[_ ]FAIT\s*>>/i.test(rep);
    rep = rep.replace(/<<[\s\S]*?>>/g, "").trim();
    s.conv.push({role: "coach", nom: c.court, txt: rep, t: Date.now()}); s.maj = Date.now();
    // un moment de la carte est réglé : on coche, et le compteur repart pour le suivant
    if(momentFait && s.plan && !estQuestion && s.plan.courant < s.plan.moments.length){ s.plan.courant++; s.plan.debut = s.conv.length; rendPlan(); }
    if(dv){ CP.devoirs.push({id: Date.now(), txt: dv[1].trim(), date: new Date().toLocaleDateString("fr-FR"), fait: false, seance: s.id}); rendDevoirs(); }
    const ent = $("cpEntrainer");
    if(rp){
      ent.style.display = "block";
      ent.innerHTML = `<button class="cp-btn plein">M'entraîner là-dessus en roleplay</button><p style="font-size:12.5px;color:var(--muted);margin-top:6px">${escapeHTML(rp[1].trim())}</p>`;
      ent.querySelector("button").onclick = () => { s.maj = Date.now(); if(s.k) CP.entrainements.push({t: Date.now(), k: s.k, type: "roleplay"}); sauve(); lanceRoleplay(rp[1].trim()); };
    } else ent.style.display = "none";
    sauve(); rendFil();
    $("cpEtat").textContent = "";
    await parle(rep);
  }catch(e){
    // un testeur n'a rien à vérifier lui-même : la clé de l'IA est sur le serveur
    const m = TESTEUR && /clé api|config\.json/i.test(e.message) ? "Le coach ne répond pas pour le moment : c'est un souci de notre côté, pas du tien. Réessaie un peu plus tard." : e.message;
    $("cpEtat").innerHTML = '<span style="color:var(--clay)">' + escapeHTML(m) + "</span>";
  }
  CP.enCours = false;
}

/* --- le micro : tu lui parles --- */
function micro(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return toast("Le micro marche dans Chrome.");
  if(CP.rec){ try{ CP.rec.stop(); }catch(_){} return; }
  arreteVoix();
  const r = new SR(); CP.rec = r;
  r.lang = "fr-FR"; r.continuous = true; r.interimResults = true;
  const base = $("cpMoi").value ? $("cpMoi").value.trim() + " " : "";
  let final = "";
  r.onresult = e => {
    let prov = "";
    for(let i = e.resultIndex; i < e.results.length; i++){
      if(e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      else prov += e.results[i][0].transcript;
    }
    $("cpMoi").value = base + final + prov;
  };
  r.onend = () => { CP.rec = null; $("cpMicro").textContent = "Parler au micro"; if($("cpMoi").value.trim()) envoie(); };
  r.onerror = () => {};
  $("cpMicro").textContent = "J'ai fini de parler";
  try{ r.start(); }catch(_){ CP.rec = null; }
}

/* --- réglages du coach --- */
async function majVoixChoix(){
  const s = $("cpVoixId");
  if(!MES_VOIX.length && CLE_VOIX){
    try{
      if(MOTEUR_VOIX === "eleven"){
        const r = await fetch("https://api.elevenlabs.io/v1/voices", {headers: {"xi-api-key": CLE_VOIX}});
        if(r.ok) MES_VOIX = ((await r.json()).voices || []).map(v => ({id: v.voice_id, nom: v.name}));
      } else if(MOTEUR_VOIX === "openai") MES_VOIX = ["onyx","echo","fable","alloy","nova","shimmer"].map(x => ({id: x, nom: x}));
    }catch(_){}
  }
  const liste = MES_VOIX.length ? MES_VOIX : [];
  const actuelle = (CP.regl[CP.qui] || {}).voix || "";
  s.innerHTML = '<option value="">La voix du coach réglée dans le Roleplay</option>' +
    liste.map(v => `<option value="${escapeHTML(v.id)}">${escapeHTML(v.nom)}</option>`).join("") +
    (actuelle && !liste.some(v => v.id === actuelle) ? `<option value="${escapeHTML(actuelle)}">${escapeHTML(actuelle)}</option>` : "");
  s.value = actuelle;
}
function majQui(){
  const s = $("cpQui");
  s.innerHTML = coachs().map(c => `<option value="${escapeHTML(c.k)}">${escapeHTML(c.nom)}</option>`).join("");
  s.value = coachCourant().k;
}
/* changer de coach = une nouvelle conversation ; l'ancienne t'attend dans « À reprendre » */
$("cpQui").onchange = () => {
  const avant = seance(), avantQui = avant ? avant.qui : CP.qui;
  CP.qui = $("cpQui").value;
  if(!avant || avantQui === CP.qui){ sauve(); rendAvatar(); majVoixChoix(); return; }
  arreteVoix();
  if(!avant.conv.some(m => m.role === "moi")){
    // rien n'a encore été dit : on change simplement de coach
    avant.qui = CP.qui; avant.conv = [{role: "coach", nom: coachDe(CP.qui).court, t: Date.now(), txt: ouvertureCoach()}];
    sauve(); ouvreSeance(); return;
  }
  avant.maj = Date.now();
  const base = avant.titre.replace(/ · avec .*$/, "");
  const o = {type: avant.type, k: avant.k, call: avant.call, texte: avant.texte, titre: base + " · avec " + coachDe(CP.qui).court};
  if(avant.call){ o.silence = true; nouvelleSeance(o); $("cpMoi").value = avant.k ? "Analyse ce call avec moi, surtout « " + nomPhase(avant.k) + " »." : "Analyse ce call avec moi."; envoie(); }
  else if(avant.k){ o.ouverture = "Je veux travailler « " + nomPhase(avant.k) + " ». Aide-moi à comprendre ce que je rate."; nouvelleSeance(o); }
  else nouvelleSeance(o);
  toast("Nouvelle séance avec " + coachDe(CP.qui).nom + ". L'autre t'attend dans « À reprendre ».");
};
$("cpVoixId").onchange = () => { CP.regl[CP.qui] = Object.assign({}, CP.regl[CP.qui], {voix: $("cpVoixId").value}); sauve(); };
$("cpPhoto").onchange = e => {
  const f = e.target.files[0]; if(!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const c = document.createElement("canvas"), t = 420, k = Math.max(t / img.width, t / img.height);
    c.width = t; c.height = t;
    c.getContext("2d").drawImage(img, (t - img.width * k) / 2, (t - img.height * k) / 2, img.width * k, img.height * k);
    CP.regl[CP.qui] = Object.assign({}, CP.regl[CP.qui], {photo: c.toDataURL("image/jpeg", 0.86)});
    URL.revokeObjectURL(url); sauve(); rendAvatar();
    toast("Photo de " + coachCourant().nom + " en place. Clique sur « Placer la bouche ».");
  };
  img.src = url;
};
$("cpBouche").onclick = () => {
  if(!(CP.regl[CP.qui] || {}).photo) return toast("Mets d'abord une photo.");
  const av = $("cpAvatar"); av.classList.add("placer");
  toast("Clique sur sa bouche, dans la photo.");
  av.onclick = e => {
    const r = av.getBoundingClientRect();
    CP.regl[CP.qui].bouche = Math.round((e.clientY - r.top) / r.height * 100);
    av.classList.remove("placer"); av.onclick = null; sauve(); rendAvatar();
    parle("Voilà. Comme ça, tu me vois parler.");
  };
};
$("cpSansPhoto").onclick = () => { if(CP.regl[CP.qui]) delete CP.regl[CP.qui].photo; sauve(); rendAvatar(); };
$("cpEnvoi").onclick = () => envoie();
$("cpQuestion").onclick = () => { if(!$("cpMoi").value.trim()) return toast("Écris ta question, puis clique sur « Question au coach »."); envoie(false, true); };
$("cpMicro").onclick = micro;
$("cpStop").onclick = arreteVoix;
$("cpMoi").addEventListener("keydown", e => { if(e.key === "Enter" && (e.ctrlKey || e.metaKey)) envoie(); });

/* ---------------------------------------------------------------------
   Au démarrage
   --------------------------------------------------------------------- */
accueilEl.innerHTML = '<div class="cp-page"><span class="cp-marque">Closing Copilot</span></div>';
(async () => {
  CP.regl = (await Store.get("coach_perso_regl")) || {};
  if(TESTEUR){
    // son prénom et son essai d'abord, pour que l'accueil lui parle à lui
    habilleTesteur();
    await majEssai();
  } else {
    const pf = await Store.get("coach_perso_profils");
    if(Array.isArray(pf)) PROFILS = PROFILS_DEFAUT.map(d => Object.assign({}, d, pf.find(x => x.id === d.id) || {}, {coachs: d.coachs}));
    if(!PROFILS.some(p => p.id === PROFIL && p.nom)) PROFIL = "woidih";
  }
  await chargeProfil();
  // l'ancienne conversation unique devient une séance à reprendre
  const vieille = PROFIL === "woidih" ? await Store.get("coach_perso_conv") : null;
  if(vieille && vieille.length && !CP.seances.length){
    CP.seances.push({id: "s" + Date.now(), titre: "Questions-réponses", type: "qr", k: null, call: null, qui: CP.qui, conv: vieille,
                     etat: "en_cours", debut: vieille[0].t || Date.now(), maj: vieille[vieille.length - 1].t || Date.now(), texte: ""});
    sauve(); Store.set("coach_perso_conv", []);
  }
  try{ if(typeof chargeReglagesVoix === "function" && !CLE_VOIX) await chargeReglagesVoix(); }catch(_){}
  rendAccueil();
  await chargeSuivi();
  if(home.style.display !== "none" && accueilEl.style.display !== "none") rendAccueil();
})();
})();

})();
