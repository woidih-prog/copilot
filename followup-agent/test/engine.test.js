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
    redige: async (f, angle) => ({ texte: `msg ${angle}` }),
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
import { CANAUX, canalDe } from "../src/canaux/index.js";
import { litWebhookSms } from "../src/canaux/sms.js";
import { litWebhookTelegram } from "../src/canaux/telegram.js";
import { nettoieReponse } from "../src/canaux/email.js";

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
  const canauxAvant = config.canaux;
  config.canaux = ["whatsapp"];
  try {
    const repo = makeRepo(openDb(":memory:"));
    const envois = [];
    const agent = makeAgent(repo, {
      redige: async (f, angle, h, o) => ({ texte: `msg ${angle} ${o.sansSalutation ? "sans-salut" : ""}`.trim() }),
      canaux: { ...CANAUX, whatsapp: { ...CANAUX.whatsapp, envoie: async (f, { texte }, o) => { envois.push({ texte, o }); return "wamid." + envois.length; } } },
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
  } finally { config.transport = "assist"; config.canaux = canauxAvant; }
});

/* ---------- multi-canal ---------- */
const faux = (nom, joignable, envois) => ({
  nom, configure: () => true, joignable, automatique: () => true,
  finalise: CANAUX[nom].finalise,
  envoie: async (f, msg) => { envois.push({ nom, ...msg }); return `${nom}:${envois.length}`; },
});

test("choix du canal : celui de la fiche, sinon l'ordre de .env", () => {
  const c = { sms: faux("sms", (f) => !!f.telephone, []), email: faux("email", (f) => !!f.email, []), whatsapp: faux("whatsapp", (f) => !!f.telephone, []), telegram: faux("telegram", (f) => !!f.telegram_chat_id, []) };
  const avant = config.canaux; config.canaux = ["sms", "email"];
  try {
    assert.equal(canalDe({ telephone: "336", email: "a@b.fr" }, { canaux: c }).nom, "sms");
    assert.equal(canalDe({ email: "a@b.fr" }, { canaux: c }).nom, "email");
    assert.equal(canalDe({ telephone: "336", email: "a@b.fr", canal: "email" }, { canaux: c }).nom, "email");
    assert.equal(canalDe({ telephone: "336", canal: "telegram" }, { canaux: c }).nom, "sms"); // Telegram pas relié → repli
    assert.equal(canalDe({}, { canaux: c }), null);
  } finally { config.canaux = avant; }
});

test("SMS automatique avec mention STOP au premier message ; mail avec objet et pied", async () => {
  const envois = [];
  const c = { sms: faux("sms", (f) => !!f.telephone, envois), email: faux("email", (f) => !!f.email, envois), whatsapp: faux("whatsapp", () => false, envois), telegram: faux("telegram", () => false, envois) };
  const avant = config.canaux; config.canaux = ["sms", "email"];
  try {
    const repo = makeRepo(openDb(":memory:"));
    const agent = makeAgent(repo, {
      canaux: c, previens: async () => {}, releveMails: async () => [],
      redige: async (f, angle, h, o) => ({ texte: `[${o.canal}] ${angle}`, sujet: o.canal === "email" ? "Ton projet" : null }),
    });
    agent.synchronise("suivi-r1", [
      { id: 1, nom: "Paul", suite: "relance", chaud: "chaud", quand: "2026-11-02", telephone: "0612345678", whatsapp: true },
      { id: 2, nom: "Lina", suite: "relance", chaud: "chaud", quand: "2026-11-02", email: "Lina@Mail.fr", consentement: true },
    ]);
    repo.list().forEach((f) => repo.update(f.id, { mode_envoi: "auto" }));
    const j = await agent.tour(T0);
    assert.deepEqual(j.erreurs, []);
    assert.equal(j.envoyes, 2);
    const s = envois.find((e) => e.nom === "sms"), m = envois.find((e) => e.nom === "email");
    assert.equal(s.texte, "[sms] pretexte\nSTOP pour ne plus recevoir de messages");
    assert.equal(m.sujet, "Ton projet");
    assert.match(m.texte, /^\[email\] pretexte[\s\S]*réponds simplement « stop »/);

    // 2e SMS : plus de mention STOP
    const paul = repo.bySource("suivi-r1", 1);
    repo.update(paul.id, { prochaine: T0.toISOString() });
    await agent.tour(T0);
    assert.equal(envois.filter((e) => e.nom === "sms")[1].texte, "[sms] valeur");
  } finally { config.canaux = avant; }
});

test("réponse par mail : retrouvée par adresse, et on continue par mail", async () => {
  const repo = makeRepo(openDb(":memory:"));
  const agent = makeAgent(repo, {
    previens: async () => {}, releveMails: async () => [],
    analyse: async () => ({ intention: "plus_tard", date: "2027-01-15", resume: "en janvier", suggestion: "" }),
  });
  agent.synchronise("suivi-r1", [{ id: 1, nom: "Lina", suite: "relance", chaud: "chaud", quand: "2026-11-02", email: "lina@mail.fr", telephone: "0612345678", consentement: true }]);
  const r = await agent.recoit({ extId: "mail:<a@b>", canal: "email", de: "lina@mail.fr", texte: "Plutôt en janvier" });
  assert.equal(r.statut, "actif");
  const f = repo.bySource("suivi-r1", 1);
  assert.equal(f.type, "long");
  assert.equal(f.canal, "email");
  assert.equal((await agent.recoit({ extId: "mail:<a@b>", canal: "email", de: "lina@mail.fr", texte: "x" })).doublon, true);
});

