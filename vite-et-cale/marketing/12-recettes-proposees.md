# 10 recettes proposées : végétarien et sans gluten, en 20 minutes ou moins

Ce fichier ne modifie pas `recettes.js`. Il propose du contenu prêt à copier-coller dans le tableau `R`, à vérifier et intégrer toi-même.

## Le problème

Dans le catalogue actuel (66 plats de midi et soir) :

| Filtre | 10 min max | 20 min max |
|---|---|---|
| Végétarien | 1 plat | 4 plats |
| Sans gluten | 0 plat | 5 plats |

(Comptage : végétarien = recette sans tag `viande` ni `poisson` ; sans gluten = recette qui n'utilise aucun des ingrédients listés dans `ALLERGIES` pour le gluten dans `index.html` — pain, baguette, pâtes, semoule, tortilla, farine, céréales, avoine, pâte, lasagne, bière, pain à burger.)

Quelqu'un qui coche « végétarien » et « 10 minutes » dans son profil tombe quasiment sur rien. C'est le trou que ces 10 recettes comblent.

## Ce qui change si tu les ajoutes

| Filtre | 10 min max | 20 min max |
|---|---|---|
| Végétarien | 1 → 4 | 4 → 14 |
| Sans gluten | 0 → 3 | 5 → 15 |

Les 10 recettes sont **à la fois végétariennes et sans gluten**, et tiennent toutes en 20 minutes ou moins (3 d'entre elles en 8 minutes, sans cuisson ou presque).

## Méthode suivie

- Seulement des ingrédients qui existent déjà dans `ING` (`index.html`) — y compris quelques-uns jamais utilisés dans une recette pour l'instant (`patate`, `noix`, `hblanc`...). Aucun nouvel ingrédient à ajouter au catalogue de courses.
- Aucun ingrédient de la liste gluten, aucune viande ni poisson.
- `kcal` et `p` (protéines) sont des estimations construites par comparaison avec des plats proches déjà dans le catalogue — même méthode que le fichier `recettes.js` (voir son commentaire d'en-tête : « kcal et protéines sont des estimations »). Vérifie-les si tu as un doute avant de publier, ce ne sont pas des valeurs mesurées.
- Pas de chiffre de prix calculé ici : les prix viennent automatiquement des relevés Open Prices existants pour chaque ingrédient, l'appli les calculera elle-même une fois les recettes ajoutées.
- Temps de cuisson vérifiés un par un pour être réalistes (ex. : lentilles corail et patate douce en petits dés cuisent vite, les pois chiches et haricots sont en boîte donc déjà cuits).

## Les 10 recettes

Format identique à un objet du tableau `R` de `recettes.js`. Numérotation à partir de `p67` (le dernier id utilisé est `p66`) — à ajuster si d'autres recettes sont ajoutées avant.

```js
{id:"p67",slot:"repas",origine:"asie",n:"Riz sauté aux œufs, petits pois et cacahuètes",t:15,cook:"poêle",kcal:600,p:26,tags:["oeuf"],
 ing:[["riz",80],["oeuf",2],["surg",150],["noix",25]],
 steps:["Utilise du riz cuit la veille, il colle moins à la poêle.","Petits pois surgelés et cacahuètes concassées, 3 min à la poêle avec un peu d'huile.","Ajoute les œufs battus, laisse prendre, puis le riz : 5 min en remuant, sauce soja."]},

{id:"p68",slot:"repas",origine:"classique",legNom:"tomates",n:"Salade de pois chiches, tomates et fromage",t:8,cook:"aucune",kcal:470,p:22,tags:["lait"],
 ing:[["pchiche",0.5],["leg",150],["fromage",30],["citron",15]],
 steps:["Égoutte et rince les pois chiches.","Tomates en dés et fromage en petits cubes.","Un filet de citron et d'huile d'olive, sel, poivre."]},

{id:"p69",slot:"repas",origine:"amerique",n:"Chili sin carne aux haricots rouges",t:20,actif:15,cook:"casserole",kcal:600,p:28,tags:[],
 ing:[["hrouge",1],["tomate",150],["oignon",40],["riz",70]],
 steps:["Oignon 3 min à l'huile.","Haricots rouges égouttés, tomates, cumin, paprika et un peu de piment : 12 min à feu doux.","Avec le riz."]},

{id:"p70",slot:"repas",origine:"classique",n:"Pommes de terre sautées, œufs et fromage",t:18,actif:10,cook:"poêle",kcal:480,p:27,tags:["oeuf","lait"],
 ing:[["pdt",150],["oeuf",3],["fromage",25],["oignon",20]],
 steps:["Pommes de terre en petits dés, 5 min au micro-ondes couvertes.","Oignon 3 min à la poêle, puis les pommes de terre quelques minutes pour les dorer.","Verse les œufs battus et le fromage, 8 min à feu doux à couvert."]},

{id:"p71",slot:"repas",origine:"asie",n:"Curry de pois chiches et patate douce au lait de coco",t:20,actif:15,cook:"casserole",kcal:650,p:16,tags:[],
 ing:[["pchiche",0.5],["patate",150],["coco",80],["tomate",100],["riz",60]],
 steps:["Patate douce en petits dés, 10 min à la casserole avec un fond d'eau.","Pois chiches égouttés, tomates, lait de coco et 1 c. à café de curry : 8 min à feu doux.","Avec le riz."]},

{id:"p72",slot:"repas",origine:"classique",n:"Omelette minute au fromage",t:8,cook:"poêle",kcal:420,p:27,tags:["oeuf","lait"],
 ing:[["oeuf",3],["fromage",25],["beurre",8]],
 steps:["Bats les œufs avec sel et poivre.","Fais fondre le beurre dans la poêle, verse les œufs.","Le fromage sur la moitié dès que les œufs commencent à prendre, plie en deux, 1 min de plus."]},

{id:"p73",slot:"repas",origine:"reunion",n:"Riz, lentilles corail et rougail tomate",t:20,actif:15,cook:"casserole",kcal:550,p:22,tags:[],
 ing:[["lcorail",70],["tomate",100],["oignon",30],["riz",70]],
 steps:["Lentilles corail couvertes d'eau avec la moitié de l'oignon et du curcuma : 12 min à feu doux en remuant.","Rougail : tomates, le reste de l'oignon en petits dés, piment, un filet d'huile.","Riz, lentilles et rougail à côté."]},

{id:"p74",slot:"repas",origine:"espagne",n:"Œufs à la tomate et aux haricots blancs",t:15,cook:"poêle",kcal:520,p:30,tags:["oeuf"],
 ing:[["hblanc",1],["tomate",150],["oignon",30],["oeuf",2]],
 steps:["Oignon 3 min à l'huile avec du paprika fumé.","Haricots blancs égouttés et tomates, 7 min à feu doux.","Casse les œufs dessus, couvre 4 min."]},

{id:"p75",slot:"repas",origine:"classique",legNom:"carottes et concombre",n:"Purée de haricots blancs, citron et crudités",t:8,cook:"aucune",kcal:430,p:22,tags:["lait"],
 ing:[["hblanc",1],["citron",20],["fb",100],["leg",150]],
 steps:["Mixe ou écrase à la fourchette les haricots blancs égouttés avec le fromage blanc, le citron, l'ail si tu en as, sel et poivre.","Un filet d'huile d'olive.","Avec les crudités pour tremper ou à côté."]},

{id:"p76",slot:"repas",origine:"italie",legNom:"petits pois et courgette",n:"Riz crémeux au fromage et aux légumes",t:20,actif:18,cook:"casserole",kcal:570,p:18,tags:["lait"],
 ing:[["riz",80],["leg",120],["creme",40],["fromage",25],["beurre",10]],
 steps:["Riz dans une casserole avec le beurre fondu, 1 min, puis couvre d'eau chaude petit à petit (comme un risotto), en remuant : 15 min.","Les légumes en petits dés les 5 dernières minutes.","Hors du feu, la crème et le fromage râpé, bien mélanger."]},
```

## Pour aller plus loin (facultatif, à décider par toi)

Rien ci-dessous n'est nécessaire pour que les recettes fonctionnent ; l'appli sait déjà dessiner une assiette générique sans ces ajouts.

**Descriptions courtes**, dans le même style que l'objet `DESCRIPTIONS` existant :

| id | Phrase proposée |
|---|---|
| p67 | Riz sauté bien parfumé, avec le croquant des cacahuètes : prêt en un quart d'heure. |
| p68 | Une salade fraîche et rassasiante, prête en moins de 10 minutes, sans rien cuire. |
| p69 | Le chili réconfortant, version végé, aussi copieux que l'original. |
| p70 | Pommes de terre dorées, œufs et fromage fondant : simple et complet. |
| p71 | Patate douce et pois chiches dans une sauce coco-curry douce et parfumée. |
| p72 | L'omelette au fromage, moelleuse et prête en moins de 10 minutes. |
| p73 | Lentilles corail fondantes et rougail tomate frais, le goût de La Réunion sans viande. |
| p74 | Œufs pochés dans une sauce tomate aux haricots blancs et au paprika fumé. |
| p75 | Une purée de haricots blancs au citron, fraîche et sans cuisson, à tremper ou à tartiner. |
| p76 | Un risotto maison tout simple, crémeux et plein de légumes. |

**Illustrations (`VIZ`)**, composées uniquement avec des assiettes déjà dessinées dans `FOOD` (aucun nouveau dessin à créer) :

```js
p67:[["friedrice",2.2],["nuts",.8]], p68:[["chickpea",1],["tomatoRaw",1],["cheese",1]],
p69:[["chili",1.6],["rice",1.4]], p70:[["potato",1.6],["scrambled",1.4]],
p71:[["curry",1.6],["rice",1.4]], p72:[["omelette",2],["cheese",1]],
p73:[["lentils",1.4],["rougail",.8],["rice",1.2]], p74:[["whitebeans",1.6],["egg",1],["tomatoRaw",.4]],
p75:[["whitebeans",1.8],["salad",1],["carrot",.6]], p76:[["rice",1.6],["creamsauce",.8],["veg",.8]]
```

**Un point à vérifier dans `index.html`, pas dans `recettes.js`** : `p67` mentionne « sauce soja » dans ses étapes (comme `p32` et `p55` déjà dans le catalogue), sans que ce soit un ingrédient compté. Si tu l'ajoutes, pense à faire la même chose que pour `p32`/`p55` : ajouter `"p67"` à `ALLERGIE_RECETTE.soja` dans `index.html`, sinon une personne allergique au soja la verrait proposée avec de la sauce soja dans les étapes.

**Style** : ce sont des plats rapides et légers, ils pourraient aussi rejoindre `STYLES_PLATS.healthy` si tu veux qu'ils sortent davantage dans ce style de semaine.

## Ce qui n'a pas été fait, volontairement

- `recettes.js` n'a pas été touché : c'est toi qui copies ce qui te convient.
- Aucun chiffre de prix, d'économie ou d'avis n'a été inventé dans ce document.
- Rien n'est publié : ce fichier est une proposition à valider.
