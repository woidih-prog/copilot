/* LES CANAUX — même interface pour tous :
     configure()            les clés sont-elles là ?
     joignable(f)           a-t-on de quoi joindre ce prospect ?
     automatique()          peut-il partir sans toi ? (WhatsApp assisté : non)
     finalise(f, texte, h)  ajouts obligatoires (mention STOP, signature…)
     envoie(f, msg, opts)   envoie, renvoie l'id externe                   */
import { config } from "../config.js";
import { sms } from "./sms.js";
import { email } from "./email.js";
import { telegram } from "./telegram.js";
import { envoieCloud, fenetreOuverte } from "../whatsapp.js";

const whatsapp = {
  nom: "whatsapp",
  configure: () => true, // en mode assisté, il marche toujours (lien wa.me)
  joignable: (f) => !!f.telephone,
  automatique: () => config.transport === "cloud",
  finalise: (f, texte) => texte,
  /* Hors des 24 h après sa dernière réponse, Meta impose un modèle qui dit déjà « Bonjour <prénom>, ». */
  sansSalutation: (f, maintenant) => config.transport === "cloud" && !fenetreOuverte(f, maintenant),
  envoie: (f, { texte }, opts) => envoieCloud(f, texte, opts),
};

export const CANAUX = { sms, email, whatsapp, telegram };
export const NOMS_CANAUX = Object.keys(CANAUX);

/* Le canal à utiliser pour ce prospect, ou null s'il est injoignable.
   1. son canal choisi (fiche ou Notion), s'il est utilisable ;
   2. sinon le premier de CANAUX (dans .env) qui est configuré et joignable. */
export function canalDe(f, deps = {}) {
  const dispo = deps.canaux || CANAUX;
  const ok = (n) => dispo[n] && dispo[n].configure() && dispo[n].joignable(f);
  if (f.canal && ok(f.canal)) return dispo[f.canal];
  const n = config.canaux.find(ok);
  return n ? dispo[n] : null;
}
