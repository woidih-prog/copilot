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

  notion: {
    token: e.NOTION_TOKEN || "",
    databaseId: e.NOTION_DATABASE_ID || "",
  },

  ntfyUrl: e.NTFY_URL || "",
  publicUrl: (e.PUBLIC_URL || "").replace(/\/+$/, ""),
};
