/* LE DIGEST — une page à ouvrir sur ton téléphone.
   Les relances à valider, les réponses à traiter, ce qui arrive.
   Même charte que Suivi R1. Toutes les données affichées sont échappées. */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const jour = (iso, tz) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }) : "—");

export function pageDigest(repo, config) {
  const brouillons = repo.pending();
  const tous = repo.list();
  const repondus = tous.filter((f) => f.statut === "repondu");
  const pauses = tous.filter((f) => f.statut === "en_pause");
  const avenir = tous.filter((f) => f.statut === "actif" && f.prochaine).slice(0, 15);
  const assist = config.transport === "assist";

  const carteBrouillon = (m) => `
    <div class="block" data-msg="${m.id}">
      <div class="l1"><b>${esc(m.nom || "Prospect")}</b><span class="muted">étape ${(m.etape ?? 0) + 1}</span></div>
      <textarea>${esc(m.texte)}</textarea>
      <div class="row">
        <button class="go" data-act="valider">${assist ? "Ouvrir WhatsApp" : "Envoyer"}</button>
        ${assist ? '<button data-act="envoye" class="ok" style="display:none">C\'est envoyé ✓</button>' : ""}
        <button data-act="ecarter">Réécrire</button>
        <button data-act="pause">Pause</button>
      </div>
    </div>`;

  const carteReponse = (f) => {
    const h = repo.history(f.id).filter((m) => m.sens === "entrant").pop();
    const a = h?.analyse ? JSON.parse(h.analyse) : null;
    return `<div class="block">
      <div class="l1"><b>${esc(f.nom || "Prospect")}</b><span class="tag">${esc(a?.intention || "réponse")}</span></div>
      ${h ? `<p>« ${esc(h.texte)} »</p>` : ""}
      ${a?.resume ? `<p class="muted">${esc(a.resume)}</p>` : ""}
      ${a?.suggestion ? `<p class="sugg">→ ${esc(a.suggestion)}</p>` : ""}
      ${f.telephone ? `<a class="lien" href="https://wa.me/${esc(f.telephone)}">Ouvrir la conversation</a>` : ""}
    </div>`;
  };

  const carteColler = () => assist ? `
    <div class="block">
      <h3>Un prospect t'a répondu ?</h3>
      <select id="qui">${tous.filter((f) => !["stop", "perdu", "termine"].includes(f.statut))
        .map((f) => `<option value="${f.id}">${esc(f.nom || "Prospect #" + f.id)}</option>`).join("")}</select>
      <textarea id="rep" placeholder="Colle sa réponse ici : l'agent la lit, met le suivi à jour et te propose quoi répondre."></textarea>
      <button class="go" id="btnRep">Analyser</button>
    </div>` : "";

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Follow-up</title>
<style>
:root{--bg:#0E1216;--surface:#161C22;--line:#232C34;--ink:#E9E7E2;--muted:#7B8894;--amber:#E8A33D;--clay:#D9553F;--sage:#79BF95;--steel:#5E9BC4}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif;padding:24px 16px 60px;max-width:720px;margin:auto}
h1{font-size:30px;margin-bottom:4px}h2{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:28px 0 10px}
h3{font-size:14px;margin-bottom:8px}
.block{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
.l1{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px}
.muted{color:var(--muted)}.sugg{color:var(--amber);margin-top:6px}
.tag{border:1px solid var(--steel);color:var(--steel);border-radius:99px;padding:1px 10px;font-size:12px}
textarea,select{width:100%;background:var(--bg);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:10px;font:inherit;margin-bottom:10px}
textarea{min-height:90px}
.row{display:flex;gap:8px;flex-wrap:wrap}
button{background:none;border:1px solid var(--line);color:var(--ink);border-radius:99px;padding:8px 15px;font:inherit;cursor:pointer}
button.go{background:var(--amber);border-color:var(--amber);color:#0E1216;font-weight:700}
button.ok{border-color:var(--sage);color:var(--sage)}
.lien{color:var(--steel)}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:7px 4px;border-top:1px solid var(--line)}
</style></head><body>
<p class="muted">${assist ? "Mode assisté · tu envoies depuis ton WhatsApp" : "Mode automatique · API WhatsApp"}</p>
<h1>Follow-up</h1>

<h2>À valider (${brouillons.length})</h2>
${brouillons.map(carteBrouillon).join("") || '<p class="muted">Rien à valider.</p>'}

<h2>Ils ont répondu (${repondus.length})</h2>
${repondus.map(carteReponse).join("") || '<p class="muted">Aucune réponse en attente.</p>'}
${carteColler()}

${pauses.length ? `<h2>En pause (${pauses.length})</h2><div class="block"><table>${pauses.map((f) =>
  `<tr><td>${esc(f.nom)}</td><td class="muted">${esc((f.notes || "").split("\n").pop())}</td></tr>`).join("")}</table></div>` : ""}

<h2>Prochaines relances</h2>
<div class="block"><table>${avenir.map((f) =>
  `<tr><td>${esc(f.nom)}</td><td class="muted">${esc(f.type)} · ${f.etape + 1}</td><td>${jour(f.prochaine, config.tz)}</td></tr>`).join("") || "<tr><td class='muted'>Rien de prévu.</td></tr>"}</table></div>

<p class="muted" style="margin-top:20px"><a class="lien" href="api/export.csv" id="csv">Exporter en CSV (Excel)</a></p>

<script>
const code = new URLSearchParams(location.search).get("code") || "";
document.getElementById("csv").href += "?code=" + encodeURIComponent(code);
const post = (url, body) => fetch(url, {method:"POST", headers:{"content-type":"application/json","x-code":code}, body:JSON.stringify(body||{})})
  .then(async r => { const j = await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.erreur || r.status); return j; });

document.querySelectorAll("[data-msg]").forEach(card => {
  const id = card.dataset.msg, ta = card.querySelector("textarea");
  card.querySelectorAll("[data-act]").forEach(b => b.onclick = async () => {
    try{
      const act = b.dataset.act;
      if(act === "valider"){
        const r = await post("api/messages/"+id+"/valider", {texte: ta.value});
        if(r.lien){ window.open(r.lien, "_blank"); const ok = card.querySelector('[data-act="envoye"]'); if(ok) ok.style.display = "inline-block"; return; }
      } else {
        await post("api/messages/"+id+"/"+act, {texte: ta.value});
      }
      card.style.opacity = .35; card.querySelectorAll("button").forEach(x => x.disabled = true);
    }catch(e){ alert(e.message); }
  });
});
const br = document.getElementById("btnRep");
if(br) br.onclick = async () => {
  const t = document.getElementById("rep").value.trim(); if(!t) return;
  br.disabled = true; br.textContent = "Je lis…";
  try{ await post("api/followups/"+document.getElementById("qui").value+"/reponse", {texte:t}); location.reload(); }
  catch(e){ alert(e.message); br.disabled = false; br.textContent = "Analyser"; }
};
</script>
</body></html>`;
}
