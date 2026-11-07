#!/usr/bin/env python3
"""Met à jour vite-et-cale/prix.json à partir d'Open Prices (Open Food Facts).

Open Prices est une base de prix ouverte (licence ODbL), relevés par des
particuliers en magasin. Pour chaque ingrédient de l'appli, le script :
  1. cherche les produits correspondants (par nom) ou la catégorie (fruits et légumes vendus au kilo) ;
  2. récupère leurs prix en euros relevés en France ces 12 derniers mois ;
  3. ramène chaque prix au kilo, au litre ou à la pièce (œufs) ;
  4. calcule un prix « bas » (premier quartile : les produits les moins chers du rayon),
     au niveau national et par enseigne quand elle a assez de relevés.

Utilisation :  python3 vite-et-cale/prix/maj_prix.py
Aucune dépendance : bibliothèque standard Python 3.9+ seulement.
"""
import datetime as dt
import json
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://prices.openfoodfacts.org/api/v1"
UA = "ViteEtCale/1.0 (+https://github.com/woidih-prog/copilot)"
SORTIE = Path(__file__).resolve().parent.parent / "prix.json"
JOURS = 365
MIN_ENSEIGNE = 8     # relevés minimum pour donner un prix propre à une enseigne
MIN_SURGELE = 15     # relevés minimum pour se limiter au surgelé quand on le préfère
MAX_PRODUITS = 120   # produits gardés par ingrédient (les plus relevés d'abord)

# Enseignes reconnues dans le nom du magasin (clés identiques à l'appli).
ENSEIGNES = {
    "lidl": r"\blidl\b", "aldi": r"\baldi\b", "leader": r"leader ?price", "leclerc": r"leclerc",
    "auchan": r"auchan", "inter": r"intermarch", "superu": r"\b(super|hyper) ?u\b|\bu express\b|syst[eè]me u",
    "carrefour": r"carrefour", "casino": r"casino|g[ée]ant", "runmarket": r"run ?market", "monoprix": r"monoprix",
}

