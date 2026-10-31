// Un seul tour de garde, puis on sort. Pour un cron si tu ne veux pas
// laisser tourner le serveur :  */10 * * * * cd ~/followup-agent && npm run tick
import { config } from "../src/config.js";
import { openDb, makeRepo } from "../src/db.js";
import { makeAgent } from "../src/agent.js";

const j = await makeAgent(makeRepo(openDb(config.dbPath))).tour();
console.log(JSON.stringify(j));
