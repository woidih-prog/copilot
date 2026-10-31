/* LE MOTEUR — règles pures, sans réseau. Testé dans test/engine.test.js.
   Il décide : quel type de follow-up, quand, et que faire d'une réponse. */
import { SEQUENCES, DEMARRAGE_PAR_DEFAUT } from "./sequences.js";

const JOUR = 86400000;
const TEMPS = /pas (le|encore le) moment|plus tard|rentr[ée]e|dans \d+ mois|mois prochain|l'an(n[ée]e)? prochain|janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre/i;

/* ---------- téléphone ---------- */
export function normalisePhone(raw) {
  if (!raw) return null;
  let d = String(raw).replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^0\d{9}$/.test(d)) d = "33" + d.slice(1); // 06 12 34 56 78 → 33612345678
  return /^\d{8,15}$/.test(d) ? d : null;
}

/* ---------- dates ---------- */
const addDays = (d, n) => new Date(new Date(d).getTime() + n * JOUR);

/* Les dates du tracker sont en heure de Paris, sans fuseau (« 2026-11-04 »,
   « 2026-11-04T14:00 »). On les lit dans ce fuseau, quel que soit celui du serveur.
   Une date seule = ce jour-là à minuit : l'envoi part à l'ouverture de la fenêtre. */
export function parseQuand(q, tz = process.env.TZ_LOCAL || "Europe/Paris") {
  if (!q) return null;
  let s = String(q);
  if (s.length <= 10) s += "T00:00:00";
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(s)) { const d = new Date(s); return isNaN(d) ? null : d; }
  const naif = new Date(s + "Z"); // les chiffres lus comme s'ils étaient UTC
  if (isNaN(naif)) return null;
  // décalage du fuseau à cet instant (heure d'été / d'hiver comprise)
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(naif).map((x) => [x.type, x.value]));
  const vu = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return new Date(naif.getTime() - (vu - naif.getTime()));
}

function heureLocale(date, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date).map((x) => [x.type, x.value]));
  const jour = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[p.weekday];
  return { jour, hhmm: `${p.hour}:${p.minute}` };
}

/* Un message n'est envoyé qu'aux heures où un humain écrirait. */
export function dansFenetre(date, cfg) {
  const { jour, hhmm } = heureLocale(date, cfg.tz);
  return cfg.sendDays.includes(jour) && hhmm >= cfg.sendFrom && hhmm <= cfg.sendTo;
}

/* ---------- classement : court, long, rappel R2, ou rien ---------- */
export function classe(fiche, maintenant = new Date()) {
  const texte = [fiche.urgence, fiche.raison, fiche.note, ...(fiche.objections || [])].filter(Boolean).join(" ");
  const quand = parseQuand(fiche.quand);

  if (fiche.suite === "r2") {
    if (!quand || String(fiche.quand).length <= 10) return { type: "rappel_r2", rdv: quand, heureManquante: true };
    return { type: "rappel_r2", rdv: quand };
  }

  if (fiche.suite === "relance") {
    const debut = quand || addDays(maintenant, DEMARRAGE_PAR_DEFAUT.court);
    const jours = (debut - maintenant) / JOUR;
    const long = fiche.chaud === "froid" || jours > 21 || TEMPS.test(texte);
    return { type: long ? "long" : "court", debut: quand || addDays(maintenant, long ? DEMARRAGE_PAR_DEFAUT.long : DEMARRAGE_PAR_DEFAUT.court) };
  }

  if (fiche.suite === "mort" && TEMPS.test(texte)) {
    // « pas maintenant » n'est pas « non » : on le garde au chaud, de loin.
    return { type: "long", debut: quand || addDays(maintenant, DEMARRAGE_PAR_DEFAUT.apres_mort) };
  }
  return null;
}

/* ---------- planification ---------- */
export function premiereEcheance(c, maintenant = new Date()) {
  if (c.type === "rappel_r2") {
    if (!c.rdv || c.heureManquante) return null;
    return prochainRappel(c.rdv, 0, maintenant);
  }
  return c.debut;
}

function prochainRappel(rdv, etape, maintenant) {
  const rappels = SEQUENCES.rappel_r2.rappels;
  for (let i = etape; i < rappels.length; i++) {
    const t = new Date(rdv.getTime() - rappels[i].avantHeures * 3600000);
    if (t > maintenant) return { etape: i, quand: t };
  }
  return null;
}

