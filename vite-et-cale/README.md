# Vite & Calé

Une semaine de repas qui calent, à petit budget, avec des produits de saison et le moins de cuisine possible.

Une seule page (`index.html`), sans serveur ni compte : le profil, la semaine et la liste de courses sont gardés sur le téléphone.

## Ce que fait la V1
- **Goûts** : « Tu manges plutôt… » de tout, fast-food maison, healthy et léger, cuisine de grand-mère, cuisine du monde, souvent végétarien, copieux (plusieurs choix). Ces plats sont tirés trois fois plus souvent dans la semaine et passent en tête de la galerie, sans faire disparaître les autres.
- **Profil** : Métropole ou La Réunion, magasin habituel, fruits et légumes au marché ou au magasin, allergies (gluten, lait, arachides, œufs, poisson, soja), régime (sans porc, végétarien), ce qu'on n'aime pas, nombre de personnes, budget, temps de cuisine.
- **Équipement** : plaques ou gazinière, four, micro-ondes, air fryer, robot cuiseur (Thermomix, Cookeo…), cocotte-minute, bouilloire. Seules les recettes faisables sont proposées ; dans la fiche, on choisit l'appareil et les étapes s'adaptent (air fryer : 20 °C et environ 20 % de temps en moins qu'au four ; conseils pour le robot cuiseur et sans cocotte-minute).
- **Budget tenu** : la liste ne dépasse jamais le budget demandé. Si la semaine complète est trop chère, l'appli prend des plats plus longs à cuisiner, puis retire des déjeuners (et en dernier des dîners), et dit ce que la liste couvre.
- **Semaine** : 7 jours, midi et soir (le petit-déjeuner et l'en-cas ne sont plus planifiés ni comptés), image et prix de chaque plat, « Changer ce plat », préparation du dimanche.
- **Recettes** (`recettes.js`) : 76 plats pour midi et soir, 6 petits-déjeuners et 5 goûters : les plats du quotidien (pâtes, poulet rôti, hachis, croque, quiche, moules-frites…), des plats du Maghreb, des Antilles, de La Réunion et d'Afrique de l'Ouest, d'Italie, d'Asie et d'Amérique, et 7 plats sans cuisson ou presque. Filtre par cuisine dans l'onglet Plats, plat du soir mis en avant chaque jour. Le temps de cuisine se choisit : zéro cuisson, 10, 20 ou 45 minutes, ou jusqu'à 1 h 30.
- **Promos** : prix remisés relevés en magasin ces 30 derniers jours (Open Prices), dans un rayon de 5 à 50 km autour de sa ville (ou de son arrondissement à Paris, Lyon et Marseille), chez son enseigne ou partout. Ceux qui portent sur un ingrédient de l'appli sont mis en avant ; « Je la prends » utilise la promo pour le budget et les recettes pendant 7 jours.
- **Promos en direct** : en plus de `promos.json` (refait chaque jour), l'appli lit directement Open Prices à l'ouverture puis toutes les minutes : une promo partagée apparaît tout de suite chez les autres, avec l'heure (« il y a 20 min ») et le pseudo Open Prices de qui l'a vue. Les règles de rattachement aux ingrédients sont celles de `maj_prix.py`, livrées dans `promos.json` (`regles`). Un badge sur l'onglet Promos compte les nouvelles promos du coin.
- **Durée de vie des promos** : une promo reste affichée 2 jours (date courte), 7 jours (promo) ou 14 jours (carte fidélité, lot, saison) à partir du jour du relevé, sauf date de fin indiquée. Elle porte « Vue aujourd'hui », « Vue hier » ou « À vérifier » et pâlit avec l'âge ; ensuite elle passe dans « Promos sans doute finies ». Un 👍 crée un nouveau relevé daté du jour et la relance. « Je la prends » ne dure jamais au-delà de la fin de la promo.
- **Date de fin partagée** : quand on indique « Valable jusqu'au » en partageant, l'appli l'écrit dans le commentaire du prix sur Open Prices (« Valable jusqu'au AAAA-MM-JJ (Vite & Calé) ») et la relit chez tout le monde.
- **Toujours là ?** : « 👍 Oui, je confirme » renvoie la même promo à Open Prices pour aujourd'hui (photo de l'étiquette, compte Open Food Facts) ; « vue par N personnes » compte les pseudos différents qui l'ont relevée dans ce magasin. « 👎 Plus là » la masque seulement sur ce téléphone : Open Prices ne garde pas ce genre de vote.
- **Partager** : chaque promo a un bouton « Partager » (feuille de partage du téléphone, sinon WhatsApp) avec le lien de l'appli, et l'onglet Promos propose « Inviter mes voisins ».
- **Chasseurs de promos** : classement des pseudos qui ont partagé le plus de promos autour de sa ville sur 30 jours.
- **Semaine et promos** : l'onglet Semaine propose les promos du coin moins chères que le prix habituel d'un ingrédient (« Refaire ma semaine avec ») ; les plats qui en profitent portent l'étiquette « promo ».
- **Scanner un prix** : photo de l'étiquette en rayon ; le code-barres est lu sur la photo (BarcodeDetector du navigateur, sinon la bibliothèque ZXing, licence MIT, chargée à la demande depuis jsDelivr), le produit est retrouvé dans Open Food Facts et rattaché à un ingrédient. On saisit le prix (promo ou non) et on enchaîne les produits ; la photo n'est envoyée qu'une fois à Open Prices pour tous les prix qu'elle contient. « Juste une photo du rayon » l'envoie pour qu'Open Prices lise les étiquettes. Un compteur et des badges suivent les prix partagés.
- **J'ai vu une promo** : on note une promo du prospectus ou du rayon (produit, prix promo, prix normal, contenu, date de fin). Elle compte aussitôt dans le budget et les recettes.
- **Partage sur Open Prices** (facultatif) : avec un compte Open Food Facts et son magasin choisi sur OpenStreetMap (recherche Nominatim), la promo est envoyée à Open Prices avec la photo de l'étiquette comme preuve (code-barres lu sur la photo quand le navigateur le permet ; les fruits et légumes au kilo partent par catégorie). Le mot de passe n'est pas gardé, seul le jeton de connexion l'est, sur le téléphone. L'envoi ne marche que depuis l'appli en ligne, pas depuis l'aperçu claude.ai.
- **Prospectus de la semaine** : liens vers la page des prospectus de sa ville sur Tiendeo et vers le site officiel de l'enseigne.
- **Chez moi** : ce qu'on a au frigo, au congélateur et au placard. C'est retiré de la liste de courses, la semaine suivante l'utilise en priorité, et l'appli montre ce qu'on peut cuisiner tout de suite. « J'ai cuisiné ce plat » retire les ingrédients, « J'ai fait les courses » les range.
- **La liste d'abord** : après le questionnaire, on arrive sur Courses (premier onglet), Promos vient juste après. En tête, une jauge « dépensé sur budget, pour N personnes ». Chaque produit a son dessin au trait, qui se trace quand la ligne arrive à l'écran, et son prix en face : une promo notée affiche le prix habituel barré et le prix remisé, une promo vue près de chez soi est proposée sous la ligne (« Je la prends »).
- **Courses** : les produits qui se gardent (riz, pâtes, farine, beurre, oignons, pommes de terre…) dont la semaine n'utilise qu'une partie vont dans « Réserves : seulement si tu n'en as plus », avec un bouton « J'en ai » ; seule la part utilisée compte dans le budget. Liste par rayon à cocher, total estimé chez le magasin choisi, prix du paquet et prix au kilo de chaque produit, liste de tous les prix de l'enseigne avec leur origine, économie grâce à ce qu'on a déjà, copie de la liste.
- **Plats** : tous les plats permis par le profil, avec le prix par assiette.
- **Hors connexion** une fois ouverte une première fois (`sw.js`), et installable sur l'écran d'accueil (`manifest.json`).

