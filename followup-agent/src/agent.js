/* L'AGENT — relie le moteur, la base, l'IA et les canaux (SMS, mail, WhatsApp, Telegram). */
import { config } from "./config.js";
import { depuisFiche, dansFenetre, angleDe, apresEnvoi, apresReponse, parseQuand } from "./engine.js";
import { redige, analyseReponse } from "./llm.js";
import { lienWaMe } from "./whatsapp.js";
import { CANAUX, canalDe } from "./canaux/index.js";
import { releveMails } from "./canaux/email.js";
import { repondTelegram } from "./canaux/telegram.js";
import { tireDeNotion, pousseVersNotion } from "./notion.js";
import { previens } from "./notify.js";

const MAX_PAR_TOUR = 15; // jamais de rafale
const STOP = /^\W*(stop|stp stop|arr[eê]te[sz]?|d[ée]sinscri\w*|unsubscribe)\W*$/i;

export function makeAgent(repo, deps = {}) {
  const ia = { redige: deps.redige || redige, analyse: deps.analyse || analyseReponse };
  const canaux = deps.canaux || CANAUX;
  const notifie = deps.previens || previens;
  const releve = deps.releveMails || releveMails;
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
        // Mis en pause par l'agent faute de coordonnées / d'accord : il repart dès que c'est complété.
        if (existant.statut === "en_pause" && existant.contexte.pause_auto && !r.patch.statut) {
          const essai = { ...existant, ...r.patch };
          if (essai.consentement && canalDe(essai, { canaux })) r.patch.statut = "actif";
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
    const journal = { notionTire: 0, mailsLus: 0, brouillons: 0, envoyes: 0, pauses: 0, erreurs: [] };
    try {
      const debut = new Date().toISOString();
      journal.notionTire = await tireDeNotion(repo, derniereLectureNotion);
      derniereLectureNotion = debut;
    } catch (e) { journal.erreurs.push(e.message); }

    // Les réponses par mail ne préviennent pas : on va les chercher.
    try {
      for (const r of await releve(repo.emailsSuivis())) {
        const res = await recoit(r);
        if (!res.doublon) journal.mailsLus++;
      }
    } catch (e) { journal.erreurs.push("mail : " + e.message); }

    if (dansFenetre(maintenant, config)) {
      const dus = repo.due(maintenant.toISOString()).slice(0, MAX_PAR_TOUR);
      for (const f of dus) {
        try {
          if (repo.hasOpenDraft(f.id)) continue; // attend ta validation
          const canal = f.consentement ? canalDe(f, { canaux }) : null;
          if (!canal) {
            const raison = !f.consentement ? "pas d'accord pour être recontacté" : "aucun moyen de le joindre (numéro, mail ou Telegram)";
            repo.update(f.id, { statut: "en_pause", contexte: { ...f.contexte, pause_auto: true }, notes: ajouteNote(f.notes, raison) });
            journal.pauses++;
            continue;
          }
          const angle = angleDe(f);
          if (!angle) { repo.update(f.id, { statut: "termine", prochaine: null }); continue; }

          const historique = repo.history(f.id);
          const heureRdv = heureRdvDe(f);
          // Rappel de R2 : un texte fixe suffit, inutile de payer l'IA.
          let { texte, sujet } = f.type === "rappel_r2"
            ? texteRappel(f, angle, heureRdv)
            : await ia.redige(f, angle, historique, {
              heureRdv, canal: canal.nom, sansSalutation: canal.sansSalutation?.(f, maintenant.getTime()) || false,
            });
          texte = canal.finalise(f, texte, historique);

          const auto = canal.automatique() && f.mode_envoi === "auto";
          const msgId = repo.addMessage({
            followup_id: f.id, sens: "sortant", etape: f.etape, canal: canal.nom, sujet, texte,
            statut: auto ? "a_envoyer" : "brouillon",
          });
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
  async function envoieMaintenant(msgId, texteCorrige, sujetCorrige) {
    const m = repo.message(msgId);
    const f = repo.get(m.followup_id);
    if (f.statut === "stop" || !f.consentement) throw new Error("Ce contact a refusé les messages.");
    const canal = canaux[m.canal] || canalDe(f, { canaux });
    if (!canal) throw new Error("Aucun canal pour joindre ce contact.");
    const texte = (texteCorrige || m.texte).trim();
    const sujet = (sujetCorrige || m.sujet || "").trim() || null;
    try {
      const extId = await canal.envoie(f, { texte, sujet }, { heureRdv: heureRdvDe(f), historique: repo.history(f.id) });
      repo.updateMessage(msgId, { texte, sujet, canal: canal.nom, statut: "envoye", wa_id: extId || null });
    } catch (e) {
      repo.updateMessage(msgId, { statut: "echec" });
      await notifie("Envoi échoué", `${f.nom} (${canal.nom}) : ${e.message}`, { urgent: true });
      throw e;
    }
    avance(f);
  }

  /* WhatsApp assisté : tu as appuyé sur « envoyé » après l'avoir envoyé toi-même. */
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

  /* Validation depuis le digest. Envoie, ou renvoie le lien wa.me en WhatsApp assisté. */
  async function valide(msgId, texteCorrige, sujetCorrige) {
    const m = repo.message(msgId);
    if (!m || !["brouillon", "a_envoyer"].includes(m.statut)) throw new Error("Message introuvable ou déjà traité.");
    const canal = canaux[m.canal || "whatsapp"];
    if (canal?.automatique()) { await envoieMaintenant(msgId, texteCorrige, sujetCorrige); return { envoye: true }; }
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

  /* ---------- entrée : les réponses (tous canaux) ---------- */
  async function recoit({ extId, waId, canal, de, texte, quand }, f = null) {
    const id = extId || waId || null;
    if (id && repo.messageByWaId(id)) return { doublon: true };
    f = f || (canal === "email" ? repo.byEmail(de) : canal === "telegram" ? repo.byTelegram(de) : repo.byPhone(de));
    if (!f) {
      await notifie("Message d'un contact inconnu", `${canal || "whatsapp"} ${de} : ${String(texte).slice(0, 120)}`);
      return { inconnu: true };
    }
    const historique = repo.history(f.id);
    const msgId = repo.addMessage({ followup_id: f.id, sens: "entrant", canal: canal || null, texte, statut: "recu", wa_id: id });
    // Une réponse rend caducs les brouillons en attente.
    for (const m of historique) if (m.sens === "sortant" && ["brouillon", "a_envoyer"].includes(m.statut)) repo.updateMessage(m.id, { statut: "rejete" });

    let analyse;
    // Un STOP se respecte même si l'IA est en panne : détection fixe d'abord.
    if (STOP.test(texte)) analyse = { intention: "stop", date: null, resume: "Demande d'arrêt des messages.", suggestion: "" };
    else try { analyse = await ia.analyse(f, texte, historique); }
    catch (e) { analyse = { intention: "autre", date: null, resume: "Analyse indisponible : " + e.message, suggestion: "" }; }
    repo.updateMessage(msgId, { analyse });
    const patch = apresReponse(f, analyse, quand ? new Date(quand) : new Date());
    // Il répond par mail ? On continue par mail.
    if (canal && canaux[canal] && patch.statut !== "stop") patch.canal = canal;
    repo.update(f.id, patch);

    const urgent = ["interesse", "question"].includes(analyse.intention);
    await notifie(`${f.nom || "Prospect"} a répondu (${canal || "manuel"}) · ${analyse.intention}`,
      `${analyse.resume}${analyse.suggestion ? "\nSuggestion : " + analyse.suggestion : ""}`,
      { urgent, lien: lienDigest() });
    return { analyse, statut: patch.statut };
  }

  /* Telegram : le prospect a ouvert son lien t.me/<bot>?start=<code>. */
  async function lieTelegram({ code, chatId }) {
    const f = repo.byTgCode(code);
    if (!f) return { inconnu: true };
    repo.update(f.id, {
      telegram_chat_id: chatId,
      canal: f.canal || "telegram",
      ...(f.statut === "en_pause" && f.contexte.pause_auto && f.consentement ? { statut: "actif" } : {}),
    });
    const prenom = (f.nom || "").split(/\s+/)[0];
    await (deps.repondTelegram || repondTelegram)(chatId, `Merci${prenom ? " " + prenom : ""}, c'est noté : je t'écrirai ici.`).catch(() => {});
    await notifie("Telegram relié", `${f.nom || "Prospect"} a ouvert ton lien Telegram.`);
    return { lie: f.id };
  }

  return { synchronise, tour, valide, marqueEnvoye, ecarte, recoit, lieTelegram, envoieMaintenant };
}

function heureRdvDe(f) {
  if (f.type !== "rappel_r2" || !f.contexte.rdv) return undefined;
  return parseQuand(f.contexte.rdv, config.tz).toLocaleString("fr-FR", {
    timeZone: config.tz, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).replace(/ à (\d\d):(\d\d)$/, " à $1h$2");
}

/* Rappels de R2 : même texte que le modèle WhatsApp « rappel_rdv ». */
function texteRappel(f, angle, heureRdv) {
  const prenom = (f.nom || "").split(/\s+/)[0] || "à toi";
  return {
    texte: `Bonjour ${prenom}, petit rappel : notre rendez-vous est prévu ${heureRdv}. Tu me confirmes que c'est toujours bon pour toi ?`,
    sujet: `Rappel : notre rendez-vous ${heureRdv}`,
  };
}

const ajouteNote = (notes, n) => {
  const ligne = `[agent ${new Date().toISOString().slice(0, 10)}] en pause : ${n}`;
  return notes ? notes + "\n" + ligne : ligne;
};

/* Closing Copilot n'a qu'un résultat (vendu / relance / perdu) et pas de coordonnées.
   On le prend quand même : le suivi reste en pause jusqu'à ce que tu complètes
   le numéro ou le mail (dans Notion ou dans Suivi R1).                         */
function depuisCopilot(h) {
  if (!h || h.sparring) return null;
  const suite = { relance: "relance", perdu: "mort", vendu: null }[h.resultat];
  if (suite === undefined || suite === null) return null;
  return { id: h.id, nom: h.prospect, suite, objections: h.objections || [], quand: null };
}
