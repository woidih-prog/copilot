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
async function appelJson(prompt, max, requis){
  let j = null, m = requis.slice();
  try{ j = parseModelJson(await callClaude(prompt, max)); m = manque(j, requis); }catch(e){ if(!/illisible|invalide/i.test(e.message)) throw e; }
  if(m.length){
    try{
      const j2 = parseModelJson(await callClaude(prompt +
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

${b2b ? `CE CALL EST EN B2B. Ne lui reproche jamais de ne pas avoir cherché l'émotion. Ce qu'on attend : des chiffres, la propagation du problème aux autres équipes, le circuit de décision, le déclencheur, l'enjeu personnel abordé par le côté.` : ""}

LE MOMENT TRAVAILLÉ : ${seg.nom}
OBJECTIF DE CET EXERCICE : ${seg.objectif}
JUGE-LE SUR CES CRITÈRES-LÀ, ET SUR RIEN D'AUTRE :
${criteres}

${notesDuCoach()}
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
      const j2 = await appelJson(promptDebrief1(), 2800, REQUIS_SPAR);
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
  try{
    j = await appelJson(promptDebrief1(), 2800, REQUIS_SPAR);
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

  // Deuxième temps : il va chercher dans ta méthode ce qui répond à SA lecture.
  let m;
  try{
    const fiches = fichesPour([].concat(j.recherches || [], j.faute, j.une_chose), 8, segmentCourant().terrain);
    const r = await appelJson(promptDebrief2(j, fiches), 1800, ["exercice","exercices"]);
    m = Object.assign({}, r, {fiche: ficheParNumero(fiches, r.numero)});
  }catch(e){ m = {erreur: e.message}; }
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
  }
  return callClaudeOrigine(prompt, max);
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
   1B. « LE COACH LIT MON CALL » — même principe, + pronostic à l'aveugle
   ===================================================================== */
const REQUIS_LECTURE = ["pronostic","note","verdict","moments","exercice"];
const contexteRevele = t => /sign|vendu|perdu|relance|ne r[ée]pond plus|a pay[ée]|n'?a pas pris|ghost/i.test(t || "");
const hashTxt = t => { let h = 0; for(let i = 0; i < t.length; i++){ h = (h*31 + t.charCodeAt(i)) | 0; } return String(h); };

function promptLecture1(tours, nom, ctx, marche){
  const terrainEcoles = Object.entries(ECOLES)
    .filter(([k,v]) => !["moi","sami"].includes(k) && (!v.marches || v.marches.includes(marche)))
    .map(([k,v]) => v.nom + " sur " + (v.terrains||[]).join(" et ")).join(" · ");
  return `Tu es un coach de closing. Tu viens de lire l'enregistrement d'un vrai call de ton élève, et tu lui rends la copie.

${manniereDuCoach().ton}

${ctx ? "CE QU'IL T'A DIT SUR CE CALL :\n" + ctx : ""}

TU NE CONNAIS PAS L'ISSUE DE CE CALL, ET C'EST VOULU.
Avant tout, tu fais ton pronostic à partir de ce que tu lis : a-t-il signé, est-il parti en relance, ou l'a-t-il perdu ? On compare ensuite avec la réalité pour mesurer si ton jugement est fiable. Ne te réfugie pas dans « relance » par prudence : tranche selon les indices, et cite-les.

MARCHÉ : ${marche === "b2b" ? "B2B — ne lui reproche jamais de ne pas avoir cherché l'émotion. Ce qu'on attend : chiffres, propagation aux autres équipes, circuit de décision, déclencheur, enjeu personnel abordé par le côté." : "B2C haut de gamme."}
MÉTHODES DE RÉFÉRENCE : ${terrainEcoles}

TU N'AS PAS SA MÉTHODE SOUS LES YEUX, C'EST VOULU. Tu lis le call d'abord. Les phrases à dire viendront ensuite, tirées de sa méthode.

LE CALL, réplique par réplique
${tours.map((t,i) => `[${i+1}] ${t.moi ? "CLOSER" : nom.toUpperCase()} : ${t.text}`).join("\n")}

RÈGLES :
Observation d'abord, interprétation ensuite, jamais de certitude psychologique.
Distingue la cause de la conséquence : si la dégradation a commencé plus tôt, dis où.
Cite ses mots exacts. Sans citation, ton reproche ne vaut rien.
Sois franc. S'il a bien fait quelque chose, dis-le précisément.
LA NOTE doit être reproductible : relue demain, tu donnerais la même.
Tutoie-le. En français.
Dans "recherches", écris une à quatre phrases décrivant ce que tu irais chercher dans sa méthode pour corriger ses fautes, avec les mots du métier.

Réponds uniquement avec ce JSON, sans markdown, concis dans chaque champ :
{"pronostic":{"issue":"vendu|perdu|relance","confiance":0 a 100,"indices":"ce qui te fait dire ca, cite les mots"},
 "note":0 a 10,
 "verdict":"en deux phrases, ce qui s est vraiment joue",
 "marche":[{"quoi":"ce qu il a bien fait","cite":"ses mots exacts","pourquoi":"pourquoi c etait juste"}],
 "ameliorer":[{"quoi":"ce qui doit progresser","cite":"ses mots exacts ou null"}],
 "moments":[{"replique":numero,"cite":"ses mots exacts","fait":"ce qu il a fait","effet":"ce que ca a provoque ensuite"}],
 "bascule":{"replique":numero ou null,"cite":"la phrase qui a fait basculer","pourquoi":"pourquoi celle-la"},
 "exercice":"un seul exercice concret pour le prochain call",
 "recherches":["ce que tu irais chercher dans sa methode"]}`;
}

function promptLecture2(j, tours, nom, fiches, issue){
  return `Tu es ${manniereDuCoach().nom}, coach de closing. Tu as lu le call de ton élève et rendu ta copie.
${issue ? `ISSUE RÉELLE DU CALL, que tu ne connaissais pas : ${issue}. Ton pronostic était : ${(j.pronostic||{}).issue || "?"}.` : "Issue réelle non précisée."}

TES MOMENTS DÉCISIFS :
${(j.moments||[]).map(m => `[réplique ${m.replique}] « ${m.cite||""} » — ${m.fait||""}`).join("\n")}

TES POINTS À AMÉLIORER, dans l'ordre :
${(j.ameliorer||[]).map((a,i) => `${i+1}. ${a.quoi||""}${a.cite ? " (« " + a.cite + " »)" : ""}`).join("\n") || "aucun"}

Pour situer, les répliques autour des moments :
${(j.moments||[]).map(m => { const k = (num(m.replique)||1) - 1; return tours.slice(Math.max(0,k-2), k+1).map((t,i) => `[${Math.max(0,k-2)+i+1}] ${t.moi?"CLOSER":nom.toUpperCase()} : ${t.text}`).join("\n"); }).join("\n---\n")}

MAINTENANT tu ouvres sa méthode. Voici les fiches que tu es allé chercher :
${listeFiches(fiches)}

${REGLE_ADAPTATION}

Réponds uniquement avec ce JSON, sans markdown :
{"moments":[{"replique":numero,"dire":"la phrase a dire, adaptee, ou null","numero":numero de fiche ou null}],
 "ameliorer":["ce qu il faut faire a la place, une phrase par point, dans l ordre"],
 "relecture":${issue ? '"ce que ton pronostic avait vu juste ou rate, maintenant que tu connais l issue, une ou deux phrases"' : "null"}}`;
}

async function pronostics(){ const l = await Store.get(CLE_PRONOS); return Array.isArray(l) ? l : []; }

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

  remetLectureAuDebut();
  $("btnLire").disabled = true;
  $("lecture").innerHTML = '<p style="color:var(--amber)">Le coach lit ton call, sans connaître l\'issue… une à deux minutes.</p>';
  try{
    const j = await appelJson(promptLecture1(tours, nom, ctx, marche), 3800, REQUIS_LECTURE);
    j.note = num(j.note);

    $("lecture").innerHTML = '<p style="color:var(--amber)">Il va maintenant chercher dans ta méthode ce qu\'il fallait dire…</p>';
    let relecture = null;
    try{
      const req = [].concat(j.recherches || [], (j.ameliorer||[]).map(a => a.quoi), (j.moments||[]).map(m => m.fait));
      const fiches = fichesPour(req, 12);
      const r = await appelJson(promptLecture2(j, tours, nom, fiches, issue), 2200, ["moments"]);
      (r.moments || []).forEach(x => {
        const m = (j.moments || []).find(y => num(y.replique) === num(x.replique));
        if(!m || !x.dire) return;
        const f = ficheParNumero(fiches, x.numero);
        m.dire = x.dire;
        m.source = f ? (f.ecole || "ta base") : "formulation du coach, hors de ta méthode";
        if(f && String(f.phrase).trim().toLowerCase() !== String(x.dire).trim().toLowerCase()) m.fiche_origine = f.phrase;
      });
      (j.ameliorer || []).forEach((a,i) => { a.comment = (r.ameliorer || [])[i] || ""; });
      relecture = r.relecture || null;
    }catch(e){
      (j.ameliorer || []).forEach(a => { a.comment = a.comment || ""; });
      relecture = "La recherche dans ta méthode a échoué : " + e.message;
    }

    const noteCalib = j.note;
    if(j.note === null) j.note = "—";          // jamais « null/10 » à l'écran
    LECTURE = {j, tours, nom};
    rendLecture();
    j.note = noteCalib;
    if(AUDIO_CALL) poseLesMarques();

    // La calibration : pronostic à l'aveugle contre l'issue réelle
    const pr = j.pronostic || {};
    const prono = String(pr.issue || "").toLowerCase();
    const valide = !!rjIssueChoisie && !contexteRevele(ctx) && ["vendu","perdu","relance"].includes(prono);
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
      <p style="font-size:15px">Le coach pensait : <b>${esc(prono || "?")}</b>${num(pr.confiance) !== null ? " (sûr à " + num(pr.confiance) + " %)" : ""}.
        ${rjIssueChoisie ? ` Réalité : <b>${esc(rjIssueChoisie)}</b> — <span style="color:${juste?"var(--sage)":"var(--clay)"}">${juste?"juste":"raté"}</span>.` : ""}</p>
      ${pr.indices ? `<p style="font-size:13px;color:var(--muted);margin-top:6px">${esc(pr.indices)}</p>` : ""}
      ${relecture ? `<p style="font-size:13.5px;margin-top:10px">${esc(relecture)}</p>` : ""}
      <p style="font-size:12.5px;color:var(--muted);margin-top:10px">${
        !rjIssueChoisie ? "Indique l'issue réelle avant de lancer la lecture : sans elle, ce call ne compte pas dans la mesure de fiabilité."
        : contexteRevele(ctx) ? "Ton contexte révèle l'issue (signé, perdu, relance…) : ce call ne compte pas dans la mesure. Retire cette info du contexte pour tester le coach."
        : `Compté. Fiabilité cumulée : ${ok}/${l.length} pronostics justes. Le détail est dans Ma progression.`}</p>`;
    $("lecture").prepend(bloc);
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

const renderProgOrigine = renderProg;
renderProg = function(){ renderProgOrigine(); rendCalibration(); };

})();
