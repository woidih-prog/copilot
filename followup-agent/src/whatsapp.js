/* WHATSAPP — deux transports, même interface.

   assist : 0 €. L'agent prépare le message ; tu l'envoies d'un tap depuis
            TON WhatsApp grâce à un lien wa.me pré-rempli. Le prospect voit
            ton numéro habituel. Les réponses ne remontent pas toutes seules :
            tu les colles dans le digest (ou tu changes le statut à la main).

   cloud  : API officielle WhatsApp Cloud (Meta). Envoi et réponses 100 %
            automatiques. Hors des 24 h qui suivent un message du prospect,
            Meta impose un « modèle » validé à l'avance, facturé au message. */
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

const GRAPH = "https://graph.facebook.com/v21.0";
const H24 = 24 * 3600 * 1000;

export const lienWaMe = (tel, texte) => `https://wa.me/${tel}?text=${encodeURIComponent(texte)}`;

/* La fenêtre gratuite : le prospect a écrit il y a moins de 24 h. */
export const fenetreOuverte = (f, now = Date.now()) =>
  !!f.derniere_entree && now - new Date(f.derniere_entree).getTime() < H24;

async function graph(body) {
  const r = await fetch(`${GRAPH}/${config.wa.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.wa.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("WhatsApp : " + (j.error?.message || "HTTP " + r.status));
  return j.messages?.[0]?.id;
}

/* Envoi par l'API Cloud. Renvoie l'id WhatsApp du message. */
export async function envoieCloud(f, texte) {
  if (fenetreOuverte(f)) {
    return graph({ to: f.telephone, type: "text", text: { body: texte, preview_url: false } });
  }
  // Hors fenêtre : modèle obligatoire. Le modèle a une seule variable {{1}} = le texte rédigé.
  const nom = f.type === "rappel_r2" ? config.wa.templateRappelR2 : config.wa.templateRelance;
  return graph({
    to: f.telephone,
    type: "template",
    template: {
      name: nom,
      language: { code: config.wa.templateLang },
      components: [{ type: "body", parameters: [{ type: "text", text: texte.replace(/\s*\n+\s*/g, " ") }] }],
    },
  });
}

/* ---------- webhook entrant ---------- */
export function verifieSignature(rawBody, signature) {
  if (!config.wa.appSecret) return false;
  const attendu = "sha256=" + createHmac("sha256", config.wa.appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(attendu), b = Buffer.from(String(signature || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

/* Aplatit le format Meta en deux listes simples. */
export function litWebhook(body) {
  const recus = [], statuts = [];
  for (const entry of body?.entry || []) {
    for (const ch of entry.changes || []) {
      const v = ch.value || {};
      for (const m of v.messages || []) {
        const texte = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title
          ?? (m.type === "audio" ? "[message vocal]" : `[${m.type}]`);
        recus.push({ waId: m.id, de: m.from, texte, quand: new Date(Number(m.timestamp) * 1000).toISOString() });
      }
      for (const s of v.statuses || []) statuts.push({ waId: s.id, statut: s.status }); // sent | delivered | read | failed
    }
  }
  return { recus, statuts };
}