export function angleDe(f) {
  if (f.type === "rappel_r2") return SEQUENCES.rappel_r2.rappels[f.etape]?.angle;
  return SEQUENCES[f.type]?.etapes[f.etape]?.angle;
}

/* Après un envoi : étape suivante, ou fin de séquence. */
export function apresEnvoi(f, envoyeLe = new Date()) {
  if (f.type === "rappel_r2") {
    const n = f.etape + 1;
    const rappels = SEQUENCES.rappel_r2.rappels;
    if (n >= rappels.length) return { etape: n, prochaine: null, statut: "termine" };
    const rdv = parseQuand(f.contexte.rdv);
    return { etape: n, prochaine: new Date(rdv.getTime() - rappels[n].avantHeures * 3600000).toISOString() };
  }
  const seq = SEQUENCES[f.type];
  const n = f.etape + 1;
  if (n < seq.etapes.length) return { etape: n, prochaine: addDays(envoyeLe, seq.etapes[n].apres).toISOString() };
  if (seq.fin === "long" && f.type !== "long") {
    // séquence courte épuisée : bascule en long, 1re étape longue après le délai de la 2e
    return { type: "long", etape: 0, prochaine: addDays(envoyeLe, SEQUENCES.long.etapes[1].apres).toISOString() };
  }
  return { etape: n, prochaine: null, statut: "termine" };
}

/* ---------- synchronisation depuis le tracker ----------
   Renvoie le patch à appliquer (ou l'objet à créer). Règles :
   - un « stop » du prospect est définitif, aucune synchro ne le relance ;
   - si la décision (suite / date) change dans le tracker, on replanifie ;
   - sinon on met juste à jour le contexte, sans toucher à l'avancement.   */
export function depuisFiche(fiche, existant, cfg, maintenant = new Date()) {
  const c = classe(fiche, maintenant);
  const contexte = {
    activite: fiche.activite, objectif: fiche.objectif, probleme: fiche.probleme,
    douleur: fiche.douleur, budget: fiche.budget, decideur: fiche.decideur,
    urgence: fiche.urgence, objections: fiche.objections || [], verbatim: fiche.verbatim,
    chaud: fiche.chaud, manque: fiche.manque, pretexte: fiche.pretexte, raison: fiche.raison,
    note: fiche.note, suite: fiche.suite, quand: fiche.quand, rdv: c?.type === "rappel_r2" ? fiche.quand : undefined,
  };
  const base = {
    nom: fiche.nom || null,
    telephone: normalisePhone(fiche.telephone) || existant?.telephone || null,
    consentement: fiche.whatsapp === true || fiche.consentement === true || !!existant?.consentement,
    contexte,
  };

  if (existant?.statut === "stop") return { patch: { ...base, consentement: false } };

  const decisionChangee = !existant || existant.contexte.suite !== fiche.suite || existant.contexte.quand !== fiche.quand;
  if (!decisionChangee) return { patch: base };

  if (!c) return existant ? { patch: { ...base, statut: "termine", prochaine: null } } : { rien: true };

  const ech = premiereEcheance(c, maintenant);
  const plan = {
    type: c.type,
    etape: ech?.etape ?? 0,
    prochaine: (ech?.quand ?? ech)?.toISOString?.() ?? null,
    statut: c.heureManquante ? "en_pause" : !ech ? "termine" : "actif",
  };
  return existant ? { patch: { ...base, ...plan } } : { creer: { ...base, ...plan, mode_envoi: cfg.defaultSendMode } };
}

/* ---------- ce que l'on fait d'une réponse ---------- */
export function apresReponse(f, analyse, maintenant = new Date()) {
  const p = { derniere_entree: maintenant.toISOString() };
  switch (analyse.intention) {
    case "stop":            // opt-out : plus jamais de message automatique
      return { ...p, statut: "stop", prochaine: null, consentement: false };
    case "pas_interesse":
      return { ...p, statut: "perdu", prochaine: null };
    case "plus_tard": {
      const d = parseQuand(analyse.date) || addDays(maintenant, DEMARRAGE_PAR_DEFAUT.long);
      return { ...p, statut: "actif", type: "long", etape: 0, prochaine: d.toISOString() };
    }
    case "rdv_confirme":
      return { ...p, statut: f.type === "rappel_r2" ? f.statut : "repondu" };
    default:                // interesse, question, autre : c'est à toi de jouer
      return { ...p, statut: "repondu", prochaine: null };
  }
}
