/* SMS — par « SMS Gateway for Android » (open source, sms-gate.app).
   Ton vieux téléphone Android (ou un second), avec une SIM et un forfait
   SMS illimité, envoie les SMS à ta place : 0 € par message, depuis un
   vrai numéro français, et les réponses remontent toutes seules.

   Mode cloud (par défaut) : l'appli se connecte au relais api.sms-gate.app,
   l'agent parle au relais. Rien à ouvrir sur ta box.                     */
import { config } from "../config.js";
import { normalisePhone } from "../engine.js";

const c = () => config.sms;
const auth = () => "Basic " + Buffer.from(`${c().user}:${c().pass}`).toString("base64");

export const sms = {
  nom: "sms",
  configure: () => !!(c().user && c().pass),
  joignable: (f) => !!f.telephone,
  automatique: () => true,

  /* La mention STOP est obligatoire dans un SMS de prospection. */
  finalise(f, texte, historique) {
    const dejaSms = historique.some((m) => m.sens === "sortant" && m.canal === "sms" && m.statut !== "rejete" && m.statut !== "brouillon");
    const mention = c().mentionStop === "toujours" || (c().mentionStop === "premier" && !dejaSms);
    return mention && f.type !== "rappel_r2" ? `${texte}\nSTOP pour ne plus recevoir de messages` : texte;
  },

  async envoie(f, { texte }) {
    const r = await fetch(`${c().url}/message`, {
      method: "POST",
      headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ textMessage: { text: texte }, phoneNumbers: ["+" + f.telephone] }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("SMS : " + (j.message || j.error || "HTTP " + r.status));
    return j.id ? "sms:" + j.id : null;
  },
};

/* Webhook de la passerelle → messages reçus et accusés.
   Protégé par un jeton secret dans l'URL (…/webhook/sms?k=SMS_WEBHOOK_TOKEN). */
export function litWebhookSms(body) {
  const p = body?.payload || {};
  switch (body?.event) {
    case "sms:received":
      return {
        recu: {
          extId: "sms:in:" + (p.messageId || `${p.phoneNumber}:${p.receivedAt}`),
          canal: "sms",
          de: normalisePhone(p.phoneNumber),
          texte: String(p.message ?? ""),
          quand: p.receivedAt ? new Date(p.receivedAt).toISOString() : new Date().toISOString(),
        },
      };
    case "sms:sent": case "sms:delivered": case "sms:failed":
      return { statut: { extId: "sms:" + (p.messageId || p.id), statut: { "sms:sent": "envoye", "sms:delivered": "livre", "sms:failed": "echec" }[body.event] } };
    default:
      return {};
  }
}

/* À lancer une fois : la passerelle préviendra l'agent à chaque SMS reçu. */
export async function enregistreWebhookSms(urlPublique) {
  for (const event of ["sms:received", "sms:delivered", "sms:failed"]) {
    const r = await fetch(`${c().url}/webhooks`, {
      method: "POST",
      headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ id: "followup-" + event.replace(/\W/g, "-"), url: `${urlPublique}/webhook/sms?k=${encodeURIComponent(c().webhookToken)}`, event }),
    });
    if (!r.ok) throw new Error(`Webhook ${event} : HTTP ${r.status} ${await r.text()}`);
  }
}
