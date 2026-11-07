# Vite & Calé

Une semaine de repas qui calent, à petit budget, avec des produits de saison et le moins de cuisine possible.

Une seule page (`index.html`), sans serveur ni compte : le profil, la semaine et la liste de courses sont gardés sur le téléphone.

## Ce que fait la V1
- **Profil** : Métropole ou La Réunion, magasin habituel, fruits et légumes au marché ou au magasin, allergies (gluten, lait, arachides, œufs, poisson, soja), régime (sans porc, végétarien), ce qu'on n'aime pas, nombre de personnes, budget, temps de cuisine.
- **Semaine** : 7 jours, 3 repas et un en-cas, image et prix de chaque plat, « Changer ce plat », préparation du dimanche.
- **Recettes** : 39 plats pour midi et soir et 5 petits-déjeuners, du sans cuisson au plat mijoté ou au four. Le temps de cuisine se choisit : zéro cuisson, 10, 20 ou 45 minutes, ou jusqu'à 1 h 30 ; pour les plats longs, l'appli indique aussi le temps où l'on s'en occupe vraiment.
- **Chez moi** : ce qu'on a au frigo, au congélateur et au placard. C'est retiré de la liste de courses, la semaine suivante l'utilise en priorité, et l'appli montre ce qu'on peut cuisiner tout de suite. « J'ai cuisiné ce plat » retire les ingrédients, « J'ai fait les courses » les range.
- **Courses** : liste par rayon à cocher, total estimé chez le magasin choisi, prix du paquet et prix au kilo de chaque produit, liste de tous les prix de l'enseigne avec leur origine, économie grâce à ce qu'on a déjà, copie de la liste.
- **Plats** : tous les plats permis par le profil, avec le prix par assiette.
- **Hors connexion** une fois ouverte une première fois (`sw.js`), et installable sur l'écran d'accueil (`manifest.json`).

## Les prix
Les prix viennent d'[Open Prices](https://prices.openfoodfacts.org) (Open Food Facts), une base ouverte de prix relevés en magasin (licence ODbL).

- `prix/maj_prix.py` lit les relevés des 12 derniers mois en France pour chaque ingrédient, les ramène au kilo, au litre ou à la pièce, et écrit `prix.json` : un prix « bas » national (premier quartile, les produits les moins chers du rayon) et, à partir de 8 relevés, un prix bas par enseigne.
- L'appli prend le prix de l'enseigne choisie quand il existe, sinon le prix bas national ajusté au magasin. À La Réunion, faute de relevés, c'est le prix national majoré d'environ 30 % pour les produits importés.
- Le workflow `.github/workflows/prix-vite-et-cale.yml` relance le script chaque lundi et enregistre `prix.json` s'il a changé. Il ne tourne qu'une fois le workflow présent sur la branche par défaut du dépôt.
- Pour mettre à jour à la main : `python3 vite-et-cale/prix/maj_prix.py` (Python 3.9+, aucune dépendance).

## Limites connues
- Les prix sont des relevés faits par des particuliers : il y en a beaucoup pour Leclerc, Carrefour, Auchan, Intermarché et Super U, peu pour Lidl, Aldi et Géant Casino, presque pas pour La Réunion.
- Les calories et protéines sont approximatives.
- 17 plats midi et soir : avec beaucoup d'allergies et peu de temps de cuisine, il peut en rester trop peu.

## Logos
Les logos des enseignes (`logos/`) viennent du dépôt [openfoodfacts/brand-images](https://github.com/openfoodfacts/brand-images). Ils servent uniquement à reconnaître le magasin choisi ; ce sont des marques de leurs propriétaires respectifs.
