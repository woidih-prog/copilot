/* NOTION — ta base follow-up, éditable à la main.

   L'agent garde sa propre base (SQLite) et la recopie dans Notion.
   Dans Notion, tu peux modifier à la main ces colonnes, et l'agent les reprend :
     Statut · Prochaine relance · Type · Mode · Consentement WhatsApp · Notes
   Les autres colonnes sont écrites par l'agent : inutile de les toucher.

   Colonnes à créer dans la base Notion (noms exacts) :
     Nom (titre) · Téléphone (téléphone) · Type (select) · Statut (select)
     Étape (nombre) · Prochaine relance (date) · Mode (select)
     Consentement WhatsApp (case) · Objectif (texte) · Prétexte (texte)
     Dernier échange (texte) · Notes (texte) · ID agent (nombre)          */
import { config } from "./config.js";
import { parseQuand } from "./engine.js";

const API = "https://api.notion.com/v1";
const actif = () => !!(config.notion.token && config.notion.databaseId);

async function notion(path, method, body) {
  const r = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${config.notion.token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Notion : " + (j.message || "HTTP " + r.status));
  return j;
}

const txt = (s) => ({ rich_text: s ? [{ text: { content: String(s).slice(0, 1900) } }] : [] });
const sel = (s) => ({ select: s ? { name: s } : null });

function versNotion(f, dernier) {
  return {
    "Nom": { title: [{ text: { content: f.nom || "Prospect" } }] },
    "Téléphone": { phone_number: f.telephone ? "+" + f.telephone : null },
    "Type": sel(f.type),
    "Statut": sel(f.statut),
    "Étape": { number: f.etape },
    "Prochaine relance": { date: f.prochaine ? { start: f.prochaine } : null },
    "Mode": sel(f.mode_envoi),
    "Consentement WhatsApp": { checkbox: !!f.consentement },
    "Objectif": txt(f.contexte.objectif),
    "Prétexte": txt(f.contexte.pretexte),
    "Dernier échange": txt(dernier),
    "Notes": txt(f.notes),
    "ID agent": { number: f.id },
  };
}

const lit = {
  sel: (p) => p?.select?.name ?? null,
  date: (p) => p?.date?.start ?? null,
  txt: (p) => (p?.rich_text || []).map((t) => t.plain_text).join("") || null,
  num: (p) => p?.number ?? null,
  box: (p) => !!p?.checkbox,
};

const STATUTS = ["actif", "en_pause", "repondu", "gagne", "perdu", "stop", "termine"];

/* 1) Reprend tes modifications manuelles faites dans Notion. */
export async function tireDeNotion(repo, depuisIso) {
  if (!actif()) return 0;
  let curseur, n = 0;
  do {
    const j = await notion(`/databases/${config.notion.databaseId}/query`, "POST", {
      filter: { timestamp: "last_edited_time", last_edited_time: { on_or_after: depuisIso } },
      start_cursor: curseur,
      page_size: 100,
    });
    for (const page of j.results) {
      const id = lit.num(page.properties["ID agent"]);
      const f = id && repo.get(id);
      if (!f) continue;
      // Modifié par toi après notre dernier envoi ? (5 s de marge pour notre propre écriture)
      if (f.notion_sync && new Date(page.last_edited_time) <= new Date(new Date(f.notion_sync).getTime() + 5000)) continue;
      const p = page.properties;
      const patch = {};
      const statut = lit.sel(p["Statut"]);
      if (statut && STATUTS.includes(statut) && statut !== f.statut) patch.statut = statut;
      const type = lit.sel(p["Type"]);
      if (["court", "long", "rappel_r2"].includes(type) && type !== f.type) patch.type = type;
      const mode = lit.sel(p["Mode"]);
      if (["auto", "validation"].includes(mode) && mode !== f.mode_envoi) patch.mode_envoi = mode;
      const date = lit.date(p["Prochaine relance"]);
      const jourSeul = date && date.length <= 10;
      const meme = !date ? !f.prochaine
        : !!f.prochaine && (jourSeul ? f.prochaine.slice(0, 10) === date : new Date(date).getTime() === new Date(f.prochaine).getTime());
      if (!meme) patch.prochaine = date ? parseQuand(date, config.tz).toISOString() : null;
      const ok = lit.box(p["Consentement WhatsApp"]);
      if (ok !== f.consentement && f.statut !== "stop") patch.consentement = ok;
      const notes = lit.txt(p["Notes"]);
      if (notes !== (f.notes || null)) patch.notes = notes;
      if (Object.keys(patch).length) { repo.update(f.id, patch); n++; }
    }
    curseur = j.has_more ? j.next_cursor : undefined;
  } while (curseur);
  return n;
}

/* 2) Recopie dans Notion tout ce qui a changé côté agent. */
export async function pousseVersNotion(repo) {
  if (!actif()) return 0;
  let n = 0;
  for (const f of repo.dirty()) {
    const h = repo.history(f.id);
    const d = h[h.length - 1];
    const dernier = d ? `${d.sens === "sortant" ? "Moi" : "Lui"} : ${d.texte}` : null;
    const properties = versNotion(f, dernier);
    const page = f.notion_page_id
      ? await notion(`/pages/${f.notion_page_id}`, "PATCH", { properties })
      : await notion(`/pages`, "POST", { parent: { database_id: config.notion.databaseId }, properties });
    repo.markSynced(f.id, page.id, new Date().toISOString());
    n++;
  }
  return n;
}

export const notionActif = actif;
