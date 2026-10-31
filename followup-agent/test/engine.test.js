import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuand, normalisePhone, classe, depuisFiche, apresEnvoi, apresReponse, dansFenetre } from "../src/engine.js";
import { openDb, makeRepo } from "../src/db.js";
import { makeAgent } from "../src/agent.js";
import { config } from "../src/config.js";

const T0 = new Date("2026-11-02T10:00:00Z"); // lundi
const cfg = { ...config, tz: "Europe/Paris", sendDays: [1, 2, 3, 4, 5, 6], sendFrom: "09:30", sendTo: "19:30", defaultSendMode: "validation" };

test("numéros français normalisés", () => {
  assert.equal(normalisePhone("06 12 34 56 78"), "33612345678");
  assert.equal(normalisePhone("+33 6 12 34 56 78"), "33612345678");
  assert.equal(normalisePhone("0033612345678"), "33612345678");
  assert.equal(normalisePhone("abc"), null);
});

test("relance chaude proche → court ; froide ou lointaine → long", () => {
  assert.equal(classe({ suite: "relance", chaud: "chaud", quand: "2026-11-05" }, T0).type, "court");
  assert.equal(classe({ suite: "relance", chaud: "froid", quand: "2026-11-05" }, T0).type, "long");
  assert.equal(classe({ suite: "relance", chaud: "tiede", quand: "2027-01-10" }, T0).type, "long");
  assert.equal(classe({ suite: "relance", chaud: "tiede", urgence: "pas le moment, plutôt à la rentrée" }, T0).type, "long");
});

test("mort : rien, sauf « pas le moment »", () => {
  assert.equal(classe({ suite: "mort", raison: "pas de budget" }, T0), null);
  assert.equal(classe({ suite: "mort", raison: "pas le moment, dans 3 mois" }, T0).type, "long");
});

test("R2 : rappels veille et jour, pause si pas d'heure", () => {
  const r = depuisFiche({ id: 1, suite: "r2", quand: "2026-11-06T14:00" }, null, cfg, T0);
  assert.equal(r.creer.type, "rappel_r2");
  assert.equal(r.creer.statut, "actif");
  const p = depuisFiche({ id: 1, suite: "r2", quand: "2026-11-06" }, null, cfg, T0);
  assert.equal(p.creer.statut, "en_pause");
});

test("court épuisé → bascule en long", () => {
  const f = { type: "court", etape: 3, contexte: {} };
  const p = apresEnvoi(f, T0);
  assert.equal(p.type, "long");
  assert.equal(p.etape, 0);
});

test("stop est définitif", () => {
  const p = apresReponse({ type: "court" }, { intention: "stop" }, T0);
  assert.equal(p.statut, "stop");
  assert.equal(p.consentement, false);
  const r = depuisFiche({ id: 1, suite: "relance", quand: "2026-11-20", whatsapp: true }, { statut: "stop", contexte: { suite: "mort" } }, cfg, T0);
  assert.equal(r.patch.statut, undefined);
  assert.equal(r.patch.consentement, false);
});

test("dates du tracker lues en heure de Paris (été comme hiver)", () => {
  assert.equal(parseQuand("2026-11-03T09:00", "Europe/Paris").toISOString(), "2026-11-03T08:00:00.000Z");
  assert.equal(parseQuand("2026-07-03T09:00", "Europe/Paris").toISOString(), "2026-07-03T07:00:00.000Z");
  assert.equal(parseQuand("2026-11-03T09:00:00Z").toISOString(), "2026-11-03T09:00:00.000Z");
});

test("fenêtre d'envoi en heure de Paris", () => {
  assert.equal(dansFenetre(new Date("2026-11-02T10:00:00Z"), cfg), true);  // lun 11h
  assert.equal(dansFenetre(new Date("2026-11-02T20:00:00Z"), cfg), false); // lun 21h
  assert.equal(dansFenetre(new Date("2026-11-08T10:00:00Z"), cfg), false); // dimanche
});

