# Vite & Calé

Une semaine de repas qui calent, à petit budget, avec des produits de saison et le moins de cuisine possible.

Une seule page (`index.html`), sans serveur ni compte : le profil, la semaine et la liste de courses sont gardés sur le téléphone.

## Ce que fait la V1
- **Profil** : Métropole ou La Réunion, magasin habituel, fruits et légumes au marché ou au magasin, allergies (gluten, lait, arachides, œufs, poisson, soja), régime (sans porc, végétarien), ce qu'on n'aime pas, nombre de personnes, budget, temps de cuisine.
- **Équipement** : plaques ou gazinière, four, micro-ondes, air fryer, robot cuiseur (Thermomix, Cookeo…), cocotte-minute, bouilloire. Seules les recettes faisables sont proposées ; dans la fiche, on choisit l'appareil et les étapes s'adaptent (air fryer : 20 °C et environ 20 % de temps en moins qu'au four ; conseils pour le robot cuiseur et sans cocotte-minute).
- **Semaine** : 7 jours, 3 repas et un en-cas, image et prix de chaque plat, « Changer ce plat », préparation du dimanche.
- **Recettes** (`recettes.js`) : 66 plats pour midi et soir, 6 petits-déjeuners et 5 goûters : les plats du quotidien (pâtes, poulet rôti, hachis, croque, quiche, moules-frites…), des plats du Maghreb, des Antilles, de La Réunion et d'Afrique de l'Ouest, d'Italie, d'Asie et d'Amérique, et 7 plats sans cuisson ou presque. Filtre par cuisine dans l'onglet Plats, plat du soir mis en avant chaque jour. Le temps de cuisine se choisit : zéro cuisson, 10, 20 ou 45 minutes, ou jusqu'à 1 h 30.
- **Promos** : prix remisés relevés en magasin ces 30 derniers jours (Open Prices), dans un rayon de 5 à 50 km autour de sa ville (ou de son arrondissement à Paris, Lyon et Marseille), chez son enseigne ou partout. Ceux qui portent sur un ingrédient de l'appli sont mis en avant ; « Je la prends » utilise la promo pour le budget et les recettes pendant 7 jours.
- **Scanner un prix** : photo de l'étiquette en rayon ; le code-barres est lu sur la photo (BarcodeDetector du navigateur, sinon la bibliothèque ZXing, licence MIT, chargée à la demande depuis jsDelivr), le produit est retrouvé dans Open Food Facts et rattaché à un ingrédient. On saisit le prix (promo ou non) et on enchaîne les produits ; la photo n'est envoyée qu'une fois à Open Prices pour tous les prix qu'elle contient. « Juste une photo du rayon » l'envoie pour qu'Open Prices lise les étiquettes. Un compteur et des badges suivent les prix partagés.
- **J'ai vu une promo** : on note une promo du prospectus ou du rayon (produit, prix promo, prix normal, contenu, date de fin). Elle compte aussitôt dans le budget et les recettes.
- **Partage sur Open Prices** (facultatif) : avec un compte Open Food Facts et son magasin choisi sur OpenStreetMap (recherche Nominatim), la promo est envoyée à Open Prices avec la photo de l'étiquette comme preuve (code-barres lu sur la photo quand le navigateur le permet ; les fruits et légumes au kilo partent par catégorie). Le mot de passe n'est pas gardé, seul le jeton de connexion l'est, sur le téléphone. L'envoi ne marche que depuis l'appli en ligne, pas depuis l'aperçu claude.ai.
- **Prospectus de la semaine** : liens vers la page des prospectus de sa ville sur Tiendeo et vers le site officiel de l'enseigne.
- **Chez moi** : ce qu'on a au frigo, au congélateur et au placard. C'est retiré de la liste de courses, la semaine suivante l'utilise en priorité, et l'appli montre ce qu'on peut cuisiner tout de suite. « J'ai cuisiné ce plat » retire les ingrédients, « J'ai fait les courses » les range.
- **Courses** : liste par rayon à cocher, total estimé chez le magasin choisi, prix du paquet et prix au kilo de chaque produit, liste de tous les prix de l'enseigne avec leur origine, économie grâce à ce qu'on a déjà, copie de la liste.
- **Plats** : tous les plats permis par le profil, avec le prix par assiette.
- **Hors connexion** une fois ouverte une première fois (`sw.js`), et installable sur l'écran d'accueil (`manifest.json`).

## Les prix
Les prix viennent d'[Open Prices](https://prices.openfoodfacts.org) (Open Food Facts), une base ouverte de prix relevés en magasin (licence ODbL).

- `prix/maj_prix.py` lit les relevés des 12 derniers mois en France pour chaque ingrédient, les ramène au kilo, au litre ou à la pièce, et écrit `prix.json` : un prix « bas » national (premier quartile, les produits les moins chers du rayon) et, à partir de 8 relevés, un prix bas par enseigne.
- L'appli prend le prix de l'enseigne choisie quand il existe, sinon le prix bas national ajusté au magasin. À La Réunion, faute de relevés, c'est le prix national majoré d'environ 30 % pour les produits importés.
- `python3 vite-et-cale/prix/maj_prix.py --promos` met à jour seulement `promos.json`, en quelques secondes.
- La semaine propose chaque plat de midi ou du soir une seule fois quand le choix le permet (deux fois au plus sinon), jamais le même plat deux jours de suite, et varie aussi le matin et le goûter ; le budget est optimisé ensuite sans casser ces règles.
- Le workflow `.github/workflows/prix-vite-et-cale.yml` relit les promos chaque jour et tous les prix le lundi, et enregistre ce qui a changé. Il ne tourne qu'une fois le workflow présent sur la branche par défaut du dépôt.
- Pour mettre à jour à la main : `python3 vite-et-cale/prix/maj_prix.py` (Python 3.9+, aucune dépendance).

## Limites connues
- Les prix sont des relevés faits par des particuliers : il y en a beaucoup pour Leclerc, Carrefour, Auchan, Intermarché et Super U, peu pour Lidl, Aldi et Géant Casino, presque pas pour La Réunion.
- Les calories et protéines sont approximatives.
- 17 plats midi et soir : avec beaucoup d'allergies et peu de temps de cuisine, il peut en rester trop peu.

## Villes
`communes.json` (communes de plus de 500 habitants, DOM compris, et arrondissements de Paris, Lyon et Marseille) vient de l'API Découpage administratif de l'État (geo.api.gouv.fr). Pour le refaire : `python3 vite-et-cale/prix/communes.py`.

## Logos
Les logos des enseignes (`logos/`) viennent du dépôt [openfoodfacts/brand-images](https://github.com/openfoodfacts/brand-images). Ils servent uniquement à reconnaître le magasin choisi ; ce sont des marques de leurs propriétaires respectifs.

## Photos des plats
Chaque plat a une description. Pour remplacer l'illustration par une vraie photo, voir `photos/README.md` (photo carrée dans `photos/`, puis une ligne dans `PHOTOS` à la fin de `recettes.js`).

## Licences des recettes
Les recettes sont écrites pour Vite & Calé, sauf le couscous (p44) et la chorba (p46), adaptés du [Livre de cuisine de Wikilivres](https://fr.wikibooks.org/wiki/Livre_de_cuisine) sous licence [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/deed.fr). Ces deux fiches restent sous cette licence ; la source et les modifications sont indiquées dans la fiche et dans `recettes.js`.