# base : "kg", "l" ou "piece".  noms : recherches par nom ;  cat : catégorie de produits frais au kilo.
# garde / exclut : expressions sur le nom du produit.  surgele : le produit doit être surgelé.
INGREDIENTS = {
    "avoine":   {"base": "kg", "noms": ["flocons d'avoine"], "exclut": r"chocolat|miel|fruit|croustill|muesli|boisson"},
    "lait":     {"base": "l", "noms": ["lait demi-écrémé", "lait 1/2 écrémé", "lait demi écrémé"], "exclut": r"chocolat|vanille|fraise|caf[ée]|poudre|concentr|riz|soja|amande|avoine"},
    "fb":       {"base": "kg", "noms": ["fromage blanc"], "exclut": r"fruit|vanille|fraise|aromat|sucr|framboise|p[êe]che|abricot|citron|coco|mangue|gourde|faisselle"},
    "yaourt":   {"base": "kg", "noms": ["yaourt nature", "yaourts nature"], "exclut": r"grec|ch[èe]vre|brebis|soja|sucr|vanille|fruit|coco|amande|avoine|boire|à boire"},
    "pain":     {"base": "kg", "noms": ["pain de mie complet", "pain complet"], "exclut": r"brioch|sans cro[ûu]te|burger|hot ?dog|toast"},
    "oeuf":     {"base": "piece", "noms": ["œufs", "oeufs"], "exclut": r"p[âa]tes|chocolat|nouille|lait|pâques|paques|tagliatelle|coquillette|spaghetti|ravioli|brouill|omelette|mayonnaise"},
    "thon":     {"base": "kg", "noms": ["thon au naturel", "thon entier", "miettes de thon"], "exclut": r"huile|sauce|tomate|salade|piment|citron|rillettes|mousse|tartinable"},
    "maq":      {"base": "kg", "noms": ["sardines", "filets de maquereaux", "maquereaux"], "exclut": r"p[âa]t[ée]|rillettes|cr[èe]me|tartin|moutarde|vin blanc|escabèche"},
    "pates":    {"base": "kg", "noms": ["spaghetti", "penne", "torsades", "coquillettes", "fusilli", "macaroni"], "exclut": r"bolognaise|carbonara|sauce|cuisin|fra[iî]ch|gluten|lentille|pois|riz|quinoa|sarrasin|ravioli|gratin|pr[eê]t|bo[îi]te|salade|repas"},
    "riz":      {"base": "kg", "noms": ["riz long", "riz basmati", "riz thaï", "riz blanc", "riz parfumé"], "exclut": r"cuisin|express|micro|salade|lait|galette|g[âa]teau|soufflé|sachets? cuisson|pr[eê]t|poulet|légume"},
    "semoule":  {"base": "kg", "noms": ["semoule de blé", "semoule fine", "semoule moyenne", "couscous moyen", "couscous grain"], "exclut": r"lait|dessert|g[âa]teau|royal|pr[ée]paration|taboul|cuisin|poulet|merguez|légume"},
    "lcorail":  {"base": "kg", "noms": ["lentilles corail"], "exclut": r"cuisin|soupe|velout|dahl|dhal|curry|pâtes|torsade"},
    "lbocal":   {"base": "kg", "noms": ["lentilles 1/2", "lentilles 4/4", "lentilles préparées", "lentilles cuisinées", "lentilles vapeur", "lentilles au naturel"], "exclut": r"saucisse|lard|petit sal|corail|salade"},
    "pchiche":  {"base": "kg", "noms": ["pois chiches"], "exclut": r"houmous|hummus|farine|snack|grill|chips|apéro|ap[ée]ritif|falafel|curry|cuisin"},
    "hrouge":   {"base": "kg", "noms": ["haricots rouges"], "exclut": r"chili|sauce|cuisin|mexic|salade"},
    "tomate":   {"base": "kg", "noms": ["tomates concassées", "pulpe de tomates", "tomates pelées", "pulpe de tomate"], "exclut": r"basilic|ail|oignon|herbe|piment|cuisin|sauce|cerise"},
    "coco":     {"base": "l", "noms": ["lait de coco"], "exclut": r"boisson|dessert|riz|yaourt|crème glac|poudre"},
    "surg":     {"base": "kg", "noms": ["haricots verts", "brocolis", "petits pois", "épinards", "julienne", "poêlée de légumes", "légumes pour"], "surgele": True, "exclut": r"cuisin|cr[èe]me|sauce|gratin|pur[ée]e|riz|poulet|p[âa]tes|beurre|lardons|conserve"},
    "tortilla": {"base": "kg", "noms": ["tortillas de blé", "tortilla de blé", "wraps nature", "tortillas"], "exclut": r"chips|poulet|chili|ma[ïi]s|nachos|mexican|kit|fajitas? kit"},
    "fromage":  {"base": "kg", "noms": ["emmental râpé"], "exclut": r"tranche|bloc|portion|mozzarella"},
    "jambon":   {"base": "kg", "noms": ["jambon blanc", "jambon cuit", "jambon supérieur"], "exclut": r"d[ée]s|allumette|cru|serrano|parme|bayonne|fum[ée]|poulet|dinde|torchon|croque|coquillette|pâtes|sandwich"},
    "steak":    {"base": "kg", "noms": ["steak haché", "steaks hachés"], "prefere_surgele": True, "exclut": r"pur[ée]e|sandwich|burger|frite|v[ée]g[ée]|soja|veau|agneau|cheval|riz|p[âa]tes|façon"},
    "poulet":   {"base": "kg", "noms": ["filet de poulet", "filets de poulet", "escalope de poulet", "escalopes de poulet", "aiguillettes de poulet", "blanc de poulet"], "prefere_surgele": True, "exclut": r"r[ôo]ti|pan[ée]|cuisin|sauce|pur[ée]e|pommes|riz|tranche|fum[ée]|grill|tikka|curry|nugget|kebab|hach|fa[çc]on|sandwich|salade|wrap|sarladaise|gratin|pâtes|chips|tenders|cordon"},
    "soupe":    {"base": "l", "noms": ["soupe de légumes", "velouté de légumes", "mouliné de légumes", "soupe légumes"], "exclut": r"miso|instant|d[ée]shydrat|chinoise|poudre|sachet|nouille|ramen|bouillon"},
    "noix":     {"base": "kg", "noms": ["cacahuètes"], "exclut": r"enrob|chocolat|beurre|p[âa]te|caram|miel|cajou"},
    "banane":   {"base": "kg", "cat": "en:bananas"},
    "pdt":      {"base": "kg", "cat": "en:potatoes"},
    "patate":   {"base": "kg", "cat": "en:sweet-potatoes"},
    "fruit":    {"base": "kg", "cat": "en:apples"},
    "leg":      {"base": "kg", "cat": "en:carrots"},
}