## Accès payant (Whop), désactivé par défaut
Les identifiants Whop sont renseignés dans `index.html`, mais l'appli reste gratuite tant que `WHOP.actif` vaut `false`. Pour essayer le paiement sur un seul téléphone avant le lancement, ouvrir l'appli avec `?whop=test` (`?whop=fin` pour revenir en arrière). Une fois `WHOP.actif` à `true` :

- après le questionnaire, la personne voit un aperçu flouté de sa semaine et le bouton « Voir ma semaine », qui ouvre la page de paiement Whop (carte, essai gratuit et codes promo se règlent dans le tableau de bord Whop) ;
- de retour dans l'appli, « me connecter » ouvre la connexion Whop (OAuth 2.1 + PKCE, sans secret) puis l'appli demande à Whop si ce compte a accès au produit (`GET /users/{id}/access/{produit}`) ;
- l'accès est revérifié une fois par jour ; sans réseau il tient 7 jours ;
- un bêta-testeur passe par la même page avec un code promo à 100 % ou un lien de paiement gratuit créé dans Whop.

À faire dans Whop : créer le produit et son lien de paiement, puis une appli (Developer) avec pour « redirect URI » l'adresse exacte de l'appli (`https://woidih-prog.github.io/copilot/vite-et-cale/`). Seuls des identifiants publics (`app_…`, `prod_…`, lien de paiement) vont dans le code, jamais de clé d'API.

