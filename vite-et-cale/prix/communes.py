#!/usr/bin/env python3
"""Fabrique vite-et-cale/communes.json : les communes de France (DOM compris) et les
arrondissements de Paris, Lyon et Marseille, avec leur code postal et leur position.

Source : API Découpage administratif (geo.api.gouv.fr), données publiques de l'État.
Le fichier change rarement : à relancer une fois par an suffit.

Format compact : [nom, code postal, latitude, longitude, département, population en centaines].
Utilisation :  python3 vite-et-cale/prix/communes.py
"""
import json
import urllib.request
from pathlib import Path

SORTIE = Path(__file__).resolve().parent.parent / "communes.json"
CHAMPS = "nom,code,codesPostaux,centre,population,codeDepartement"
POP_MIN = 500  # en dessous, on choisit la commune voisine : le fichier reste léger


def lire(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ViteEtCale/1.0 (+https://github.com/woidih-prog/copilot)"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def ligne(c):
    lon, lat = c["centre"]["coordinates"]
    cp = (c.get("codesPostaux") or [""])[0]
    dep = c.get("codeDepartement") or c["code"][:2]
    return [c["nom"], cp, round(lat, 3), round(lon, 3), dep, round((c.get("population") or 0) / 100)]


def main():
    communes = lire(f"https://geo.api.gouv.fr/communes?fields={CHAMPS}&format=json")
    arr = lire(f"https://geo.api.gouv.fr/communes?type=arrondissement-municipal&fields={CHAMPS}&format=json")
    garde = [c for c in communes if c.get("centre") and (c.get("population") or 0) >= POP_MIN]
    lignes = [ligne(c) for c in garde]
    for c in arr:
        if c.get("centre"):
            c["codeDepartement"] = c["code"][:2]
            lignes.append(ligne(c))
    lignes.sort(key=lambda l: l[0])
    SORTIE.write_text(json.dumps({"source": "geo.api.gouv.fr", "communes": lignes}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Écrit : {SORTIE} ({len(lignes)} lieux, dont {len(arr)} arrondissements)")


if __name__ == "__main__":
    main()