def get(path, **q):
    url = API + path + "?" + urllib.parse.urlencode(q)
    for essai in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # réseau capricieux : on réessaie un peu plus tard
            if essai == 3:
                raise
            print(f"  nouvel essai ({e})", file=sys.stderr)
            time.sleep(2 ** (essai + 1))


def pages(path, limite=20, **q):
    page = 1
    while page <= limite:
        d = get(path, page=page, size=100, **q)
        yield from d.get("items", [])
        if page >= (d.get("pages") or 1):
            break
        page += 1
        time.sleep(0.2)


def en_france(loc):
    return bool(loc) and (loc.get("osm_address_country_code") or "").upper() in ("FR", "RE", "GP", "MQ", "GF", "YT")


def a_la_reunion(loc):
    lat, lon = loc.get("osm_lat"), loc.get("osm_lon")
    return lat is not None and lon is not None and -21.5 < lat < -20.8 and 55.1 < lon < 56.0


def enseigne(loc):
    nom = " ".join(filter(None, [loc.get("osm_brand"), loc.get("osm_name")])).lower()
    for cle, motif in ENSEIGNES.items():
        if re.search(motif, nom):
            return cle
    return None


NB_OEUFS = re.compile(r"(\d{1,2})\s*(?:gros|moyens?|extra|frais|plein air|bio|x)?\s*(?:œufs|oeufs)|(?:œufs|oeufs)[^0-9]{0,30}?[x×]\s*(\d{1,2})|\b[x×]\s*(\d{1,2})\b", re.I)


def quantite(produit, base):
    """Quantité vendue, en kg, en litres ou en pièces. None si inconnue."""
    nom = produit.get("product_name") or ""
    if base == "piece":
        m = NB_OEUFS.search(nom) or NB_OEUFS.search(str(produit.get("quantity") or ""))
        if not m:
            return None
        n = int(next(g for g in m.groups() if g))
        return n if 4 <= n <= 30 else None
    q, u = produit.get("product_quantity"), (produit.get("product_quantity_unit") or "").lower()
    if not q or q <= 0:
        return None
    if u in ("g", "ml"):
        return q / 1000
    if u in ("kg", "l"):
        return q
    if u == "cl":
        return q / 100
    return None


def surgele(p):
    n = (p.get("product_name") or "").lower()
    return "surgel" in n or any("frozen" in c for c in p.get("categories_tags") or [])


def produits(cfg, seulement_surgele=False):
    trouves = {}
    for nom in cfg["noms"]:
        for p in pages("/products", limite=3, product_name__like=nom, price_count__gte=1, order_by="-price_count"):
            n = (p.get("product_name") or "").lower()
            if not n or re.search(cfg.get("exclut", r"$^"), n):
                continue
            if (cfg.get("surgele") or seulement_surgele) and not surgele(p):
                continue
            if quantite(p, cfg["base"]) is None:
                continue
            trouves[p["code"]] = p
    return sorted(trouves.values(), key=lambda p: -(p.get("price_count") or 0))[:MAX_PRODUITS]