Limites : testé avec un Whop simulé, pas encore avec un vrai compte ; une page web ne se verrouille pas à 100 % (le contrôle se fait dans le navigateur) ; sur iPhone, l'appli installée sur l'écran d'accueil et Safari ne partagent pas leur mémoire, la connexion est à vérifier sur un vrai téléphone.

## Les prix
Les prix viennent d'[Open Prices](https://prices.openfoodfacts.org) (Open Food Facts), une base ouverte de prix relevés en magasin (licence ODbL).

- `prix/maj_prix.py` lit les relevés des 12 derniers mois en France pour chaque ingrédient, les ramène au kilo, au litre ou à la pièce, et écrit `prix.json` : un prix « bas » national (premier quartile, les produits les moins chers du rayon) et, à partir de 8 relevés, un prix bas par enseigne.
- L'appli prend le prix de l'enseigne choisie quand il existe, sinon le prix bas national ajusté au magasin. À La Réunion, faute de relevés, c'est le prix national majoré d'environ 30 % pour les produits importés.
- `python3 vite-et-cale/prix/maj_prix.py --promos` met à jour seulement `promos.json`, en quelques secondes.
- La semaine limite à 4 les repas avec le même féculent (pommes de terre, pâtes, riz, pain) et évite le même féculent midi et soir.
- Quand on passe à une nouvelle semaine, ce qui avait été rangé avec « J'ai fait les courses » et pas encore marqué « J'ai cuisiné » est retiré de Chez moi.
- La semaine propose chaque plat de midi ou du soir une seule fois quand le choix le permet (deux fois au plus sinon), jamais le même plat deux jours de suite, et varie aussi le matin et le goûter ; le budget est optimisé ensuite sans casser ces règles.
- Le workflow `.github/workflows/prix-vite-et-cale.yml` relit les promos chaque jour et tous les prix le lundi, et enregistre ce qui a changé. Il ne tourne qu'une fois le workflow présent sur la branche par défaut du dépôt.
- Pour mettre à jour à la main : `python3 vite-et-cale/prix/maj_prix.py` (Python 3.9+, aucune dépendance).

## Limites connues
- Les prix sont des relevés faits par des particuliers : il y en a beaucoup pour Leclerc, Carrefour, Auchan, Intermarché et Super U, peu pour Lidl, Aldi et Géant Casino, presque pas pour La Réunion.
- Les calories et protéines sont approximatives.
- Avec beaucoup d'allergies et peu de temps de cuisine, il peut en rester trop peu.

## Villes
`communes.json` (communes de plus de 500 habitants, DOM compris, et arrondissements de Paris, Lyon et Marseille) vient de l'API Découpage administratif de l'État (geo.api.gouv.fr). Pour le refaire : `python3 vite-et-cale/prix/communes.py`.

## Logos
Les logos des enseignes (`logos/`) viennent du dépôt [openfoodfacts/brand-images](https://github.com/openfoodfacts/brand-images). Ils servent uniquement à reconnaître le magasin choisi ; ce sont des marques de leurs propriétaires respectifs.

## Photos des plats
Chaque plat a une description. Pour remplacer l'illustration par une vraie photo, il suffit de déposer `photos/<identifiant>.jpg` (voir `photos/README.md`, qui liste tous les plats).

## Licences des recettes
Les recettes sont écrites pour Vite & Calé, sauf le couscous (p44) et la chorba (p46), adaptés du [Livre de cuisine de Wikilivres](https://fr.wikibooks.org/wiki/Livre_de_cuisine) sous licence [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/deed.fr). Ces deux fiches restent sous cette licence ; la source et les modifications sont indiquées dans la fiche et dans `recettes.js`.
