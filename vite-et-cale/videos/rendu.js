// Fabrique les vidéos MP4 à partir de video.html : une image par instant, puis ffmpeg.
// Usage : node rendu.js [1 2 3]      (Playwright et ffmpeg doivent être installés)
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");

const IPS = 30;
const NOMS = { 1: "1-semaine-a-petit-budget", 2: "2-promos-du-coin", 3: "3-liste-de-courses" };

async function rendre(page, v) {
  await page.goto("file://" + path.join(__dirname, "video.html") + `?v=${v}&rendu`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  const duree = await page.evaluate(() => window.DUREE);
  const sortie = path.join(__dirname, NOMS[v] + ".mp4");
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(IPS), "-c:v", "mjpeg", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",   // piste son muette : certaines applis refusent une vidéo sans son
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-shortest",
    "-movflags", "+faststart", sortie], { stdio: ["pipe", "inherit", "inherit"] });
  const total = Math.round(duree / 1000 * IPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate(ms => window.seek(ms), i * 1000 / IPS);
    const img = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((ok, ko) => ff.on("close", c => c ? ko(new Error("ffmpeg " + c)) : ok()));
  console.log(sortie);
}

(async () => {
  const lesquelles = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(NOMS);
  const nav = await chromium.launch();
  const page = await nav.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const v of lesquelles) await rendre(page, v);
  await nav.close();
})();
