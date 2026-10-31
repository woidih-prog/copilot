/* Importe un export de Suivi R1 (Réglages → « Exporter mon pipeline »).
   npm run import -- ~/Téléchargements/pipeline-r1-2026-10-31.json        */
import { readFileSync } from "node:fs";
import { config } from "../src/config.js";
import { openDb, makeRepo } from "../src/db.js";
import { makeAgent } from "../src/agent.js";

const fichier = process.argv[2];
if (!fichier) { console.error("Usage : npm run import -- chemin/vers/pipeline-r1.json [suivi-r1|copilot]"); process.exit(1); }
const fiches = JSON.parse(readFileSync(fichier, "utf8"));
if (!Array.isArray(fiches)) { console.error("Format inattendu : il faut un tableau de fiches."); process.exit(1); }

const repo = makeRepo(openDb(config.dbPath));
const bilan = makeAgent(repo).synchronise(process.argv[3] || "suivi-r1", fiches);
console.log(`${fiches.length} fiches lues · ${bilan.crees} suivis créés · ${bilan.maj} mis à jour · ${bilan.ignores} ignorées`);
const sansTel = repo.list().filter((f) => !f.telephone).length;
if (sansTel) console.log(`${sansTel} suivi(s) sans numéro : ils resteront en pause tant que le numéro et l'accord WhatsApp manquent.`);
