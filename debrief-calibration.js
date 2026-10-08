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
 "exercice":"un exercice concret pour la prochaine fois, une phrase"}`;
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
    ${m.exercice ? `<p style="margin-top:12px"><strong>Exercice pour la prochaine fois</strong><br>${esc(m.exercice)}</p>` : ""}
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
      <button class="pill" id="btnRejouerMeme" style="border-color:var(--amber);color:var(--amber)">Refaire le même exercice</button>
      <button class="pill" id="btnAutreProspect">Changer de réglages</button>
    </div>`;

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
  if(!SPAR) return;
  arreteSparMicro(); coupeAudio();
  phase("terminé", "var(--line)", false);
  $("sparDebrief").innerHTML = '<div class="block"><p style="color:var(--muted)">Le coach relit ton exercice…</p></div>';
  $("sparDebrief").scrollIntoView({block:"start"});

  let j;
  try{
    j = await appelJson(promptDebrief1(), 2800, REQUIS_SPAR);
  }catch(e){
    $("sparDebrief").innerHTML = '<div class="block"><p style="color:var(--clay)">Débrief impossible : ' + esc(e.message) +
      '</p><button class="pill" id="btnReDebrief" style="margin-top:10px">Réessayer</button></div>';
    $("btnReDebrief").onclick = () => $("btnSparFin").click();
    return;
  }
  SPAR.dernierDebrief = j;
  $("sparJeu").style.display = "none";
  rendDebriefSpar(j, null);
  $("spar").scrollTop = 0;

  const note = num(j.note);
  HISTO = HISTO.filter(h => h.id !== SPAR.debut);
  HISTO.push({id:SPAR.debut, date:new Date().toISOString().slice(0,10),
              prospect:"Sparring · " + segmentCourant().nom + " · " + SPAR.p.prenom,
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
    const r = await appelJson(promptDebrief2(j, fiches), 1200, ["exercice"]);
    m = Object.assign({}, r, {fiche: ficheParNumero(fiches, r.numero)});
  }catch(e){ m = {erreur: e.message}; }
  if(SPAR && SPAR.dernierDebrief === j){
    const box = document.querySelector("#sparDebrief");
    const blocs = box ? [...box.querySelectorAll(".block")] : [];
    const cible = blocs.find(b => /Dans ta méthode|Ce qu'il fallait dire/.test(b.textContent));
    if(cible){ const d = document.createElement("div"); d.innerHTML = htmlMethode(m); cible.replaceWith(d.firstElementChild); }
  }
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
