/* MAIL — depuis TA boîte (Gmail ou autre), par SMTP. 0 €.
   Les réponses sont relevées par IMAP à chaque tour (toutes les 10 min).
   Gmail : active la validation en deux étapes, puis crée un « mot de passe
   d'application » (myaccount.google.com/apppasswords) → MAIL_PASS.       */
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { config } from "../config.js";
import { normaliseEmail } from "../engine.js";

export { normaliseEmail };

const c = () => config.email;
let transport;
const smtp = () => (transport ??= nodemailer.createTransport({
  host: c().smtpHost, port: c().smtpPort, secure: c().smtpPort === 465,
  auth: { user: c().user, pass: c().pass },
}));


const PIED = "\n\nSi tu préfères que je ne t'écrive plus, réponds simplement « stop ».";

export const email = {
  nom: "email",
  configure: () => !!(c().user && c().pass),
  joignable: (f) => !!f.email,
  automatique: () => true,

  finalise(f, texte) {
    const sig = config.signature ? "\n\n" + config.signature : "";
    return f.type === "rappel_r2" ? texte + sig : texte + sig + PIED;
  },

  /* Tous les mails d'un prospect restent dans le même fil de discussion. */
  async envoie(f, { texte, sujet }, { historique = [] } = {}) {
    const precedents = historique.filter((m) => m.canal === "email" && m.wa_id?.startsWith("mail:") && ["envoye", "livre", "lu", "recu"].includes(m.statut));
    const refs = precedents.map((m) => m.wa_id.slice(5));
    const premierSujet = historique.find((m) => m.canal === "email" && m.sens === "sortant" && m.sujet && m.statut === "envoye")?.sujet;
    const info = await smtp().sendMail({
      from: c().fromName ? { name: c().fromName, address: c().user } : c().user,
      to: f.email,
      subject: premierSujet ? (premierSujet.startsWith("Re:") ? premierSujet : "Re: " + premierSujet) : (sujet || "Suite à notre échange"),
      text: texte,
      ...(refs.length ? { inReplyTo: refs[refs.length - 1], references: refs } : {}),
    });
    return "mail:" + info.messageId;
  },
};

/* Garde seulement ce qu'il a écrit, sans la citation de ton message. */
export function nettoieReponse(texte) {
  const lignes = String(texte || "").replace(/\r/g, "").split("\n");
  const out = [];
  for (const l of lignes) {
    if (/^\s*>/.test(l)) break;
    if (/^(Le|On) .{5,120}(a écrit|wrote)\s*:\s*$/i.test(l.trim())) break;
    if (/^-{2,}\s*(Original Message|Message d'origine)/i.test(l.trim())) break;
    if (/^(De|From)\s*:/i.test(l.trim()) && out.length) break;
    out.push(l);
  }
  return out.join("\n").trim().slice(0, 4000);
}

/* Relève les mails reçus depuis hier venant d'un prospect suivi. */
export async function releveMails(emailsSuivis) {
  if (!email.configure() || !emailsSuivis.length) return [];
  const suivis = new Set(emailsSuivis);
  const client = new ImapFlow({ host: c().imapHost, port: c().imapPort, secure: true, auth: { user: c().user, pass: c().pass }, logger: false });
  const recus = [];
  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    const depuis = new Date(Date.now() - 2 * 86400000);
    const cibles = [];
    for await (const m of client.fetch({ since: depuis }, { envelope: true, uid: true })) {
      const de = normaliseEmail(m.envelope?.from?.[0]?.address);
      if (de && suivis.has(de)) cibles.push({ uid: m.uid, de, id: m.envelope.messageId, quand: m.envelope.date });
    }
    for (const t of cibles) {
      const brut = await client.fetchOne(String(t.uid), { source: true }, { uid: true });
      const mail = await simpleParser(brut.source);
      recus.push({
        extId: "mail:" + (t.id || mail.messageId || `${t.de}:${t.uid}`),
        canal: "email",
        de: t.de,
        texte: nettoieReponse(mail.text || ""),
        quand: new Date(t.quand || Date.now()).toISOString(),
      });
    }
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
  return recus;
}
