/* LE SERVEUR — tourne sur ton VPS, à côté du serveur du copilote.
   Aucune dépendance HTTP : le module http de Node suffit.               */
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { config } from "./config.js";
import { openDb, makeRepo } from "./db.js";
import { makeAgent } from "./agent.js";
import { verifieSignature, litWebhook } from "./whatsapp.js";
import { pageDigest } from "./digest.js";

const repo = makeRepo(openDb(config.dbPath));
const agent = makeAgent(repo);

if (!config.accessCode) {
  console.error("ACCESS_CODE manquant dans .env : le serveur refuse de démarrer sans code.");
  process.exit(1);
}

const egal = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const autorise = (req, url) =>
  egal(String(req.headers["x-code"] || url.searchParams.get("code") || "").trim().toUpperCase(), config.accessCode);

function lisCorps(req, max = 2_000_000) {
  return new Promise((ok, ko) => {
    const morceaux = []; let n = 0;
    req.on("data", (c) => { n += c.length; if (n > max) { ko(new Error("trop gros")); req.destroy(); } else morceaux.push(c); });
    req.on("end", () => ok(Buffer.concat(morceaux)));
    req.on("error", ko);
  });
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-code",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
function envoie(res, code, corps, type = "application/json; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type, ...CORS });
  res.end(typeof corps === "string" ? corps : JSON.stringify(corps));
}

const csv = (rows) => {
  const cols = ["id", "nom", "telephone", "type", "statut", "etape", "prochaine", "mode_envoi", "consentement", "derniere_sortie", "derniere_entree", "notes"];
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return "﻿" + [cols.join(";"), ...rows.map((r) => cols.map((c) => q(r[c])).join(";"))].join("\r\n");
};

const serveur = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  // Tailscale Funnel peut transmettre le préfixe /followup : on l'enlève.
  const chemin = url.pathname.replace(/^\/followup(?=\/|$)/, "") || "/";
  try {
    if (req.method === "OPTIONS") return envoie(res, 204, "");
    if (chemin === "/health") return envoie(res, 200, { ok: true, transport: config.transport });

    /* ---- Webhook WhatsApp Cloud ---- */
    if (chemin === "/webhook/whatsapp" && req.method === "GET") {
      const ok = url.searchParams.get("hub.mode") === "subscribe" && config.wa.verifyToken &&
        url.searchParams.get("hub.verify_token") === config.wa.verifyToken;
      return ok ? envoie(res, 200, url.searchParams.get("hub.challenge"), "text/plain") : envoie(res, 403, "non", "text/plain");
    }
    if (chemin === "/webhook/whatsapp" && req.method === "POST") {
      const brut = await lisCorps(req);
      if (!verifieSignature(brut, req.headers["x-hub-signature-256"])) return envoie(res, 401, { erreur: "signature" });
      envoie(res, 200, { ok: true }); // Meta veut une réponse rapide ; on traite après.
      const { recus, statuts } = litWebhook(JSON.parse(brut.toString("utf8")));
      for (const s of statuts) {
        const m = repo.messageByWaId(s.waId);
        if (m) repo.updateMessage(m.id, { statut: { sent: "envoye", delivered: "livre", read: "lu", failed: "echec" }[s.statut] || m.statut });
      }
      for (const r of recus) await agent.recoit(r).catch((e) => console.error("[webhook]", e.message));
      return;
    }

    /* ---- Tout le reste demande le code ---- */
    if (!autorise(req, url)) return envoie(res, 401, { erreur: "code d'accès invalide" });

    if (chemin === "/digest" && req.method === "GET") {
      return envoie(res, 200, pageDigest(repo, config), "text/html; charset=utf-8");
    }
    if (chemin === "/api/ping") return envoie(res, 200, { ok: true });
    if (chemin === "/api/followups" && req.method === "GET") return envoie(res, 200, repo.list());
    if (chemin === "/api/export.csv") {
      res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="followups.csv"', ...CORS });
      return res.end(csv(repo.list()));
    }

    if (req.method !== "POST") return envoie(res, 404, { erreur: "inconnu" });
    const corps = JSON.parse((await lisCorps(req)).toString("utf8") || "{}");

    // Suivi R1 (ou le copilote) pousse ses fiches
    if (chemin === "/api/sync") {
      const source = ["suivi-r1", "copilot"].includes(corps.source) ? corps.source : "suivi-r1";
      return envoie(res, 200, agent.synchronise(source, Array.isArray(corps.fiches) ? corps.fiches : []));
    }
    // Lancer un tour à la main (test)
    if (chemin === "/api/tour") return envoie(res, 200, await agent.tour());

    let m;
    if ((m = chemin.match(/^\/api\/messages\/(\d+)\/(valider|envoye|ecarter|pause)$/))) {
      const id = Number(m[1]);
      if (m[2] === "valider") return envoie(res, 200, await agent.valide(id, corps.texte));
      if (m[2] === "envoye") { agent.marqueEnvoye(id, corps.texte); return envoie(res, 200, { ok: true }); }
      agent.ecarte(id, { pause: m[2] === "pause" });
      return envoie(res, 200, { ok: true });
    }
    // Mode assist : tu colles la réponse reçue sur ton WhatsApp
    if ((m = chemin.match(/^\/api\/followups\/(\d+)\/reponse$/))) {
      const f = repo.get(Number(m[1]));
      if (!f) return envoie(res, 404, { erreur: "inconnu" });
      return envoie(res, 200, await agent.recoit({ texte: String(corps.texte || "").slice(0, 4000) }, f));
    }
    // Modifier à la main (si tu n'utilises pas Notion)
    if ((m = chemin.match(/^\/api\/followups\/(\d+)$/))) {
      const permis = ["statut", "type", "prochaine", "mode_envoi", "consentement", "notes", "telephone"];
      const patch = Object.fromEntries(Object.entries(corps).filter(([k]) => permis.includes(k)));
      return envoie(res, 200, repo.update(Number(m[1]), patch));
    }
    return envoie(res, 404, { erreur: "inconnu" });
  } catch (e) {
    console.error("[http]", e);
    if (!res.headersSent) envoie(res, 500, { erreur: e.message });
  }
});

serveur.listen(config.port, "127.0.0.1", () => {
  console.log(`Follow-up agent sur http://127.0.0.1:${config.port} · transport ${config.transport}`);
});

/* La boucle : un tour toutes les TICK_MINUTES. */
let enCours = false;
async function boucle() {
  if (enCours) return;
  enCours = true;
  try {
    const j = await agent.tour();
    if (j.brouillons || j.envoyes || j.erreurs.length) console.log("[tour]", JSON.stringify(j));
  } catch (e) { console.error("[tour]", e); }
  enCours = false;
}
setInterval(boucle, config.tickMinutes * 60000);
setTimeout(boucle, 5000);