test("bout en bout : synchro → brouillon → envoyé → réponse", async () => {
  const repo = makeRepo(openDb(":memory:"));
  const notifs = [];
  const agent = makeAgent(repo, {
    redige: async (f, angle) => `msg ${angle}`,
    analyse: async () => ({ intention: "interesse", date: null, resume: "veut un créneau", suggestion: "Jeudi 18h ?" }),
    previens: async (t) => notifs.push(t),
  });
  const bilan = agent.synchronise("suivi-r1", [
    { id: 11, nom: "Paul", suite: "relance", chaud: "chaud", quand: "2026-11-02", telephone: "0612345678", whatsapp: true, pretexte: "le cas client" },
    { id: 12, nom: "Lina", suite: "relance", chaud: "chaud", quand: "2026-11-02" },
  ]);
  assert.deepEqual(bilan, { crees: 2, maj: 0, ignores: 0 });

  const j = await agent.tour(T0);
  assert.equal(j.brouillons, 1);
  assert.equal(j.pauses, 1); // Lina : pas de numéro
  const [m] = repo.pending();
  assert.equal(m.texte, "msg pretexte");

  const v = await agent.valide(m.id);
  assert.match(v.lien, /^https:\/\/wa\.me\/33612345678\?text=/);
  agent.marqueEnvoye(m.id);
  const paul = repo.bySource("suivi-r1", 11);
  assert.equal(paul.etape, 1);
  assert.ok(paul.prochaine > T0.toISOString());

  await agent.recoit({ texte: "ok dispo jeudi" }, paul);
  assert.equal(repo.get(paul.id).statut, "repondu");

  // Lina reçoit son numéro dans le tracker → elle repart toute seule
  agent.synchronise("suivi-r1", [{ id: 12, nom: "Lina", suite: "relance", chaud: "chaud", quand: "2026-11-02", telephone: "0699999999", whatsapp: true }]);
  assert.equal(repo.bySource("suivi-r1", 12).statut, "actif");
});

import { corpsCloud, parametre } from "../src/whatsapp.js";

test("modèle Meta : prénom + message, sans retour à la ligne", () => {
  const f = { telephone: "33612345678", nom: "Paul Durand", type: "court", derniere_entree: null };
  const c = corpsCloud(f, "Ligne 1\n\nLigne     2");
  assert.equal(c.type, "template");
  assert.deepEqual(c.template.components[0].parameters.map((p) => p.text), ["Paul", "Ligne 1 Ligne 2"]);
  assert.equal(parametre("", "à toi"), "à toi");
});

test("dans les 24 h après sa réponse : message libre", () => {
  const f = { telephone: "33612345678", nom: "Paul", type: "court", derniere_entree: new Date().toISOString() };
  assert.equal(corpsCloud(f, "Top, jeudi 18h ?").type, "text");
});

test("mode cloud + auto : part tout seul, sans validation", async () => {
  config.transport = "cloud";
  try {
    const repo = makeRepo(openDb(":memory:"));
    const envois = [];
    const agent = makeAgent(repo, {
      redige: async (f, angle, h, o) => `msg ${angle} ${o.sansSalutation ? "sans-salut" : ""}`.trim(),
      envoie: async (f, texte, o) => { envois.push({ texte, o }); return "wamid." + envois.length; },
      previens: async () => {},
    });
    agent.synchronise("suivi-r1", [
      { id: 1, nom: "Paul", suite: "relance", chaud: "chaud", quand: "2026-11-02", telephone: "0612345678", whatsapp: true },
      { id: 2, nom: "Lina", suite: "r2", quand: "2026-11-03T14:00", telephone: "0699999999", whatsapp: true },
    ]);
    repo.list().forEach((f) => repo.update(f.id, { mode_envoi: "auto" }));
    const j = await agent.tour(new Date("2026-11-02T14:00:00Z")); // lundi 15h : le rappel de la veille est dû
    assert.deepEqual(j.erreurs, []);
    assert.equal(j.envoyes, 2);
    assert.equal(repo.pending().length, 0);
    assert.ok(envois.some((e) => e.texte === "msg pretexte sans-salut"));
    const rappel = envois.find((e) => e.o.heureRdv);
    assert.match(rappel.o.heureRdv, /mardi 3 novembre à 14h00/);
    assert.equal(repo.bySource("suivi-r1", 1).etape, 1);
  } finally { config.transport = "assist"; }
});
