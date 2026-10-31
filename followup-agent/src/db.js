/* La base follow-up. SQLite intégré à Node (aucun serveur, aucun coût).
   C'est la source de vérité de l'agent ; Notion en est le miroir éditable. */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDb(path) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS followups (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      source           TEXT NOT NULL,            -- 'suivi-r1' | 'copilot' | 'manuel'
      source_id        TEXT NOT NULL,            -- l'id de la fiche d'origine
      nom              TEXT,
      telephone        TEXT,                     -- format international sans + : 33612345678
      consentement     INTEGER NOT NULL DEFAULT 0, -- 1 = il a dit oui pour WhatsApp
      type             TEXT NOT NULL,            -- 'court' | 'long' | 'rappel_r2'
      statut           TEXT NOT NULL DEFAULT 'actif',
        -- actif | en_pause | repondu | gagne | perdu | stop | termine
      etape            INTEGER NOT NULL DEFAULT 0, -- prochaine étape de la séquence
      prochaine        TEXT,                     -- ISO : quand l'étape suivante est due
      mode_envoi       TEXT NOT NULL DEFAULT 'validation', -- 'validation' | 'auto'
      contexte         TEXT NOT NULL DEFAULT '{}', -- JSON tiré du call
      notes            TEXT,
      derniere_sortie  TEXT,                     -- ISO du dernier message envoyé
      derniere_entree  TEXT,                     -- ISO de la dernière réponse reçue
      notion_page_id   TEXT,
      notion_sync      TEXT,                     -- ISO du dernier envoi vers Notion
      cree             TEXT NOT NULL,
      maj              TEXT NOT NULL,
      UNIQUE (source, source_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      followup_id   INTEGER NOT NULL REFERENCES followups(id),
      sens          TEXT NOT NULL,      -- 'sortant' | 'entrant'
      etape         INTEGER,
      texte         TEXT NOT NULL,
      statut        TEXT NOT NULL,      -- brouillon | a_envoyer | envoye | livre | lu | echec | recu | rejete
      wa_id         TEXT UNIQUE,        -- id WhatsApp : sert aussi d'anti-doublon webhook
      analyse       TEXT,               -- JSON : lecture de la réponse par l'IA
      cree          TEXT NOT NULL,
      maj           TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_fu_due ON followups(statut, prochaine);
    CREATE INDEX IF NOT EXISTS idx_fu_tel ON followups(telephone);
    CREATE INDEX IF NOT EXISTS idx_msg_fu ON messages(followup_id);
  `);
  return db;
}

const now = () => new Date().toISOString();

export function makeRepo(db) {
  const parse = (r) => r && { ...r, contexte: JSON.parse(r.contexte || "{}"), consentement: !!r.consentement };

  return {
    get: (id) => parse(db.prepare("SELECT * FROM followups WHERE id = ?").get(id)),
    bySource: (source, sourceId) =>
      parse(db.prepare("SELECT * FROM followups WHERE source = ? AND source_id = ?").get(source, String(sourceId))),
    byPhone: (tel) =>
      parse(db.prepare(
        "SELECT * FROM followups WHERE telephone = ? ORDER BY (statut IN ('stop','perdu','termine')), maj DESC LIMIT 1"
      ).get(tel)),
    list: () => db.prepare("SELECT * FROM followups ORDER BY prochaine IS NULL, prochaine").all().map(parse),
    /* lignes modifiées depuis leur dernier passage dans Notion */
    dirty: () => db.prepare("SELECT * FROM followups WHERE notion_sync IS NULL OR maj > notion_sync").all().map(parse),
    /* écrit sans toucher à « maj » (sinon la ligne redeviendrait sale) */
    markSynced(id, pageId, iso) {
      db.prepare("UPDATE followups SET notion_page_id = ?, notion_sync = ? WHERE id = ?").run(pageId, iso, id);
    },
    due: (iso) =>
      db.prepare("SELECT * FROM followups WHERE statut = 'actif' AND prochaine IS NOT NULL AND prochaine <= ?")
        .all(iso).map(parse),

    insert(f) {
      const t = now();
      const r = db.prepare(`INSERT INTO followups
        (source, source_id, nom, telephone, consentement, type, statut, etape, prochaine, mode_envoi, contexte, notes, cree, maj)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        f.source, String(f.source_id), f.nom ?? null, f.telephone ?? null, f.consentement ? 1 : 0,
        f.type, f.statut || "actif", f.etape || 0, f.prochaine ?? null, f.mode_envoi || "validation",
        JSON.stringify(f.contexte || {}), f.notes ?? null, t, t);
      return this.get(Number(r.lastInsertRowid));
    },

    /* Met à jour seulement les champs donnés. */
    update(id, patch) {
      const cols = Object.keys(patch);
      if (!cols.length) return this.get(id);
      const vals = cols.map((k) =>
        k === "contexte" ? JSON.stringify(patch[k]) : k === "consentement" ? (patch[k] ? 1 : 0) : patch[k] ?? null);
      db.prepare(`UPDATE followups SET ${cols.map((c) => c + " = ?").join(", ")}, maj = ? WHERE id = ?`)
        .run(...vals, now(), id);
      return this.get(id);
    },

    addMessage(m) {
      const t = now();
      const r = db.prepare(`INSERT INTO messages (followup_id, sens, etape, texte, statut, wa_id, analyse, cree, maj)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(
        m.followup_id, m.sens, m.etape ?? null, m.texte, m.statut, m.wa_id ?? null,
        m.analyse ? JSON.stringify(m.analyse) : null, t, t);
      return Number(r.lastInsertRowid);
    },
    message: (id) => db.prepare("SELECT * FROM messages WHERE id = ?").get(id),
    messageByWaId: (waId) => db.prepare("SELECT * FROM messages WHERE wa_id = ?").get(waId),
    updateMessage(id, patch) {
      const cols = Object.keys(patch);
      const vals = cols.map((k) => (k === "analyse" ? JSON.stringify(patch[k]) : patch[k] ?? null));
      db.prepare(`UPDATE messages SET ${cols.map((c) => c + " = ?").join(", ")}, maj = ? WHERE id = ?`)
        .run(...vals, now(), id);
    },
    history: (fid) => db.prepare("SELECT * FROM messages WHERE followup_id = ? ORDER BY id").all(fid),
    pending: () => db.prepare(`SELECT m.*, f.nom, f.telephone FROM messages m JOIN followups f ON f.id = m.followup_id
      WHERE m.statut IN ('brouillon','a_envoyer') AND m.sens = 'sortant' ORDER BY m.id`).all(),
    hasOpenDraft: (fid) =>
      !!db.prepare("SELECT 1 FROM messages WHERE followup_id = ? AND sens = 'sortant' AND statut IN ('brouillon','a_envoyer')").get(fid),
  };
}
