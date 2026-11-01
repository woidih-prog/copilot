/* Tous les réglages passent par l'environnement (.env). Rien de secret dans le code. */
const e = process.env;

export const config = {
  accessCode: (e.ACCESS_CODE || "").trim().toUpperCase(),
  port: Number(e.PORT || 8787),
  dbPath: e.DB_PATH || "./data/followup.db",
  tz: e.TZ_LOCAL || "Europe/Paris",

  sendDays: (e.SEND_DAYS || "1,2,3,4,5,6").split(",").map(Number),
  sendFrom: e.SEND_FROM || "09:30",
  sendTo: e.SEND_TO || "19:30",
  tickMinutes: Number(e.TICK_MINUTES || 10),

  transport: e.TRANSPORT === "cloud" ? "cloud" : "assist",
  defaultSendMode: e.DEFAULT_SEND_MODE === "auto" ? "auto" : "validation",

  claudeModel: e.CLAUDE_MODEL || "claude-opus-5-5",

  wa: {
    token: e.WA_TOKEN || "",
    phoneNumberId: e.WA_PHONE_NUMBER_ID || "",
    appSecret: e.WA_APP_SECRET || "",
    verifyToken: e.WA_VERIFY_TOKEN || "",
    templateRelance: e.WA_TEMPLATE_RELANCE || "relance_suivi",
    templateRappelR2: e.WA_TEMPLATE_RAPPEL_R2 || "rappel_rdv",
    templateLang: e.WA_TEMPLATE_LANG || "fr",
  },

  /* Canaux, par ordre de préférence quand la fiche n'en impose pas un.
     Un canal non configuré (pas de clés) est simplement sauté.          */
  canaux: (e.CANAUX || "sms,email,whatsapp,telegram").split(",").map((s) => s.trim()).filter(Boolean),
  signature: e.SIGNATURE || "",

  sms: {
    // Passerelle « SMS Gateway for Android » : ton téléphone envoie les SMS avec ton forfait.
    url: (e.SMS_GATEWAY_URL || "https://api.sms-gate.app/3rdparty/v1").replace(/\/+$/, ""),
    user: e.SMS_USER || "",
    pass: e.SMS_PASS || "",
    webhookToken: e.SMS_WEBHOOK_TOKEN || "",
    mentionStop: e.SMS_MENTION_STOP || "premier", // premier | toujours | jamais
  },

  email: {
    smtpHost: e.SMTP_HOST || "smtp.gmail.com",
    smtpPort: Number(e.SMTP_PORT || 465),
    imapHost: e.IMAP_HOST || "imap.gmail.com",
    imapPort: Number(e.IMAP_PORT || 993),
    user: e.MAIL_USER || "",
    pass: e.MAIL_PASS || "",
    fromName: e.MAIL_FROM_NAME || "",
  },

  telegram: {
    token: e.TELEGRAM_BOT_TOKEN || "",
    bot: (e.TELEGRAM_BOT_NAME || "").replace(/^@/, ""),
    secret: e.TELEGRAM_WEBHOOK_SECRET || "",
    ownerChatId: e.TELEGRAM_OWNER_CHAT_ID || "", // pour recevoir tes alertes sur Telegram
  },

  notion: {
    token: e.NOTION_TOKEN || "",
    databaseId: e.NOTION_DATABASE_ID || "",
  },

  ntfyUrl: e.NTFY_URL || "",
  publicUrl: (e.PUBLIC_URL || "").replace(/\/+$/, ""),
};
