/* Te prévenir, toi. ntfy.sh : gratuit, sans compte, une app sur ton téléphone.
   Sans NTFY_URL, on écrit simplement dans le journal du serveur. */
import { config } from "./config.js";

export async function previens(titre, texte, { lien, urgent = false } = {}) {
  console.log(`[notif] ${titre} — ${texte}`);
  if (!config.ntfyUrl) return;
  try {
    await fetch(config.ntfyUrl, {
      method: "POST",
      headers: {
        Title: encodeURIComponent(titre).length === titre.length ? titre : "Follow-up",
        Priority: urgent ? "high" : "default",
        ...(lien ? { Click: lien } : {}),
      },
      body: `${titre}\n${texte}`,
    });
  } catch (e) {
    console.error("[notif] échec :", e.message);
  }
}