test("Telegram : le lien relie le prospect, puis ses messages sont reconnus", async () => {
  const repo = makeRepo(openDb(":memory:"));
  const reponses = [];
  const agent = makeAgent(repo, {
    previens: async () => {}, repondTelegram: async (id, t) => reponses.push(t),
    analyse: async () => ({ intention: "interesse", date: null, resume: "ok", suggestion: "" }),
  });
  agent.synchronise("suivi-r1", [{ id: 1, nom: "Paul Durand", suite: "relance", chaud: "chaud", quand: "2026-11-02", consentement: true }]);
  const f = repo.bySource("suivi-r1", 1);
  const { liaison } = litWebhookTelegram({ message: { message_id: 1, date: 1, chat: { id: 4242 }, text: "/start " + f.tg_code } });
  await agent.lieTelegram(liaison);
  assert.equal(repo.get(f.id).telegram_chat_id, "4242");
  assert.equal(repo.get(f.id).canal, "telegram");
  assert.match(reponses[0], /Merci Paul/);
  const { recu } = litWebhookTelegram({ message: { message_id: 2, date: 1, chat: { id: 4242 }, text: "Je suis partant" } });
  assert.equal((await agent.recoit(recu)).statut, "repondu");
});

test("webhook SMS : message reçu et accusé lus correctement", () => {
  const { recu } = litWebhookSms({ event: "sms:received", payload: { messageId: "m1", message: "STOP", phoneNumber: "+33612345678", receivedAt: "2026-11-02T11:41:31.000+01:00" } });
  assert.equal(recu.de, "33612345678");
  assert.equal(recu.texte, "STOP");
  assert.equal(litWebhookSms({ event: "sms:delivered", payload: { messageId: "x9" } }).statut.extId, "sms:x9");
});

test("mail : on garde sa réponse, pas la citation", () => {
  const t = "Oui jeudi ça me va.\n\nLe lun. 2 nov. 2026 à 10:00, Moi <moi@mail.fr> a écrit :\n> Salut Paul";
  assert.equal(nettoieReponse(t), "Oui jeudi ça me va.");
});

test("STOP respecté même quand l'IA est en panne", async () => {
  const repo = makeRepo(openDb(":memory:"));
  const agent = makeAgent(repo, { previens: async () => {}, analyse: async () => { throw new Error("panne"); } });
  agent.synchronise("suivi-r1", [{ id: 1, nom: "Paul", suite: "relance", chaud: "chaud", quand: "2026-11-02", telephone: "0612345678", consentement: true }]);
  const r = await agent.recoit({ extId: "sms:in:1", canal: "sms", de: "33612345678", texte: "Stop" });
  assert.equal(r.statut, "stop");
  assert.equal(repo.bySource("suivi-r1", 1).consentement, false);
});

test("SIM perso : SMS d'inconnus ignorés en silence, plafond quotidien respecté", async () => {
  const envois = [], notifs = [];
  const c = { sms: faux("sms", (f) => !!f.telephone, envois), email: faux("email", () => false, envois), whatsapp: faux("whatsapp", () => false, envois), telegram: faux("telegram", () => false, envois) };
  const avant = [config.canaux, config.sms.maxParJour, config.sendDays, config.sendFrom, config.sendTo];
  config.canaux = ["sms"]; config.sms.maxParJour = 2;
  config.sendDays = [1, 2, 3, 4, 5, 6, 7]; config.sendFrom = "00:00"; config.sendTo = "23:59"; // fenêtre ouverte en permanence
  try {
    const repo = makeRepo(openDb(":memory:"));
    const agent = makeAgent(repo, { canaux: c, previens: async (t) => notifs.push(t), releveMails: async () => [],
      redige: async (f, angle) => ({ texte: angle }) });
    const r = await agent.recoit({ extId: "sms:in:x", canal: "sms", de: "33600000000", texte: "Votre code banque : 123456" });
    assert.equal(r.inconnu, true);
    assert.equal(notifs.length, 0);

    agent.synchronise("suivi-r1", [1, 2, 3].map((i) => ({ id: i, nom: "P" + i, suite: "relance", chaud: "chaud", quand: "2020-01-01", telephone: "061234567" + i, consentement: true })));
    repo.list().forEach((f) => repo.update(f.id, { mode_envoi: "auto" }));
    const j = await agent.tour(new Date());
    assert.equal(j.envoyes, 2);
    assert.equal(j.quotaSms, true);
    assert.equal(repo.list().filter((f) => f.etape === 0).length, 1); // le 3e attend demain
  } finally { [config.canaux, config.sms.maxParJour, config.sendDays, config.sendFrom, config.sendTo] = avant; }
});
