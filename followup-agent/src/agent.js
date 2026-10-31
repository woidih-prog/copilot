/* L'AGENT — relie le moteur, la base, l'IA et WhatsApp. */
import { config } from "./config.js";
import { depuisFiche, dansFenetre, angleDe, apresEnvoi, apresReponse, parseQuand } from "./engine.js";
import { redige, analyseReponse } from "./llm.js";
import { envoieCloud, lienWaMe, fenetreOuverte } from "./whatsapp.js";
import { tireDeNotion, pousseVersNotion } from "./notion.js";
import { previens } from "./notify.js";

const MAX_PAR_TOUR = 15; // jamais de rafale

export function makeAgent(repo, deps = {}) {
  const ia = { redige: deps.redige || redige, analyse: deps.analyse || analyseReponse };
  const envoie = deps.envoie || envoieCloud;
  const notifie = deps.previens || previens;
  const lienDigest = () => (config.publicUrl ? config.publicUrl + "/digest" : "/digest");
  let derniereLectureNotion = new Date(Date.now() - 7 * 86400000).toISOString();

  /* ---------- entrée : les fiches du tracker ---------- */
  function synchronise(source, fiches) {
    const bilan = { crees: 0, maj: 0, ignores: 0 };
    for (const brute of fiches) {
      const fiche = source === "copilot" ? depuisCopilot(brute) : brute;
      if (!fiche || fiche.id == null) { bilan.ignores++; continue; }
      const existant = repo.bySource(source, fiche.id);
      const r = depuisFiche(fiche, existant, config);
      if (r.creer) { repo.insert({ ...r.creer, source, source_id: fiche.id }); bilan.crees++; }
      else if (r.patch) {
        // Mis en pause par l'agent faute de numéro / d'accord : on relance dès que c'est complété.
        if (existant.statut === "en_pause" && existant.contexte.pause_auto && !r.patch.statut) {
          if (r.patch.telephone && r.patch.consentement) r.patch.statut = "actif";
          else r.patch.contexte.pause_auto = true;
        }
        repo.update(existant.id, r.patch);
        bilan.maj++;
      }
      else bilan.ignores++;
    }
    return bilan;
  }

  /* ---------- le tour de garde (toutes les X minutes) ---------- */
  async function tour(maintenant = new Date()) {
    const journal = { notionTire: 0, brouillons: 0, envoyes: 0, pauses: 0, erreurs: [] };
    try {
      const debut = new Date().toISOString();
      journal.notionTire = await tireDeNotion(repo, derniereLectureNotion);
      derniereLectureNotion = debut;
    } catch (e) { journal.erreurs.push(e.message); }

    if (dansFenetre(maintenant, config)) {
      const dus = repo.due(maintenant.toISOString()).slice(0, MAX_PAR_TOUR);
      for (const f of dus) {
        try {
          if (repo.hasOpenDraft(f.id)) continue; // attend ta validation
          if (!f.telephone || !f.consentement) {
            repo.update(f.id, { statut: "en_pause", contexte: { ...f.contexte, pause_auto: true }, notes: ajouteNote(f.notes, !f.telephone ? "pas de numéro" : "pas de consentement WhatsApp") });
            journal.pauses++;
            continue;
          }
          const angle = angleDe(f);
          if (!angle) { repo.update(f.id, { statut: "termine", prochaine: null }); continue; }
          const heureRdv = heureRdvDe(f);
          const modele = config.transport === "cloud" && !fenetreOuverte(f, maintenant.getTime());
          // Rappel de R2 par modèle : le texte est fixe chez Meta, inutile de payer l'IA.
          const texte = modele && f.type === "rappel_r2"
            ? `Bonjour ${(f.nom || "").split(/\s+/)[0] || "à toi"}, petit rappel : notre rendez-vous est prévu ${heureRdv}.`
            : await ia.redige(f, angle, repo.history(f.id), { heureRdv, sansSalutation: modele });

          const auto = config.transport === "cloud" && f.mode_envoi === "auto";
          const msgId = repo.addMessage({ followup_id: f.id, sens: "sortant", etape: f.etape, texte, statut: auto ? "a_envoyer" : "brouillon" });
          if (auto) { await envoieMaintenant(msgId); journal.envoyes++; }
          else journal.brouillons++;
        } catch (e) {
          journal.erreurs.push(`#${f.id} ${e.message}`);
        }
      }
      if (journal.brouillons) {
        await notifie("Relances prêtes", `${journal.brouillons} message(s) à valider.`, { lien: lienDigest() });
      }
    }

    try { await pousseVersNotion(repo); } catch (e) { journal.erreurs.push(e.message); }
    return journal;
  }

  /* ---------- sortie ---------- */
  async function envoieMaintenant(msgId, texteCorrige) {
    const m = repo.message(msgId);
    const f = repo.get(m.followup_id);
    if (f.statut === "stop" || !f.consentement) throw new Error("Ce contact a refusé les messages.");
    const texte = (texteCorrige || m.texte).trim();
    try {
      const waId = await envoie(f, texte, { heureRdv: heureRdvDe(f) });
      repo.updateMessage(msgId, { texte, statut: "envoye", wa_id: waId || null });
    } catch (e) {
      repo.updateMessage(msgId, { statut: "echec" });
      await notifie("Envoi échoué", `${f.nom} : ${e.message}`, { urgent: true });
      throw e;
    }
    avance(f);
  }

  /* Mode assist : tu as appuyé sur « envoyé » après l'avoir envoyé toi-même. */
  function marqueEnvoye(msgId, texteCorrige) {
    const m = repo.message(msgId);
    const texte = (texteCorrige || m.texte).trim();
    repo.updateMessage(msgId, { texte, statut: "envoye" });
    avance(repo.get(m.followup_id));
  }

  function avance(f) {
    const maintenant = new Date();
    repo.update(f.id, { ...apresEnvoi(f, maintenant), derniere_sortie: maintenant.toISOString() });
  }

  /* Validation depuis le digest. Renvoie le lien wa.me en mode assist. */
  async function valide(msgId, texteCorrige) {
    const m = repo.message(msgId);
    if (!m || !["brouillon", "a_envoyer"].includes(m.statut)) throw new Error("Message introuvable ou déjà traité.");
    if (config.transport === "cloud") { await envoieMaintenant(msgId, texteCorrige); return { envoye: true }; }
    const f = repo.get(m.followup_id);
    const texte = (texteCorrige || m.texte).trim();
    repo.updateMessage(msgId, { texte });
    return { lien: lienWaMe(f.telephone, texte) };
  }

  /* Écarte le brouillon : il sera réécrit au prochain tour, ou on met en pause. */
  function ecarte(msgId, { pause = false } = {}) {
    const m = repo.message(msgId);
    repo.updateMessage(msgId, { statut: "rejete" });
    if (pause) repo.update(m.followup_id, { statut: "en_pause" });
  }

  /* ---------- entrée : les réponses ---------- */
  async function recoit({ waId, de, texte, quand }, f = null) {
    if (waId && repo.messageByWaId(waId)) return { doublon: true };
    f = f || repo.byPhone(de);
    if (!f) {
      await notifie("Message d'un numéro inconnu", `+${de} : ${texte.slice(0, 120)}`);
      return { inconnu: true };
    }
    const historique = repo.history(f.id);
    const msgId = repo.addMessage({ followup_id: f.id, sens: "entrant", texte, statut: "recu", wa_id: waId || null });
    // Une réponse rend caducs les brouillons en attente.
    for (const m of historique) if (m.sens === "sortant" && ["brouillon", "a_envoyer"].includes(m.statut)) repo.updateMessage(m.id, { statut: "rejete" });

    let analyse;
    try { analyse = await ia.analyse(f, texte, historique); }
    catch (e) { analyse = { intention: "autre", date: null, resume: "Analyse indisponible : " + e.message, suggestion: "" }; }
    repo.updateMessage(msgId, { analyse });
    const patch = apresReponse(f, analyse, quand ? new Date(quand) : new Date());
    repo.update(f.id, patch);

    const urgent = ["interesse", "question"].includes(analyse.intention);
    await notifie(`${f.nom || "Prospect"} a répondu · ${analyse.intention}`,
      `${analyse.resume}${analyse.suggestion ? "\nSuggestion : " + analyse.suggestion : ""}`,
      { urgent, lien: lienDigest() });
    return { analyse, statut: patch.statut };
  }

  return { synchronise, tour, valide, marqueEnvoye, ecarte, recoit, envoieMaintenant };
}

function heureRdvDe(f) {
  if (f.type !== "rappel_r2" || !f.contexte.rdv) return undefined;
  return parseQuand(f.contexte.rdv, config.tz).toLocaleString("fr-FR", {
    timeZone: config.tz, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).replace(/ à (\d\d):(\d\d)$/, " à $1h$2");
}

const ajouteNote = (notes, n) => {
  const ligne = `[agent ${new Date().toISOString().slice(0, 10)}] en pause : ${n}`;
  return notes ? notes + "\n" + ligne : ligne;
};

/* Closing Copilot n'a qu'un résultat (vendu / relance / perdu) et pas de numéro.
   On le prend quand même : le suivi est créé en pause jusqu'à ce que tu
   complètes le numéro (dans Notion ou dans Suivi R1).                  */
function depuisCopilot(h) {
  if (!h || h.sparring) return null;
  const suite = { relance: "relance", perdu: "mort", vendu: null }[h.resultat];
  if (suite === undefined || suite === null) return null;
  return { id: h.id, nom: h.prospect, suite, objections: h.objections || [], quand: null };
}
