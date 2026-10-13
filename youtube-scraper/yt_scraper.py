#!/usr/bin/env python3
"""
yt_scraper — scraper YouTube simple et rapide (basé sur yt-dlp).

Exemples :
  python yt_scraper.py "https://www.youtube.com/@MrBeast"            # vidéos d'une chaîne
  python yt_scraper.py "https://www.youtube.com/playlist?list=..."   # playlist
  python yt_scraper.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" # une vidéo
  python yt_scraper.py "recette crêpes" -n 20                        # recherche
  python yt_scraper.py @MrBeast -n 100 --details -o mrbeast.csv      # + vues/likes/date
  python yt_scraper.py "https://youtu.be/xxxx" --comments 50 -o v.json
"""
import argparse
import csv
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

try:
    import yt_dlp
except ImportError:
    sys.exit("yt-dlp manquant : pip install -r requirements.txt")

FIELDS = [
    "id", "title", "url", "channel", "channel_url", "upload_date", "duration",
    "view_count", "like_count", "comment_count", "tags", "description",
]


def normalize_target(target):
    """Transforme l'entrée utilisateur en URL / requête comprise par yt-dlp."""
    t = target.strip()
    if t.startswith(("http://", "https://")):
        # Une URL de chaîne sans onglet -> on vise l'onglet "videos"
        if ("/@" in t or "/channel/" in t or "/c/" in t or "/user/" in t) and not any(
            t.rstrip("/").endswith(s) for s in ("/videos", "/shorts", "/streams", "/playlists")
        ):
            t = t.rstrip("/") + "/videos"
        return t
    if t.startswith("@"):
        return f"https://www.youtube.com/{t}/videos"
    if len(t) == 11 and " " not in t and all(c.isalnum() or c in "-_" for c in t):
        return f"https://www.youtube.com/watch?v={t}"  # ID de vidéo seul
    return t  # requête de recherche (gérée dans scrape)


def is_search(target):
    return not target.startswith(("http://", "https://"))


def clean(info):
    """Ne garde que les champs utiles, dans un format lisible."""
    vid = info.get("id")
    row = {k: info.get(k) for k in FIELDS}
    row["url"] = info.get("webpage_url") or info.get("url") or (
        f"https://www.youtube.com/watch?v={vid}" if vid else None)
    row["channel"] = info.get("channel") or info.get("uploader")
    row["channel_url"] = info.get("channel_url") or info.get("uploader_url")
    d = info.get("upload_date")
    if d and len(d) == 8:
        row["upload_date"] = f"{d[:4]}-{d[4:6]}-{d[6:]}"
    if isinstance(row["tags"], list):
        row["tags"] = ", ".join(row["tags"])
    if info.get("comments"):
        row["comments"] = [
            {"author": c.get("author"), "text": c.get("text"),
             "likes": c.get("like_count"), "date": c.get("timestamp")}
            for c in info["comments"]
        ]
    return row


def ydl_opts(**extra):
    opts = {"quiet": True, "no_warnings": True, "skip_download": True,
            "ignoreerrors": True}
    opts.update(extra)
    return opts


def list_entries(target, limit):
    """Récupération rapide (mode 'flat') de la liste des vidéos."""
    query = f"ytsearch{limit}:{target}" if is_search(target) else target
    opts = ydl_opts(extract_flat="in_playlist", playlistend=limit)
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(query, download=False)
    if not info:
        return []
    if "entries" not in info:  # vidéo unique
        return [info]
    return [e for e in info["entries"] if e][:limit]


def fetch_details(url, comments=0):
    extra = {}
    if comments:
        extra = {"getcomments": True,
                 "extractor_args": {"youtube": {"max_comments": [str(comments)],
                                                "comment_sort": ["top"]}}}
    with yt_dlp.YoutubeDL(ydl_opts(**extra)) as ydl:
        return ydl.extract_info(url, download=False)


def scrape(target, limit=50, details=False, comments=0, workers=8, log=print):
    target = normalize_target(target)
    log(f"→ Récupération de la liste : {target}")
    entries = list_entries(target, limit)
    log(f"  {len(entries)} vidéo(s) trouvée(s)")

    single = len(entries) == 1 and entries[0].get("formats") is not None
    if (details or comments) and not single:
        urls = [clean(e)["url"] for e in entries]
        log(f"→ Détails en parallèle ({workers} threads)…")
        with ThreadPoolExecutor(max_workers=workers) as pool:
            full = list(pool.map(lambda u: fetch_details(u, comments), urls))
        entries = [f or e for f, e in zip(full, entries)]
    elif single and comments:
        entries = [fetch_details(entries[0]["webpage_url"], comments)]
    return [clean(e) for e in entries]


def save(rows, path):
    if path.endswith(".json"):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
    else:
        cols = FIELDS + (["comments"] if any("comments" in r for r in rows) else [])
        with open(path, "w", encoding="utf-8-sig", newline="") as f:  # BOM = Excel OK
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            for r in rows:
                r = dict(r)
                if "comments" in r:
                    r["comments"] = json.dumps(r["comments"], ensure_ascii=False)
                w.writerow(r)


def fmt_num(n):
    if n is None:
        return "-"
    for unit, div in (("Md", 1e9), ("M", 1e6), ("k", 1e3)):
        if n >= div:
            return f"{n / div:.1f}{unit}"
    return str(n)


def print_table(rows):
    for i, r in enumerate(rows, 1):
        title = (r["title"] or "")[:70]
        print(f"{i:>3}. {title:<70}  {fmt_num(r['view_count']):>7} vues  {r['upload_date'] or ''}")
        print(f"     {r['url']}")


def main():
    p = argparse.ArgumentParser(
        description="Scraper YouTube simple : chaîne, playlist, vidéo ou recherche.")
    p.add_argument("cible", help="URL (chaîne/playlist/vidéo), @handle, ID vidéo ou mots-clés")
    p.add_argument("-n", "--limit", type=int, default=50, help="nombre max de vidéos (défaut 50)")
    p.add_argument("-d", "--details", action="store_true",
                   help="récupère toutes les infos (likes, date, tags, description) — plus lent")
    p.add_argument("-c", "--comments", type=int, default=0, metavar="N",
                   help="récupère les N meilleurs commentaires par vidéo")
    p.add_argument("-o", "--output", help="fichier de sortie .csv ou .json")
    p.add_argument("-w", "--workers", type=int, default=8, help="threads parallèles (défaut 8)")
    a = p.parse_args()

    start = datetime.now()
    rows = scrape(a.cible, a.limit, a.details, a.comments, a.workers,
                  log=lambda m: print(m, file=sys.stderr))
    if a.output:
        save(rows, a.output)
        print(f"✓ {len(rows)} vidéo(s) enregistrée(s) dans {a.output}", file=sys.stderr)
    else:
        print_table(rows)
    print(f"  ({(datetime.now() - start).total_seconds():.1f}s)", file=sys.stderr)


if __name__ == "__main__":
    main()