def releves(cfg, depuis, seulement_surgele=False):
    """Liste de (prix unitaire, enseigne, à la Réunion ?) pour un ingrédient."""
    out = []
    if "cat" in cfg:
        for pr in pages("/prices", limite=15, category_tag=cfg["cat"], currency="EUR", date__gte=depuis, order_by="-date"):
            loc = pr.get("location") or {}
            if pr.get("price_per") == "KILOGRAM" and en_france(loc) and not pr.get("price_is_discounted"):
                out.append((pr["price"], enseigne(loc), a_la_reunion(loc)))
        return out
    prods = produits(cfg, seulement_surgele)
    qte = {p["code"]: quantite(p, cfg["base"]) for p in prods}
    codes = list(qte)
    for i in range(0, len(codes), 40):
        lot = ",".join(codes[i:i + 40])
        for pr in pages("/prices", limite=10, product_code__in=lot, currency="EUR", date__gte=depuis):
            loc = pr.get("location") or {}
            q = qte.get(pr.get("product_code"))
            if q and en_france(loc) and not pr.get("price_is_discounted") and pr.get("price"):
                out.append((pr["price"] / q, enseigne(loc), a_la_reunion(loc)))
        time.sleep(0.2)
    return out


def nettoie(valeurs):
    """Retire les valeurs aberrantes (erreurs de saisie, mauvaise quantité)."""
    if len(valeurs) < 4:
        return valeurs
    med = statistics.median(valeurs)
    return [v for v in valeurs if med / 4 <= v <= med * 4]


def quartile_bas(v):
    return statistics.quantiles(v, n=4)[0] if len(v) >= 4 else min(v)


def main():
    depuis = (dt.date.today() - dt.timedelta(days=JOURS)).isoformat()
    resultat = {"maj": dt.date.today().isoformat(), "depuis": depuis,
                "source": "Open Prices (Open Food Facts), licence ODbL", "ingredients": {}}
    for ing, cfg in INGREDIENTS.items():
        print(f"{ing}…", flush=True)
        rel, surg = None, False
        if cfg.get("prefere_surgele"):
            rel = releves(cfg, depuis, seulement_surgele=True)
            surg = len(rel) >= MIN_SURGELE
            print(f"  surgelé : {len(rel)} relevés{'' if surg else ', pas assez : on prend aussi le frais'}")
        if not surg:
            rel = releves(cfg, depuis)
        tous = nettoie([v for v, _, _ in rel])
        if not tous:
            print("  aucun relevé")
            continue
        bornes = (min(tous), max(tous))
        fiche = {"base": cfg["base"], "n": len(tous), "bas": round(quartile_bas(tous), 3), "surgele": surg,
                 "median": round(statistics.median(tous), 3), "enseignes": {}}
        par = {}
        for v, ens, _ in rel:
            if ens and bornes[0] <= v <= bornes[1]:
                par.setdefault(ens, []).append(v)
        for ens, vals in sorted(par.items()):
            if len(vals) >= MIN_ENSEIGNE:
                fiche["enseignes"][ens] = {"bas": round(quartile_bas(vals), 3), "n": len(vals)}
        reu = [v for v, _, r in rel if r and bornes[0] <= v <= bornes[1]]
        if len(reu) >= MIN_ENSEIGNE:
            fiche["reunion"] = {"bas": round(quartile_bas(reu), 3), "n": len(reu)}
        resultat["ingredients"][ing] = fiche
        print(f"  {len(tous)} relevés, bas {fiche['bas']} €/{cfg['base']}, enseignes : {', '.join(fiche['enseignes']) or '-'}")
    SORTIE.write_text(json.dumps(resultat, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Écrit : {SORTIE}")


if __name__ == "__main__":
    main()
