// Branche les canaux une fois pour toutes : webhook SMS et webhook Telegram.
// npm run canaux            → enregistre les webhooks (PUBLIC_URL doit être rempli)
// npm run canaux -- test 0612345678 moi@mail.fr   → envoie un message d'essai sur chaque canal configuré
import { config } from "../src/config.js";
import { CANAUX } from "../src/canaux/index.js";
import { enregistreWebhookSms } from "../src/canaux/sms.js";
import { enregistreWebhookTelegram } from "../src/canaux/telegram.js";
import { normalisePhone, normaliseEmail } from "../src/engine.js";

const [action, tel, mail] = process.argv.slice(2);

if (action === "test") {
  const f = { nom: "Test", telephone: normalisePhone(tel), email: normaliseEmail(mail), telegram_chat_id: config.telegram.ownerChatId || null, type: "court" };
  for (const c of Object.values(CANAUX)) {
    if (!c.configure() || !c.joignable(f) || !c.automatique()) { console.log(`- ${c.nom} : sauté (non configuré ou pas de coordonnée)`); continue; }
    try {
      const id = await c.envoie(f, { texte: `Test de l'agent follow-up par ${c.nom}.`, sujet: "Test agent follow-up" }, { historique: [] });
      console.log(`✓ ${c.nom} : envoyé (${id})`);
    } catch (e) { console.log(`✗ ${c.nom} : ${e.message}`); }
  }
  process.exit(0);
}

if (!config.publicUrl) { console.error("Remplis PUBLIC_URL dans .env (ex. https://…ts.net/followup)."); process.exit(1); }
if (CANAUX.sms.configure()) {
  if (!config.sms.webhookToken) console.error("SMS : remplis SMS_WEBHOOK_TOKEN avant d'enregistrer le webhook.");
  else { await enregistreWebhookSms(config.publicUrl).then(() => console.log("✓ SMS : webhook enregistré"), (e) => console.error("✗ SMS :", e.message)); }
}
if (CANAUX.telegram.configure()) {
  if (!config.telegram.secret) console.error("Telegram : remplis TELEGRAM_WEBHOOK_SECRET avant d'enregistrer le webhook.");
  else { await enregistreWebhookTelegram(config.publicUrl).then(() => console.log("✓ Telegram : webhook enregistré"), (e) => console.error("✗ Telegram :", e.message)); }
}
if (CANAUX.email.configure()) console.log("✓ Mail : rien à enregistrer, les réponses sont relevées à chaque tour.");
