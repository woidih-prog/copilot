/* TELEGRAM — un bot gratuit (créé en 2 min avec @BotFather).
   Limite de Telegram : un bot ne peut pas écrire le premier. Le prospect
   doit ouvrir une fois ton lien t.me/<bot>?start=<code> (à lui donner en
   fin de call, par SMS ou par mail). Ensuite l'agent lui écrit librement.
   Les messages viennent du bot, pas de ton compte perso.                 */
import { config } from "../config.js";

const c = () => config.telegram;
const API = (methode) => `https://api.telegram.org/bot${c().token}/${methode}`;

async function tg(methode, corps) {
  const r = await fetch(API(methode), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error("Telegram : " + (j.description || "HTTP " + r.status));
  return j.result;
}

export const lienTelegram = (f) => (c().bot && f.tg_code ? `https://t.me/${c().bot}?start=${f.tg_code}` : null);

export const telegram = {
  nom: "telegram",
  configure: () => !!c().token,
  joignable: (f) => !!f.telegram_chat_id,
  automatique: () => true,
  finalise: (f, texte) => texte,
  async envoie(f, { texte }) {
    const m = await tg("sendMessage", { chat_id: f.telegram_chat_id, text: texte });
    return "tg:" + f.telegram_chat_id + ":" + m.message_id;
  },
};

/* Lit une mise à jour du bot : liaison (/start <code>) ou message. */
export function litWebhookTelegram(update) {
  const m = update?.message;
  if (!m?.chat?.id) return {};
  const texte = String(m.text ?? m.caption ?? (m.voice ? "[message vocal]" : "[pièce jointe]"));
  const lien = texte.match(/^\/start\s+([\w-]{4,40})/);
  if (lien) return { liaison: { code: lien[1], chatId: String(m.chat.id) } };
  return {
    recu: {
      extId: `tg:${m.chat.id}:in:${m.message_id}`,
      canal: "telegram",
      de: String(m.chat.id),
      texte,
      quand: new Date(m.date * 1000).toISOString(),
    },
  };
}

export const repondTelegram = (chatId, texte) => tg("sendMessage", { chat_id: chatId, text: texte });

export const enregistreWebhookTelegram = (urlPublique) =>
  tg("setWebhook", { url: `${urlPublique}/webhook/telegram`, secret_token: c().secret, allowed_updates: ["message"] });
