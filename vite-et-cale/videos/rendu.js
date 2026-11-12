// Fabrique les vidéos MP4 à partir de video.html : une image par instant, puis ffmpeg ajoute la musique.
// Usage : node rendu.js [4 5 6]      (sans numéro : toutes ; Playwright et ffmpeg requis ; musique : python3 musique.py)
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");

const IPS = 30;

async function rendre(page, v) {
  await page.goto("file://" + path.join(__dirname, "video.html") + `?v=${v}&rendu`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  const { duree, nom, musique } = await page.evaluate(() => ({ duree: window.DUREE, nom: window.NOM, musique: window.MUSIQUE }));
  const sortie = path.join(__dirname, nom + ".mp4");
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(IPS), "-c:v", "mjpeg", "-i", "-",
    "-i", path.join(__dirname, "musique", musique + ".m4a"), "-af", "volume=3dB",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-t", String(duree / 1000),
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
  const nav = await chromium.launch();
  const page = await nav.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", e => { console.error(e.message); process.exit(1); });
  let lesquelles = process.argv.slice(2);
  if (!lesquelles.length) {
    await page.goto("file://" + path.join(__dirname, "video.html") + "?rendu");
    lesquelles = Array.from({ length: await page.evaluate(() => window.NOMBRE) }, (_, i) => String(i + 1));
  }
  for (const v of lesquelles) await rendre(page, v);
  await nav.close();
})();
