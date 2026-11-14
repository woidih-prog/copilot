/* Vite & Calé : le catalogue de recettes.
   Une recette = une portion. Quantités dans l'unité de l'ingrédient (voir ING dans index.html) :
   g, ml, pièce (pc), boîte (bt) ou tranche (tr). kcal et protéines sont des estimations.
   t = temps total en minutes, actif = minutes où l'on s'en occupe vraiment.
   origine : classique, italie, maghreb, antilles, reunion, afrique, asie, amerique, espagne.
   legNom : ce que représente l'ingrédient « leg » (légumes de saison) dans la recette.
   Les recettes sont écrites pour Vite & Calé ; ce sont des classiques que chacun cuisine.
   source : recette adaptée d'un texte du Livre de cuisine de Wikilivres, sous licence CC BY-SA 3.0
   (https://creativecommons.org/licenses/by-sa/3.0/deed.fr) ; les recettes concernées (p44, p46) restent sous
   cette licence, avec la liste des modifications. */

const ORIGINES = {
  classique:"Classiques français", italie:"Italie", maghreb:"Maghreb", antilles:"Antilles", reunion:"La Réunion",
  afrique:"Afrique de l'Ouest", asie:"Asie et Inde", amerique:"Amérique", espagne:"Espagne"
};

const R = [
 /* ===================== Matin ===================== */
 {id:"m01",slot:"matin",origine:"classique",n:"Tartines beurre-confiture et café au lait",t:3,cook:"aucune",kcal:420,p:12,tags:["lait"],
  ing:[["baguette",0.25],["beurre",10],["confiture",30],["lait",200]],
  steps:["Coupe un quart de baguette en deux.","Beurre et confiture.","Café ou chicorée avec le lait chaud."]},
 {id:"m02",slot:"matin",origine:"classique",n:"Bol de céréales et fruit",t:2,cook:"aucune",kcal:330,p:11,tags:["lait"],
  ing:[["cereales",40],["lait",200],["fruit",1]],
  steps:["Céréales et lait froid dans un bol.","Un fruit à côté ou coupé dessus."]},
 {id:"m03",slot:"matin",origine:"classique",n:"Yaourt, fruit et tartine",t:2,cook:"aucune",kcal:330,p:12,tags:["lait"],
  ing:[["yaourt",1],["fruit",1],["baguette",0.15],["beurre",5]],
  steps:["Un yaourt nature, un fruit coupé dessus.","Une tartine beurrée."]},
 {id:"m04",slot:"matin",origine:"classique",n:"Pain perdu",t:10,cook:"poêle",kcal:400,p:17,tags:["oeuf","lait"],
  ing:[["pain",2],["oeuf",1],["lait",100],["fruit",1]],
  steps:["Bats l'œuf avec le lait et un peu de sucre.","Trempe les tranches de pain.","2 min de chaque côté à la poêle avec un peu de beurre."]},
 {id:"m05",slot:"matin",origine:"classique",n:"Crêpes du dimanche",t:25,actif:20,cook:"poêle",kcal:390,p:12,tags:["oeuf","lait"],
  ing:[["farine",50],["oeuf",0.5],["lait",100],["confiture",20]],
  steps:["Pour 4 : 200 g de farine, 2 œufs, 40 cl de lait, une pincée de sel. Laisse reposer si tu as le temps.","Cuis les crêpes dans une poêle huilée, 1 min de chaque côté.","Confiture ou sucre. Le reste se garde 2 jours au frigo."]},
 {id:"m06",slot:"matin",origine:"classique",n:"Œufs brouillés et tartines",t:5,cook:"poêle",kcal:350,p:19,tags:["oeuf"],
  ing:[["oeuf",2],["baguette",0.2]],
  steps:["Bats 2 œufs avec sel et poivre.","Cuis-les à feu doux en remuant sans arrêt, 2 à 3 min.","Sur des tartines grillées."]},

 /* ===================== Midi et soir : pâtes ===================== */
 {id:"p01",slot:"repas",origine:"italie",n:"Spaghetti bolognaise",t:30,actif:10,cook:"casserole",kcal:720,p:40,tags:["viande","lait"],
  ing:[["pates",100],["steak",1],["tomate",150],["oignon",30],["fromage",10]],
  steps:["Fais revenir l'oignon haché et la viande hachée émiettée 5 min.","Ajoute les tomates, origan, sel, poivre : 15 min à feu doux.","Sur les spaghetti cuits, avec un peu de fromage râpé."]},
 {id:"p02",slot:"repas",origine:"italie",n:"Pâtes carbonara",t:15,cook:"casserole",kcal:740,p:31,tags:["viande","oeuf","lait"],
  ing:[["pates",100],["lardons",50],["oeuf",1],["creme",30],["fromage",15]],
  steps:["Cuis les pâtes.","Dore les lardons 5 min.","Hors du feu, mélange pâtes, lardons, et l'œuf battu avec la crème et le fromage."]},
 {id:"p03",slot:"repas",origine:"classique",n:"Pâtes au thon et à la tomate",t:15,cook:"casserole",kcal:560,p:43,tags:["poisson"],
  ing:[["pates",100],["thon",1],["tomate",150],["oignon",20]],
  steps:["Cuis les pâtes.","Oignon 3 min à la poêle, puis tomates et thon égoutté, 5 min.","Mélange avec les pâtes, herbes de Provence."]},
 {id:"p04",slot:"repas",origine:"classique",n:"Coquillettes jambon-fromage",t:15,cook:"casserole",kcal:700,p:35,tags:["viande","lait"],
  ing:[["pates",100],["jambon",1.5],["fromage",30],["beurre",8],["creme",25]],
  steps:["Cuis les coquillettes.","Remets-les dans la casserole avec beurre, crème et une pincée de muscade.","Jambon en dés et fromage, 1 min sur feu doux."]},
 {id:"p05",slot:"repas",origine:"italie",n:"Lasagnes bolognaise",t:70,actif:25,cook:"four",kcal:780,p:45,tags:["viande","lait"],
  ing:[["lasagne",70],["steak",1],["tomate",150],["oignon",30],["lait",120],["beurre",10],["farine",10],["fromage",30]],
  steps:["Bolognaise : oignon, viande hachée, tomates, 15 min.","Béchamel : beurre fondu, farine, puis le lait petit à petit en remuant jusqu'à ce que ça épaississe.","Alterne plaques, bolognaise et béchamel, fromage dessus. 35 min au four à 180 °C."]},
 {id:"p06",slot:"repas",origine:"classique",legNom:"champignons de Paris",n:"Pâtes au poulet, crème et champignons",t:20,cook:"poêle",kcal:760,p:45,tags:["viande","lait"],
  ing:[["pates",100],["poulet",110],["creme",40],["leg",80],["oignon",20]],
  steps:["Cuis les pâtes.","Poulet en lanières 6 min à la poêle, puis oignon et champignons émincés 5 min.","La crème, sel, poivre, et les pâtes dans la poêle."]},
 {id:"p07",slot:"repas",origine:"classique",n:"Gratin de pâtes au jambon",t:30,actif:10,cook:"four",kcal:680,p:33,tags:["viande","lait"],
  ing:[["pates",100],["jambon",1],["creme",40],["fromage",30]],
  steps:["Cuis les pâtes 2 min de moins que prévu.","Mélange avec le jambon coupé et la crème, dans un plat.","Fromage dessus, 15 min au four à 200 °C."]},

 /* ===================== Viandes et volailles ===================== */
 {id:"p08",slot:"repas",origine:"classique",n:"Poulet rôti et pommes de terre",t:60,actif:10,cook:"four",kcal:680,p:42,tags:["viande"],
  ing:[["cuisse",250],["pdt",250],["oignon",40]],
  steps:["Pommes de terre en quartiers et oignon dans un plat, huile, sel, thym.","Les cuisses de poulet par-dessus, paprika.","50 min au four à 200 °C, sans rien faire. Arrose une fois avec le jus."]},
 {id:"p09",slot:"repas",origine:"classique",legNom:"salade verte",n:"Steak haché, frites au four et salade",t:35,actif:10,cook:"four",kcal:600,p:31,tags:["viande"],
  ing:[["steak",1],["pdt",250],["leg",80]],
  steps:["Pommes de terre en bâtonnets, un filet d'huile et du sel : 30 min au four à 220 °C, retourne-les à mi-cuisson.","Steak 3 à 4 min de chaque côté à la poêle.","Avec une salade."]},
 {id:"p10",slot:"repas",origine:"classique",legNom:"champignons de Paris",n:"Escalope de poulet à la crème et riz",t:20,cook:"poêle",kcal:640,p:40,tags:["viande","lait"],
  ing:[["poulet",130],["creme",40],["leg",80],["riz",70]],
  steps:["Cuis le riz.","Escalope 5 min de chaque côté à la poêle, puis les champignons émincés.","La crème, sel, poivre, 2 min. Sers avec le riz."]},
 {id:"p11",slot:"repas",origine:"asie",n:"Poulet au curry et riz",t:25,actif:10,cook:"poêle",kcal:640,p:38,tags:["viande"],
  ing:[["poulet",120],["coco",80],["oignon",30],["tomate",100],["riz",70]],
  steps:["Poulet en morceaux et oignon 5 min avec 1 c. à café de curry.","Tomates et lait de coco, 12 min à feu doux.","Avec le riz."]},
 {id:"p12",slot:"repas",origine:"amerique",n:"Chili con carne",t:35,actif:15,cook:"casserole",kcal:660,p:40,tags:["viande"],
  ing:[["steak",1],["hrouge",0.5],["tomate",150],["oignon",40],["riz",70]],
  steps:["Oignon et viande hachée émiettée 5 min.","Haricots rouges égouttés, tomates, cumin, paprika : 20 min à feu doux.","Avec le riz."]},
 {id:"p13",slot:"repas",origine:"classique",n:"Hachis parmentier",t:50,actif:20,cook:"four",kcal:610,p:33,tags:["viande","lait"],
  ing:[["steak",1],["pdt",250],["lait",80],["fromage",20],["oignon",40]],
  steps:["Pommes de terre 20 min dans l'eau bouillante, écrasées avec le lait.","Oignon et viande hachée 5 min.","Viande au fond du plat, purée dessus, fromage. 20 min au four à 200 °C."]},
 {id:"p14",slot:"repas",origine:"classique",n:"Boulettes à la sauce tomate et pâtes",t:35,actif:20,cook:"poêle",kcal:700,p:40,tags:["viande","oeuf"],
  ing:[["steak",1],["oeuf",0.25],["oignon",30],["tomate",150],["pates",90]],
  steps:["Mélange la viande hachée, un peu d'œuf, l'oignon haché, sel, poivre ; forme des boulettes.","Dore-les 5 min, puis les tomates et du basilic : 15 min à feu doux.","Avec les pâtes."]},
 {id:"p15",slot:"repas",origine:"classique",n:"Saucisses-purée",t:30,actif:10,cook:"casserole",kcal:780,p:28,tags:["viande","lait"],
  ing:[["saucisse",125],["pdt",250],["lait",80],["beurre",10]],
  steps:["Pommes de terre 20 min dans l'eau bouillante.","Saucisses 12 min à la poêle, en les retournant.","Écrase les pommes de terre avec le lait et le beurre, sel, muscade."]},
 {id:"p16",slot:"repas",origine:"amerique",fun:true,legNom:"salade et tomate",n:"Burger maison et frites au four",t:35,actif:15,cook:"four",kcal:850,p:40,tags:["viande","lait"],
  ing:[["painburger",1],["steak",1],["fromage",20],["leg",50],["oignon",15],["pdt",250]],
  steps:["Frites au four : bâtonnets, huile, sel, 30 min à 220 °C.","Steak à la poêle, le fromage dessus la dernière minute.","Pain toasté, salade, tomate, oignon, steak, ketchup ou moutarde."]},
 {id:"p17",slot:"repas",origine:"amerique",legNom:"crudités",n:"Wraps au poulet",t:15,cook:"poêle",kcal:450,p:35,tags:["viande","lait"],
  ing:[["tortilla",2],["poulet",100],["leg",100],["fb",50]],
  steps:["Poulet en lanières 6 min à la poêle, paprika.","Fromage blanc sur les tortillas, crudités, poulet.","Roule et coupe en deux."]},
 {id:"p18",slot:"repas",origine:"amerique",fun:true,n:"Nuggets maison et frites au four",t:40,actif:20,cook:"four",kcal:620,p:40,tags:["viande","oeuf"],
  ing:[["poulet",130],["oeuf",0.5],["farine",10],["pdt",250]],
  steps:["Frites au four : bâtonnets, huile, sel, 30 min à 220 °C.","Poulet en morceaux : farine, œuf battu, puis chapelure.","15 min au four avec les frites, ou 6 min à la poêle."]},
 {id:"p19",slot:"repas",origine:"classique",legNom:"poivrons",n:"Poulet basquaise",t:50,actif:15,cook:"casserole",kcal:690,p:43,tags:["viande"],
  ing:[["cuisse",250],["tomate",150],["leg",100],["oignon",40],["riz",70]],
  steps:["Dore les cuisses de poulet 8 min dans une cocotte.","Oignon, poivrons en lanières, tomates, piment d'Espelette ou paprika.","35 min à feu doux à couvert. Avec le riz."]},
 {id:"p20",slot:"repas",origine:"classique",legNom:"carottes",n:"Bœuf-carottes",t:60,actif:15,cook:"cocotte-minute",kcal:620,p:38,tags:["viande"],
  ing:[["boeuf",150],["leg",200],["oignon",40],["pdt",200]],
  steps:["Dore les morceaux de bœuf et l'oignon dans une cocotte-minute.","Carottes en rondelles, thym, laurier, un verre d'eau, sel, poivre.","40 min après le sifflement (ou 2 h 30 dans une cocotte normale). Avec des pommes de terre."]},
 {id:"p21",slot:"repas",origine:"classique",legNom:"carottes et champignons",n:"Blanquette de poulet",t:45,actif:15,cook:"casserole",kcal:650,p:40,tags:["viande","lait"],
  ing:[["poulet",130],["leg",100],["creme",30],["farine",8],["beurre",8],["riz",70]],
  steps:["Poulet en morceaux et carottes couverts d'eau avec un cube de bouillon : 25 min.","Garde le bouillon. Beurre fondu, farine, puis le bouillon petit à petit pour faire la sauce.","Champignons, crème, poulet et carottes dans la sauce, 5 min. Avec le riz."]},
 {id:"p22",slot:"repas",origine:"classique",legNom:"endives",n:"Endives au jambon",t:50,actif:15,cook:"four",kcal:520,p:32,tags:["viande","lait"],
  ing:[["leg",250],["jambon",2],["lait",120],["beurre",10],["farine",10],["fromage",30]],
  steps:["Endives 15 min à la vapeur ou dans l'eau, bien égouttées.","Roule chaque endive dans une tranche de jambon, dans un plat.","Béchamel (beurre, farine, lait, muscade) et fromage dessus : 20 min au four à 200 °C."]},
 {id:"p23",slot:"repas",origine:"classique",legNom:"salade verte",n:"Croque-monsieur et salade",t:10,cook:"poêle",kcal:460,p:27,tags:["viande","lait"],
  ing:[["pain",2],["jambon",1],["fromage",25],["leg",80]],
  steps:["Pain, jambon, fromage, pain.","4 min de chaque côté à la poêle avec un peu de beurre.","Avec la salade."]},
 {id:"p24",slot:"repas",origine:"classique",legNom:"salade verte",n:"Quiche lorraine et salade",t:45,actif:10,cook:"four",kcal:620,p:24,tags:["oeuf","lait","viande"],
  ing:[["pate",0.25],["lardons",50],["oeuf",1],["creme",50],["lait",50],["fromage",15],["leg",80]],
  steps:["Déroule la pâte dans un moule, pique le fond.","Pour 4 parts : 4 œufs, 20 cl de crème, 20 cl de lait, sel, poivre, les lardons et le fromage.","35 min au four à 180 °C. Avec une salade."]},
 {id:"p25",slot:"repas",origine:"classique",fun:true,n:"Tartiflette",t:50,actif:15,cook:"four",kcal:850,p:33,tags:["viande","lait"],
  ing:[["pdt",250],["lardons",50],["oignon",40],["reblochon",110],["creme",20]],
  steps:["Pommes de terre 15 min dans l'eau bouillante, puis en rondelles.","Dore lardons et oignon. Dans un plat : pommes de terre, lardons, crème.","Le reblochon coupé en deux dans l'épaisseur, croûte vers le haut : 25 min au four à 200 °C."]},
 {id:"p26",slot:"repas",origine:"classique",legNom:"salade verte",n:"Crêpes salées jambon-fromage",t:30,actif:25,cook:"poêle",kcal:720,p:36,tags:["viande","oeuf","lait"],
  ing:[["farine",80],["oeuf",1],["lait",160],["beurre",10],["jambon",1.5],["fromage",40],["leg",80]],
  steps:["Pour 3 : 250 g de farine, 3 œufs, 50 cl de lait, une pincée de sel.","Cuis les crêpes dans une poêle beurrée.","Jambon et fromage, plie, 1 min pour faire fondre. Avec une salade."]},
 {id:"p27",slot:"repas",origine:"classique",n:"Gratin dauphinois au jambon",t:70,actif:15,cook:"four",kcal:620,p:24,tags:["viande","lait"],
  ing:[["pdt",250],["lait",150],["creme",30],["jambon",1],["fromage",20]],
  steps:["Pommes de terre en rondelles fines dans un plat, avec le jambon coupé.","Lait et crème, sel, poivre, muscade, fromage dessus.","1 h au four à 180 °C."]},
 {id:"p28",slot:"repas",origine:"classique",legNom:"carottes",n:"Lentilles-saucisses",t:30,actif:10,cook:"casserole",kcal:640,p:34,tags:["viande"],
  ing:[["saucisse",125],["lbocal",0.5],["oignon",30],["leg",80]],
  steps:["Dore les saucisses 5 min.","Oignon, carottes en rondelles, lentilles égouttées et un fond d'eau.","15 min à feu doux à couvert."]},
 {id:"p29",slot:"repas",origine:"classique",n:"Moules-frites",t:35,actif:15,cook:"casserole",kcal:640,p:30,tags:["poisson","lait"],
  ing:[["moules",500],["oignon",30],["creme",20],["pdt",250]],
  steps:["Frites au four : bâtonnets, huile, sel, 30 min à 220 °C.","Moules grattées et rincées (jette celles qui restent ouvertes).","Oignon 3 min dans une grande casserole, les moules, un peu d'eau ou de vin blanc : 6 min à couvert en secouant. La crème à la fin."]},
 {id:"p30",slot:"repas",origine:"reunion",n:"Rougail saucisses",t:40,actif:15,cook:"casserole",kcal:790,p:29,tags:["viande"],
  ing:[["saucisse",125],["tomate",150],["oignon",50],["riz",70]],
  steps:["Saucisses en rondelles, 5 min à la poêle pour les dorer.","Oignon, ail, curcuma, piment, puis les tomates.","20 min à feu doux à couvert. Avec le riz."]},
 {id:"p31",slot:"repas",origine:"italie",fun:true,legNom:"champignons",n:"Pizza maison jambon-champignons",t:45,actif:20,cook:"four",kcal:760,p:34,tags:["viande","lait"],
  ing:[["farine",100],["tomate",80],["fromage",50],["jambon",1],["leg",50]],
  steps:["Pâte pour 2 : 200 g de farine, 12 cl d'eau tiède, 1 c. à café de levure de boulanger, sel, huile. Pétris 5 min, laisse lever 20 min.","Étale, tomates, jambon, champignons, fromage, origan.","12 à 15 min au four le plus chaud possible."]},
 {id:"p32",slot:"repas",origine:"asie",n:"Riz cantonais",t:20,cook:"poêle",kcal:600,p:30,tags:["viande","oeuf"],
  ing:[["riz",80],["oeuf",2],["jambon",1],["surg",120]],
  steps:["Utilise du riz cuit la veille (il colle moins).","Omelette fine à la poêle, coupe-la en lanières.","Petits pois, jambon en dés, riz et omelette : 5 min en remuant, sauce soja."]},
 {id:"p33",slot:"repas",origine:"classique",legNom:"salade verte",n:"Poisson pané maison et riz",t:25,actif:15,cook:"poêle",kcal:560,p:35,tags:["poisson","oeuf"],
  ing:[["colin",130],["oeuf",0.5],["farine",10],["riz",70],["leg",80]],
  steps:["Cuis le riz.","Filets de colin décongelés : farine, œuf battu, chapelure.","4 min de chaque côté à la poêle avec un peu d'huile. Citron, salade."]},
 {id:"p34",slot:"repas",origine:"classique",n:"Colin à la crème et pommes de terre",t:25,actif:10,cook:"casserole",kcal:500,p:29,tags:["poisson","lait"],
  ing:[["colin",130],["creme",40],["pdt",250]],
  steps:["Pommes de terre 20 min dans l'eau bouillante.","Colin à la poêle à couvert 10 min, puis la crème, sel, poivre, aneth ou persil.","Sers ensemble."]},
 {id:"p35",slot:"repas",origine:"classique",batchEggs:true,legNom:"tomates et concombre",n:"Salade de riz au thon",t:20,actif:10,cook:"casserole",kcal:560,p:40,tags:["poisson","oeuf"],
  ing:[["riz",70],["thon",1],["oeuf",1],["leg",120]],
  steps:["Cuis le riz et laisse-le refroidir (ou prends celui de la veille).","Thon, œuf dur, tomates et concombre en dés.","Vinaigrette à la moutarde. Se garde 2 jours au frigo."]},
 {id:"p36",slot:"repas",origine:"espagne",legNom:"salade verte",n:"Tortilla de pommes de terre",t:30,actif:15,cook:"poêle",kcal:570,p:25,tags:["oeuf"],
  ing:[["oeuf",3],["pdt",200],["oignon",40],["leg",80]],
  steps:["Pommes de terre en fines rondelles et oignon, 15 min à la poêle à couvert.","Verse les œufs battus, 8 min à feu doux.","Retourne-la à l'aide d'une assiette, 3 min. Avec une salade."]},
 {id:"p37",slot:"repas",origine:"classique",legNom:"courgettes, aubergine, poivron, tomates",n:"Ratatouille et œufs au plat",t:50,actif:20,cook:"casserole",kcal:480,p:20,tags:["oeuf"],
  ing:[["leg",350],["oignon",40],["oeuf",2],["baguette",0.2]],
  steps:["Coupe tous les légumes en dés, oignon et ail.","Fais-les revenir à l'huile d'olive puis 35 min à feu doux à couvert, avec thym et laurier.","Deux œufs au plat dessus, du pain. Encore meilleure le lendemain."]},
 {id:"p38",slot:"repas",origine:"classique",legNom:"grosses tomates",n:"Tomates farcies et riz",t:60,actif:20,cook:"four",kcal:620,p:34,tags:["viande"],
  ing:[["leg",300],["steak",1],["oignon",20],["riz",60]],
  steps:["Coupe le chapeau des tomates, vide-les (garde la pulpe).","Farce : viande hachée, oignon, persil, sel, poivre ; remplis les tomates.","Riz cru et pulpe autour, un verre d'eau : 45 min au four à 180 °C."]},
 {id:"p39",slot:"repas",origine:"classique",legNom:"légumes de saison (poireaux, carottes…)",n:"Soupe de légumes maison et tartines au fromage",t:35,actif:10,cook:"casserole",kcal:470,p:19,tags:["lait"],
  ing:[["leg",300],["pdt",100],["oignon",30],["pain",2],["fromage",25]],
  steps:["Légumes, pomme de terre et oignon coupés, couverts d'eau, un cube de bouillon.","25 min à feu moyen, puis mixe.","Tartines au fromage 1 min au micro-ondes."]},
 {id:"p40",slot:"repas",origine:"italie",legNom:"légumes qui restent",n:"Frittata vide-frigo",t:20,actif:10,cook:"poêle",kcal:520,p:31,tags:["oeuf","lait"],
  ing:[["oeuf",3],["leg",150],["fromage",25],["creme",15],["pain",1]],
  steps:["Fais revenir 5 min les légumes qui restent, coupés petits.","Verse les œufs battus avec la crème et le fromage.","10 min à feu doux à couvert."]},
 {id:"p41",slot:"repas",origine:"classique",legNom:"salade verte",n:"Croque-madame",t:12,cook:"poêle",kcal:560,p:33,tags:["viande","oeuf","lait"],
  ing:[["pain",2],["jambon",1],["fromage",30],["beurre",8],["oeuf",1],["leg",80]],
  steps:["Pain beurré à l'extérieur, jambon et fromage à l'intérieur.","4 min de chaque côté à la poêle.","Un œuf au plat dessus. Avec une salade."]},
 {id:"p42",slot:"repas",origine:"classique",legNom:"potimarron",n:"Lasagnes au potimarron",t:75,actif:25,cook:"four",kcal:620,p:24,tags:["lait"],
  ing:[["lasagne",70],["leg",250],["lait",150],["beurre",12],["farine",12],["fromage",40]],
  steps:["Potimarron en cubes (la peau se mange), 15 min à la vapeur, puis écrasé.","Béchamel : beurre, farine, lait, muscade.","Alterne plaques, potimarron, béchamel, fromage dessus : 35 min à 180 °C."]},

 /* ===================== Maghreb ===================== */
 {id:"p43",slot:"repas",origine:"maghreb",n:"Chakchouka (œufs à la tomate et aux poivrons)",t:25,actif:10,cook:"poêle",legNom:"poivrons",kcal:480,p:23,tags:["oeuf"],
  ing:[["oeuf",2],["tomate",200],["leg",80],["oignon",40],["baguette",0.25]],
  steps:["Oignon et poivrons en lanières 8 min à la poêle avec ail, cumin, paprika.","Les tomates, 8 min.","Creuse deux trous, casse les œufs dedans, couvre 5 min. Avec du pain."]},
 {id:"p44",slot:"repas",origine:"maghreb",n:"Couscous poulet-merguez",t:75,actif:25,cook:"casserole",legNom:"carottes, courgettes, navets",kcal:850,p:50,tags:["viande"],
  source:{titre:"Couscous",url:"https://fr.wikibooks.org/wiki/Livre_de_cuisine/Couscous",modifs:"poulet et merguez au lieu du collier d'agneau, semoule cuite à l'eau bouillante au lieu du couscoussier, portion pour une personne"},
  ing:[["cuisse",200],["merguez",70],["semoule",80],["pchiche",0.25],["leg",200],["oignon",30],["tomate",80]],
  steps:["Dore le poulet dans un peu d'huile d'olive, puis les oignons émincés. Ajoute la tomate, de la harissa si tu aimes, et un demi-verre d'eau.","Quand ça bout, couvre d'eau et laisse cuire 20 min en écumant.","Carottes et navets en quatre, pois chiches et ras-el-hanout : 15 min. Puis les courgettes : encore 15 min. Rectifie le sel.","Merguez grillées à la poêle. Semoule : même volume d'eau bouillante salée avec un filet d'huile, 5 min à couvert, puis égrène à la fourchette."]},
 {id:"p45",slot:"repas",origine:"maghreb",n:"Tajine de poulet au citron",t:60,actif:15,cook:"casserole",kcal:620,p:42,tags:["viande"],
  ing:[["cuisse",250],["oignon",50],["citron",60],["pdt",200]],
  steps:["Dore le poulet et l'oignon émincé avec gingembre, curcuma, cumin.","Pommes de terre en quartiers, rondelles de citron, un verre d'eau.","45 min à feu doux à couvert. Olives à la fin si tu en as."]},
 {id:"p46",slot:"repas",origine:"maghreb",legNom:"carotte, courgette, céleri",n:"Chorba (soupe tomate, pois chiches et vermicelles)",t:50,actif:15,cook:"casserole",kcal:450,p:30,tags:["viande"],
  source:{titre:"Chorba",url:"https://fr.wikibooks.org/wiki/Livre_de_cuisine/Chorba",modifs:"poulet au lieu du mouton, sans pomme de terre, portion pour une personne"},
  ing:[["poulet",80],["tomate",150],["pchiche",0.25],["pates",30],["oignon",30],["leg",80],["citron",20]],
  steps:["Mets le poulet en morceaux dans une cocotte. Râpe l'oignon, la carotte, la courgette et le céleri, ajoute-les avec les tomates, les pois chiches et un filet d'huile : 3 à 4 min sur le feu.","Couvre d'eau, cannelle, piment doux, sel, poivre : 25 à 30 min à couvert.","Les vermicelles, encore 15 min sans couvercle.","Coriandre et menthe hachées juste avant de servir, avec un filet de citron."]},
 {id:"p47",slot:"repas",origine:"maghreb",n:"Loubia (haricots blancs à la tomate)",t:30,actif:10,cook:"casserole",kcal:520,p:24,tags:[],
  ing:[["hblanc",0.6],["tomate",150],["oignon",30],["baguette",0.25]],
  steps:["Oignon et ail 3 min avec cumin et paprika.","Haricots blancs égouttés, tomates, un peu d'eau : 20 min à feu doux.","Coriandre ou persil. Avec du pain."]},
 {id:"p48",slot:"repas",origine:"maghreb",n:"Adass (lentilles à la marocaine)",t:35,actif:10,cook:"casserole",kcal:520,p:27,tags:[],
  ing:[["lbocal",1],["tomate",100],["oignon",30],["baguette",0.2]],
  steps:["Oignon, ail, cumin, paprika, 3 min dans un peu d'huile.","Lentilles égouttées, tomates et un verre d'eau : 20 min.","Coriandre et un filet d'huile d'olive. Avec du pain."]},
 {id:"p49",slot:"repas",origine:"maghreb",n:"Tajine de kefta (boulettes) aux œufs",t:35,actif:15,cook:"poêle",kcal:600,p:40,tags:["viande","oeuf"],
  ing:[["steak",1],["tomate",200],["oignon",30],["oeuf",1],["baguette",0.2]],
  steps:["Viande hachée avec oignon râpé, cumin, paprika, persil : forme de petites boulettes.","Sauce tomate à l'ail 10 min, puis les boulettes : 12 min.","Casse l'œuf au milieu, 5 min à couvert. Avec du pain."]},

 /* ===================== Antilles, Réunion, Afrique ===================== */
 {id:"p50",slot:"repas",origine:"antilles",legNom:"courgette ou aubergine",n:"Colombo de poulet",t:50,actif:15,cook:"casserole",kcal:680,p:42,tags:["viande"],
  ing:[["cuisse",250],["pdt",150],["leg",100],["oignon",30],["riz",60]],
  steps:["Dore le poulet avec oignon et ail, 2 c. à café de poudre de colombo.","Pommes de terre et légume en dés, un verre d'eau, thym : 35 min à couvert.","Un filet de citron vert à la fin. Avec le riz."]},
 {id:"p51",slot:"repas",origine:"reunion",n:"Cari de poulet",t:50,actif:15,cook:"casserole",kcal:700,p:42,tags:["viande"],
  ing:[["cuisse",250],["tomate",100],["oignon",40],["riz",80]],
  steps:["Dore le poulet avec oignon, ail, gingembre et curcuma.","Les tomates, thym, un verre d'eau : 35 min à couvert.","Avec le riz (et des grains si tu en as)."]},
 {id:"p52",slot:"repas",origine:"reunion",n:"Riz, grains et rougail tomate",t:25,actif:10,cook:"casserole",kcal:640,p:27,tags:[],
  ing:[["hrouge",1],["tomate",100],["oignon",20],["riz",80]],
  steps:["Grains (haricots rouges) réchauffés avec oignon, ail, thym et un peu d'eau : 10 min.","Rougail : tomates en petits dés, oignon, piment, sel, un filet d'huile.","Riz, grains, rougail à côté."]},
 {id:"p53",slot:"repas",origine:"afrique",n:"Poulet yassa",t:60,actif:15,cook:"casserole",kcal:680,p:42,tags:["viande"],
  ing:[["cuisse",250],["oignon",120],["citron",80],["riz",70]],
  steps:["Fais mariner le poulet avec le jus de citron, moutarde, ail, sel, poivre (30 min ou la veille).","Dore le poulet, puis beaucoup d'oignons émincés jusqu'à ce qu'ils soient fondants.","La marinade et un peu d'eau : 30 min à couvert. Avec le riz."]},
 {id:"p54",slot:"repas",origine:"afrique",legNom:"carottes ou patate douce",n:"Mafé de poulet",t:50,actif:15,cook:"casserole",kcal:820,p:48,tags:["viande"],
  ing:[["cuisse",220],["cacahuete",30],["tomate",100],["oignon",30],["leg",100],["riz",70]],
  steps:["Dore le poulet et l'oignon.","Tomates, légumes en morceaux, la pâte d'arachide délayée dans un verre d'eau chaude.","35 min à feu doux en remuant de temps en temps. Avec le riz."]},

 /* ===================== Asie, Inde et sans viande ===================== */
 {id:"p55",slot:"repas",origine:"asie",n:"Riz sauté aux œufs et légumes",t:15,cook:"poêle",kcal:500,p:23,tags:["oeuf"],
  ing:[["riz",80],["oeuf",2],["surg",200]],
  steps:["Légumes surgelés 5 min à la poêle.","Le riz cuit (de la veille), puis les œufs battus.","Remue 2 min, sauce soja."]},
 {id:"p56",slot:"repas",origine:"asie",n:"Curry de pois chiches au lait de coco",t:25,actif:10,cook:"casserole",kcal:650,p:20,tags:[],
  ing:[["pchiche",0.5],["coco",80],["tomate",100],["oignon",30],["riz",70]],
  steps:["Oignon 3 min avec 1 c. à café de curry.","Pois chiches, tomates et lait de coco : 15 min à feu doux.","Avec le riz."]},
 {id:"p57",slot:"repas",origine:"asie",n:"Dahl de lentilles corail et riz",t:25,actif:10,cook:"casserole",kcal:665,p:27,tags:[],
  ing:[["lcorail",80],["coco",80],["tomate",150],["riz",60]],
  steps:["Lentilles, tomates, lait de coco, un verre d'eau et du curry.","15 min à feu doux en remuant.","Avec le riz."]},
 {id:"p58",slot:"repas",origine:"classique",legNom:"salade frisée",n:"Salade lyonnaise",t:15,cook:"poêle",kcal:480,p:22,tags:["viande","oeuf"],
  ing:[["leg",120],["lardons",60],["oeuf",1],["baguette",0.15]],
  steps:["Dore les lardons, puis le pain en cubes dans leur graisse.","Œuf poché (3 min dans l'eau frémissante vinaigrée) ou mollet (6 min).","Sur la salade, vinaigrette à la moutarde."]},
 {id:"p59",slot:"repas",origine:"classique",legNom:"concombre, poivron, tomate",n:"Salade de haricots et pois chiches",t:10,cook:"aucune",kcal:520,p:25,tags:[],
  ing:[["pchiche",0.5],["hrouge",0.5],["leg",150],["oignon",20],["baguette",0.15]],
  steps:["Égoutte et rince pois chiches et haricots.","Légumes en dés et un peu d'oignon rouge.","Huile, vinaigre ou citron, sel, poivre. Se garde 2 jours."]},
 {id:"p60",slot:"repas",origine:"classique",batchEggs:true,legNom:"salade et tomates",n:"Salade de pommes de terre, thon et œuf",t:25,actif:10,cook:"casserole",kcal:560,p:38,tags:["poisson","oeuf"],
  ing:[["pdt",250],["thon",1],["oeuf",1],["leg",100]],
  steps:["Pommes de terre en cubes, 15 min dans l'eau bouillante, refroidies.","Thon, œuf dur, tomates, quelques cornichons.","Vinaigrette ou une cuillère de mayonnaise."]},

 /* ===================== Sans cuisson ou presque ===================== */
 {id:"p61",slot:"repas",origine:"classique",legNom:"crudités (carottes râpées, tomate)",n:"Jambon-beurre et crudités",t:5,cook:"aucune",kcal:520,p:24,tags:["viande","lait"],
  ing:[["baguette",0.4],["beurre",10],["jambon",2],["leg",120]],
  steps:["Ouvre la baguette, beurre-la.","Deux tranches de jambon, des cornichons si tu aimes.","Des crudités à côté."]},
 {id:"p62",slot:"repas",origine:"classique",batchEggs:true,legNom:"tomate et poivron",n:"Pan bagnat",t:10,cook:"aucune",kcal:560,p:34,tags:["poisson","oeuf"],
  ing:[["baguette",0.4],["thon",1],["oeuf",1],["leg",100]],
  steps:["Ouvre la baguette, un filet d'huile d'olive des deux côtés.","Tomate et poivron en rondelles, thon, œuf dur en tranches, olives si tu en as.","Referme et presse bien : il est meilleur après 10 min."]},
 {id:"p63",slot:"repas",origine:"maghreb",legNom:"tomates et concombre",n:"Taboulé au thon",t:10,cook:"bouilloire",kcal:535,p:38,tags:["poisson"],
  ing:[["semoule",80],["thon",1],["leg",150],["citron",30]],
  steps:["Semoule et même volume d'eau bouillante, 5 min à couvert.","Égrène à la fourchette avec de l'huile d'olive et le jus de citron, sel, menthe.","Tomates et concombre en petits dés, le thon."]},
 {id:"p64",slot:"repas",origine:"classique",legNom:"tomates",n:"Salade de thon, pois chiches et tomates",t:5,cook:"aucune",kcal:495,p:40,tags:["poisson"],
  ing:[["thon",1],["pchiche",0.5],["leg",150],["baguette",0.15]],
  steps:["Égoutte le thon et les pois chiches.","Tomates coupées, un peu d'oignon si tu aimes.","Huile, vinaigre, sel, poivre. Avec du pain."]},
 {id:"p65",slot:"repas",origine:"amerique",legNom:"crudités",n:"Wraps au thon et crudités",t:5,cook:"aucune",kcal:500,p:36,tags:["poisson","lait"],
  ing:[["tortilla",2],["thon",1],["leg",100],["fb",50]],
  steps:["Fromage blanc sur les tortillas.","Thon émietté, crudités.","Roule et coupe en deux."]},
 {id:"p66",slot:"repas",origine:"classique",n:"Pommes de terre et cervelle de canut",t:12,actif:5,cook:"micro-ondes",kcal:430,p:21,tags:["lait"],
  ing:[["pdt",250],["fb",200],["oignon",15]],
  steps:["Pommes de terre piquées, 8 min au micro-ondes.","Fromage blanc, échalote ou oignon très finement haché, ail, ciboulette, un filet d'huile et de vinaigre.","Sur les pommes de terre ouvertes en deux."]},

 /* Végétariens et sans gluten, en 20 minutes ou moins */
 {id:"p67",slot:"repas",origine:"asie",n:"Riz sauté aux œufs, légumes et cacahuètes",t:15,cook:"poêle",kcal:600,p:26,tags:["oeuf"],
  ing:[["riz",80],["oeuf",2],["surg",150],["noix",25]],
  steps:["Utilise du riz cuit la veille, il colle moins à la poêle.","Légumes surgelés et cacahuètes concassées, 3 min à la poêle avec un peu d'huile.","Ajoute les œufs battus, laisse prendre, puis le riz : 5 min en remuant, sauce soja."]},
 {id:"p68",slot:"repas",origine:"classique",n:"Salade de pois chiches, crudités et fromage",t:8,cook:"aucune",kcal:470,p:22,tags:["lait"],
  ing:[["pchiche",0.5],["leg",150],["fromage",30],["citron",15]],
  steps:["Égoutte et rince les pois chiches.","Crudités en dés ou râpées, fromage râpé par-dessus.","Un filet de citron et d'huile, sel, poivre."]},
 {id:"p69",slot:"repas",origine:"amerique",n:"Chili sin carne aux haricots rouges",t:20,actif:15,cook:"casserole",kcal:600,p:28,tags:[],
  ing:[["hrouge",1],["tomate",150],["oignon",40],["riz",70]],
  steps:["Cuis le riz.","Oignon 3 min à l'huile, puis haricots rouges égouttés, tomates, cumin, paprika et un peu de piment : 12 min à feu doux.","Sers avec le riz."]},
 {id:"p70",slot:"repas",origine:"classique",n:"Pommes de terre sautées, œufs et fromage",t:20,actif:12,cook:"poêle",kcal:480,p:27,tags:["oeuf","lait"],
  ing:[["pdt",150],["oeuf",3],["fromage",25],["oignon",20]],
  steps:["Pommes de terre en très petits dés, 8 min à la poêle à couvert avec un peu d'huile.","Ajoute l'oignon, 3 min pour dorer.","Verse les œufs battus et le fromage, 6 min à feu doux à couvert."]},
 {id:"p71",slot:"repas",origine:"asie",n:"Curry de pois chiches et patate douce au lait de coco",t:20,actif:15,cook:"casserole",kcal:650,p:16,tags:[],
  ing:[["pchiche",0.5],["patate",150],["coco",80],["tomate",100],["riz",60]],
  steps:["Cuis le riz.","Patate douce en petits dés, 10 min à la casserole avec un fond d'eau.","Pois chiches égouttés, tomates, lait de coco et 1 c. à café de curry : 8 min à feu doux. Sers avec le riz."]},
 {id:"p72",slot:"repas",origine:"classique",n:"Omelette minute au fromage",t:8,cook:"poêle",kcal:420,p:27,tags:["oeuf","lait"],
  ing:[["oeuf",3],["fromage",25],["beurre",8]],
  steps:["Bats les œufs avec sel et poivre.","Fais fondre le beurre dans la poêle, verse les œufs.","Le fromage sur la moitié dès que les œufs commencent à prendre, plie en deux, 1 min de plus."]},
 {id:"p73",slot:"repas",origine:"reunion",n:"Riz, lentilles corail et rougail tomate",t:20,actif:15,cook:"casserole",kcal:550,p:22,tags:[],
  ing:[["lcorail",70],["tomate",100],["oignon",30],["riz",70]],
  steps:["Cuis le riz.","Lentilles corail couvertes d'eau avec la moitié de l'oignon et du curcuma : 12 min à feu doux en remuant.","Rougail : tomates, le reste de l'oignon en petits dés, piment, un filet d'huile. Sers le tout ensemble."]},
 {id:"p74",slot:"repas",origine:"espagne",n:"Œufs à la tomate et aux haricots blancs",t:15,cook:"poêle",kcal:520,p:30,tags:["oeuf"],
  ing:[["hblanc",1],["tomate",150],["oignon",30],["oeuf",2]],
  steps:["Oignon 3 min à l'huile avec du paprika.","Haricots blancs égouttés et tomates, 7 min à feu doux.","Casse les œufs dessus, couvre 4 min."]},
 {id:"p75",slot:"repas",origine:"classique",n:"Purée de haricots blancs, citron et crudités",t:8,cook:"aucune",kcal:430,p:22,tags:["lait"],
  ing:[["hblanc",1],["citron",20],["fb",100],["leg",150]],
  steps:["Écrase à la fourchette les haricots blancs égouttés avec le fromage blanc, le citron, sel et poivre.","Un filet d'huile.","Avec les crudités en bâtonnets pour tremper."]},
 {id:"p76",slot:"repas",origine:"italie",legNom:"champignons ou poireau",n:"Riz crémeux au fromage et aux légumes",t:20,actif:18,cook:"casserole",kcal:570,p:18,tags:["lait"],
  ing:[["riz",80],["leg",120],["creme",40],["fromage",25],["beurre",10]],
  steps:["Riz 1 min dans le beurre fondu, puis de l'eau chaude petit à petit en remuant : 15 min.","Les légumes en petits dés les 5 dernières minutes.","Hors du feu, la crème et le fromage râpé, bien mélanger."]},

 /* ===================== En-cas et goûters ===================== */
 {id:"e01",slot:"encas",origine:"classique",n:"Fruit de saison",t:0,cook:"aucune",kcal:80,p:1,tags:[],ing:[["fruit",1]],steps:["Rien à faire."]},
 {id:"e02",slot:"encas",origine:"classique",n:"Yaourt et fruit",t:0,cook:"aucune",kcal:140,p:5,tags:["lait"],ing:[["yaourt",1],["fruit",1]],steps:["Rien à faire."]},
 {id:"e03",slot:"encas",origine:"classique",n:"Tartine beurre-confiture",t:2,cook:"aucune",kcal:220,p:5,tags:["lait"],ing:[["baguette",0.15],["beurre",5],["confiture",20]],steps:["Le goûter de toujours."]},
 {id:"e04",slot:"encas",origine:"classique",n:"Gâteau au yaourt (une part)",t:45,actif:10,cook:"four",kcal:230,p:5,tags:["oeuf","lait"],
  ing:[["yaourt",0.125],["farine",30],["oeuf",0.4]],
  steps:["Pour 8 parts : 1 yaourt, et avec le pot vide 3 pots de farine, 2 de sucre, ½ d'huile, 3 œufs, 1 sachet de levure.","Mélange tout dans l'ordre.","35 min au four à 180 °C. Il se garde 4 jours dans une boîte."]},
 {id:"e05",slot:"encas",origine:"classique",n:"Compote maison",t:20,actif:5,cook:"casserole",kcal:120,p:1,tags:[],ing:[["fruit",2]],
  steps:["Pommes ou poires épluchées en morceaux, un fond d'eau.","15 min à feu doux à couvert, puis écrase. Cannelle si tu aimes."]}
];

/* Illustrations : la composition de l'assiette (voir FOOD dans index.html). */
const VIZ = {
 m01:[["bread",2],["jam",1]], m02:[["oats",2.2],["fruit",.8]], m03:[["yogurt",1.6],["fruit",.8],["bread",.6]], m04:[["bread",2],["fruit",1]],
 m05:[["crepe",2.2],["jam",.8]], m06:[["scrambled",2],["bread",1]],
 p01:[["pasta",1.8],["bolo",1.2]], p02:[["carbonara",3]], p03:[["pasta",1.8],["sauce",.6],["tuna",.6]], p04:[["carbonara",3]],
 p05:[["lasagna",3]], p06:[["pasta",1.6],["creamsauce",.8],["chicken",.6]], p07:[["gratin",3]],
 p08:[["chickenleg",1.4],["potato",1.6]], p09:[["meatloaf",1],["fries",1.4],["salad",.6]], p10:[["chicken",1],["creamsauce",.6],["rice",1.4]],
 p11:[["curry",1.6],["rice",1.4]], p12:[["chili",1.6],["rice",1.4]], p13:[["puree",2.2],["bolo",.8]], p14:[["meatballs",1.4],["pasta",1.6]],
 p15:[["sausage",1.2],["puree",1.8]], p16:[["burger",1.6],["fries",1.4]], p17:[["wrap",2],["salad",1]], p18:[["nuggets",1.5],["fries",1.5]],
 p19:[["basquaise",1.6],["rice",1.3]], p20:[["stew",1.8],["carrot",.6],["potato",.6]], p21:[["creamsauce",1.2],["chicken",.8],["rice",1.2]],
 p22:[["gratin",2.4],["salad",.6]], p23:[["bread",1.8],["salad",1]], p24:[["quiche",2],["salad",1]], p25:[["tartiflette",3]],
 p26:[["crepe",2],["salad",1]], p27:[["gratin",2.5],["salad",.5]], p28:[["sausage",1.2],["lentils",1.5],["carrot",.5]],
 p29:[["moules",1.8],["fries",1.2]], p30:[["rougail",1.6],["rice",1.4]], p31:[["pizza",3]], p32:[["friedrice",3]],
 p33:[["nuggets",1.2],["rice",1.2],["salad",.6]], p34:[["fish",1.2],["creamsauce",.6],["potato",1.4]], p35:[["rice",1.4],["tuna",.6],["egg",.5],["tomatoRaw",.5]],
 p36:[["omelette",2],["potato",.8],["salad",.6]], p37:[["ratatouille",2],["egg",1]], p38:[["stuffedtom",1.8],["rice",1.2]],
 p39:[["soup",2.2],["bread",.8]], p40:[["omelette",2.4],["veg",.6]], p41:[["bread",1.6],["egg",1],["salad",.6]], p42:[["lasagna",3]],
 p43:[["shakshuka",2.4],["bread",.8]], p44:[["couscous",1.4],["semoule",1.2],["sausage",.4]], p45:[["tajine",1.8],["potato",1.2]],
 p46:[["chorba",3]], p47:[["whitebeans",2.2],["bread",.8]], p48:[["lentils",2.2],["bread",.8]], p49:[["meatballs",1.4],["shakshuka",1.2],["bread",.5]],
 p50:[["colombo",1.6],["rice",1.4]], p51:[["curry",1.6],["rice",1.4]], p52:[["beans",1.2],["rice",1.3],["tomatoRaw",.5]], p53:[["yassa",1.6],["rice",1.4]],
 p54:[["mafe",1.6],["rice",1.4]], p55:[["friedrice",2],["veg",1]], p56:[["chickcurry",1.6],["rice",1.4]], p57:[["dahl",1.5],["rice",1.5]],
 p58:[["salad",1.8],["egg",.7],["bread",.5]], p59:[["chickpea",1],["beans",1],["salad",1]], p60:[["potato",1.4],["tuna",.6],["egg",.5],["salad",.5]],
 p61:[["bread",1.8],["salad",.6],["carrot",.6]], p62:[["bread",1.6],["tuna",.6],["egg",.4],["tomatoRaw",.4]], p63:[["semoule",1.8],["tuna",.6],["tomatoRaw",.6]],
 p64:[["tuna",1],["chickpea",1],["tomatoRaw",1]], p65:[["wrap",2],["salad",1]], p66:[["potato",1.5],["fb",1.5]],
 p67:[["friedrice",2.2],["nuts",.8]], p68:[["chickpea",1],["salad",1],["cheese",1]], p69:[["chili",1.6],["rice",1.4]], p70:[["potato",1.6],["scrambled",1.4]],
 p71:[["curry",1.6],["rice",1.4]], p72:[["omelette",2],["cheese",1]], p73:[["lentils",1.4],["rougail",.8],["rice",1.2]], p74:[["whitebeans",1.6],["egg",1],["tomatoRaw",.4]],
 p75:[["whitebeans",1.8],["salad",1],["carrot",.6]], p76:[["rice",1.6],["creamsauce",.8],["veg",.8]],
 e01:[["fruit",1]], e02:[["yogurt",1.5],["fruit",1]], e03:[["bread",1.5],["jam",1]], e04:[["cake",2]], e05:[["compote",2]]
};

/* Une phrase pour donner envie, affichée dans la fiche et la galerie. */
const DESCRIPTIONS = {
 "m01": "Le petit-déjeuner à la française : baguette croustillante, beurre, confiture et un bol de café au lait.",
 "m02": "Le classique du matin pressé, avec un fruit pour bien démarrer.",
 "m03": "Frais et léger : yaourt, fruit de saison et une tartine beurrée.",
 "m04": "Le pain rassis devient un petit-déjeuner doré et moelleux, comme chez mamie.",
 "m05": "Les crêpes du week-end, à la confiture ou au sucre, pour toute la famille.",
 "m06": "Des œufs crémeux sur des tartines grillées : simple, rapide et rassasiant.",
 "p01": "La bolognaise maison qui mijote doucement : le plat que tout le monde aime.",
 "p02": "Lardons dorés, œuf et fromage : la carbonara crémeuse en 15 minutes.",
 "p03": "Le plat de placard par excellence : pâtes, thon et sauce tomate parfumée.",
 "p04": "Le réconfort des enfants (et des grands) : coquillettes fondantes au jambon.",
 "p05": "Des couches généreuses de bolognaise et de béchamel, gratinées au four.",
 "p06": "Pâtes crémeuses au poulet et aux champignons, comme au restaurant.",
 "p07": "Pâtes, jambon et crème sous une croûte de fromage gratiné.",
 "p08": "Le poulet du dimanche, peau croustillante et pommes de terre fondantes.",
 "p09": "Le steak-frites maison, avec des frites au four bien dorées.",
 "p10": "Escalope tendre et sauce crème-champignons sur un lit de riz.",
 "p11": "Poulet fondant dans une sauce coco-curry douce et parfumée.",
 "p12": "Viande, haricots rouges et épices : le chili qui réchauffe.",
 "p13": "Viande hachée sous une purée maison gratinée : le plat familial par excellence.",
 "p14": "Boulettes maison mijotées dans la sauce tomate, avec des pâtes.",
 "p15": "Saucisses dorées et purée maison au beurre : simple et irrésistible.",
 "p16": "Le burger fait maison, fromage fondu et frites croustillantes au four.",
 "p17": "Wraps garnis de poulet épicé et de crudités, à manger avec les doigts.",
 "p18": "Nuggets croustillants faits maison, bien meilleurs que ceux du fast-food.",
 "p19": "Poulet mijoté aux poivrons et à la tomate, avec une pointe de piment.",
 "p20": "Bœuf fondant et carottes confites : le plat qui mijote tout seul.",
 "p21": "Poulet, carottes et champignons dans une sauce blanche onctueuse.",
 "p22": "Endives roulées dans le jambon, nappées de béchamel et gratinées.",
 "p23": "Pain doré, jambon et fromage fondant : le croque de toujours.",
 "p24": "La quiche aux lardons dorée au four, avec sa salade verte.",
 "p25": "Pommes de terre, lardons et reblochon fondant : le plat de fête de l'hiver.",
 "p26": "Crêpes garnies de jambon et de fromage fondu, pour un repas convivial.",
 "p27": "Pommes de terre fondantes cuites dans le lait et la crème, gratinées.",
 "p28": "Saucisses et lentilles mijotées : un classique copieux et pas cher.",
 "p29": "Moules marinières à la crème et frites croustillantes : l'air du Nord.",
 "p30": "Saucisses mijotées à la tomate, au curcuma et au piment : le goût de La Réunion.",
 "p31": "Pâte maison, tomate, jambon, champignons et fromage filant.",
 "p32": "Riz sauté au jambon, petits pois et omelette : mieux qu'au traiteur.",
 "p33": "Filets de poisson panés et dorés à la poêle, avec du riz et un filet de citron.",
 "p34": "Poisson tendre à la crème et pommes de terre : doux et léger.",
 "p35": "La salade de riz fraîche au thon, parfaite pour les beaux jours ou à emporter.",
 "p36": "L'omelette épaisse aux pommes de terre et aux oignons, à l'espagnole.",
 "p37": "Légumes du soleil mijotés et œufs au plat : le goût de la Provence.",
 "p38": "Tomates farcies à la viande et cuites au four sur un lit de riz.",
 "p39": "Une soupe maison bien chaude et des tartines au fromage fondu.",
 "p40": "L'omelette épaisse qui recycle les légumes du frigo.",
 "p41": "Le croque-monsieur coiffé d'un œuf au plat.",
 "p42": "Des lasagnes douces au potimarron et à la béchamel, pour l'automne.",
 "p43": "Œufs pochés dans une sauce tomate aux poivrons et au cumin.",
 "p44": "Le couscous du dimanche : légumes, pois chiches, poulet et merguez.",
 "p45": "Poulet fondant au citron et aux épices, cuit à l'étouffée.",
 "p46": "La soupe tomate parfumée aux épices, pois chiches et vermicelles.",
 "p47": "Haricots blancs mijotés à la tomate et au cumin, à saucer avec du pain.",
 "p48": "Lentilles mijotées aux épices marocaines : nourrissant et pas cher.",
 "p49": "Boulettes épicées dans une sauce tomate, avec un œuf au milieu.",
 "p50": "Poulet au colombo, l'épice des Antilles, et légumes fondants.",
 "p51": "Le cari réunionnais : poulet mijoté au curcuma, à l'ail et au gingembre.",
 "p52": "Riz, haricots rouges et rougail de tomate frais : l'assiette du quotidien réunionnais.",
 "p53": "Poulet mariné au citron et fondue d'oignons : le grand classique sénégalais.",
 "p54": "Poulet mijoté dans une sauce onctueuse à la pâte d'arachide.",
 "p55": "Riz sauté aux œufs et aux légumes, prêt en un quart d'heure.",
 "p56": "Pois chiches dans une sauce coco-curry : réconfortant et sans viande.",
 "p57": "Lentilles corail fondantes au lait de coco et aux épices.",
 "p58": "Salade frisée, lardons, croûtons et œuf poché : le bouchon lyonnais chez soi.",
 "p59": "Une salade fraîche et rassasiante de pois chiches et de haricots.",
 "p60": "Pommes de terre, thon et œuf dur : la salade complète.",
 "p61": "Le sandwich préféré des Français, avec des crudités.",
 "p62": "Le sandwich niçois au thon, à l'œuf et aux légumes croquants.",
 "p63": "Semoule fraîche au citron et à la menthe, tomates, concombre et thon.",
 "p64": "Thon, pois chiches et tomates : prête en 5 minutes.",
 "p65": "Wraps frais au thon et aux crudités, sans rien cuire.",
 "p66": "Pommes de terre chaudes et fromage blanc aux herbes, à la lyonnaise.",
 "p67": "Riz sauté bien parfumé, avec le croquant des cacahuètes : prêt en un quart d'heure.",
 "p68": "Une salade fraîche qui cale, prête en moins de 10 minutes, sans rien cuire.",
 "p69": "Le chili qui réconforte, sans viande, aussi copieux que l'original.",
 "p70": "Pommes de terre dorées, œufs et fromage fondant : simple et complet.",
 "p71": "Patate douce et pois chiches dans une sauce coco et curry, douce et parfumée.",
 "p72": "L'omelette au fromage, moelleuse et prête en moins de 10 minutes.",
 "p73": "Lentilles corail fondantes et rougail tomate, le goût de La Réunion sans viande.",
 "p74": "Des œufs cuits dans une sauce tomate aux haricots blancs et au paprika.",
 "p75": "Une purée de haricots blancs au citron, sans cuisson, où tremper ses crudités.",
 "p76": "Un riz façon risotto tout simple, crémeux et plein de légumes.",
 "e01": "Un fruit de saison, tout simplement.",
 "e02": "Un yaourt nature et un fruit.",
 "e03": "Le goûter d'enfance : tartine beurre-confiture.",
 "e04": "Le gâteau au yaourt moelleux, facile à faire avec les enfants.",
 "e05": "Une compote maison sans sucre ajouté, avec les fruits un peu trop mûrs."
};

/* Photos des plats : dépose photos/<identifiant>.jpg (par exemple photos/p08.jpg), l'appli la trouve toute seule.
   Sans photo, elle dessine l'assiette. Ici, seulement pour une photo qui porte un autre nom ou un autre format :
   p08:"photos/poulet-roti.webp",  */
const PHOTOS = {
};

/* Styles de cuisine, pour orienter la semaine selon ce qu'on aime (en plus de l'origine et des calories,
   calculées dans index.html : « monde » = origine non classique, « vege » = sans viande ni poisson, « copieux » = 700 kcal et plus). */
const STYLES_PLATS = {
  fastfood:["p09","p16","p17","p18","p23","p31","p41","p61","p62","p65","p02","p12","p32"],
  healthy:["p10","p11","p17","p19","p33","p34","p35","p37","p39","p40","p43","p46","p47","p48","p52","p55","p56","p57","p59","p60","p63","p64","p65","p66","p68","p69","p71","p73","p75"],
  tradition:["p01","p04","p07","p08","p13","p15","p20","p21","p22","p24","p25","p26","p27","p28","p29","p38","p58"]
};

/* Recettes détaillées en trois phases (préparer, cuire, servir). Elles remplacent les étapes courtes dans la fiche. */
const PHASES = {
 "p01": {
  "prep": [
   "Épluche et hache finement l'oignon (et une gousse d'ail si tu en as).",
   "Décongèle la viande hachée au frigo la veille, ou au micro-ondes (programme décongélation)."
  ],
  "cuisson": [
   "Dans une casserole, fais revenir l'oignon 3 min dans un filet d'huile, à feu moyen.",
   "Ajoute la viande, émiette-la à la cuillère en bois et laisse dorer 5 min.",
   "Verse les tomates, une pincée de sucre, origan, sel, poivre : 15 min à feu doux, à moitié couvert.",
   "Pendant ce temps, cuis les spaghetti dans une grande casserole d'eau bouillante salée (temps indiqué sur le paquet)."
  ],
  "service": [
   "Égoutte les pâtes en gardant un fond d'eau de cuisson.",
   "Mélange-les à la sauce (un peu d'eau de cuisson si c'est trop épais), fromage râpé dessus.",
   "La sauce se garde 3 jours au frigo et se congèle très bien."
  ]
 },
 "p05": {
  "prep": [
   "Hache l'oignon. Préchauffe le four à 180 °C.",
   "Huile légèrement un plat à gratin."
  ],
  "cuisson": [
   "Bolognaise : oignon 3 min à l'huile, viande hachée 5 min, puis tomates, origan, sel, poivre : 15 min à feu doux.",
   "Béchamel : fais fondre le beurre, ajoute la farine d'un coup et remue 1 min. Verse le lait froid petit à petit en fouettant jusqu'à ce que ça épaississe (5 min). Sel, poivre, muscade.",
   "Montage : un fond de béchamel, des plaques, de la bolognaise, de la béchamel, et ainsi de suite. Termine par la béchamel et le fromage.",
   "35 min au four, jusqu'à ce que le dessus soit bien doré."
  ],
  "service": [
   "Laisse reposer 10 min avant de couper : les parts se tiennent mieux.",
   "Se garde 3 jours au frigo et se congèle en parts."
  ]
 },
 "p08": {
  "prep": [
   "Préchauffe le four à 200 °C.",
   "Lave les pommes de terre (pas besoin de les éplucher) et coupe-les en quartiers, l'oignon aussi.",
   "Dans un plat, mélange-les avec 2 c. à soupe d'huile, sel et thym."
  ],
  "cuisson": [
   "Pose les cuisses de poulet dessus, peau vers le haut : sel, poivre, paprika.",
   "50 min au four. À mi-cuisson, arrose le poulet avec le jus du plat et remue les pommes de terre.",
   "C'est cuit quand le jus qui sort en piquant la cuisse est clair, pas rosé."
  ],
  "service": [
   "Sers dans le plat, avec une salade verte si tu en as."
  ]
 },
 "p12": {
  "prep": [
   "Hache l'oignon. Égoutte et rince les haricots rouges."
  ],
  "cuisson": [
   "Oignon 3 min à l'huile, puis la viande hachée émiettée : 5 min.",
   "Haricots, tomates, 1 c. à café de cumin et de paprika (et du piment si tu aimes), sel : 20 min à feu doux.",
   "Pendant ce temps, fais cuire le riz."
  ],
  "service": [
   "Sers le chili sur le riz. Il se congèle très bien en portions."
  ]
 },
 "p13": {
  "prep": [
   "Épluche les pommes de terre et coupe-les en gros morceaux. Hache l'oignon.",
   "Préchauffe le four à 200 °C."
  ],
  "cuisson": [
   "Pommes de terre dans une casserole d'eau froide salée : porte à ébullition, puis 20 min (la pointe d'un couteau doit s'enfoncer facilement).",
   "Pendant ce temps, oignon 3 min à l'huile, puis la viande hachée émiettée : 5 min. Sel, poivre.",
   "Égoutte les pommes de terre et écrase-les avec le lait chaud et une noix de beurre.",
   "Viande au fond du plat, purée par-dessus lissée à la fourchette, fromage râpé : 20 min au four."
  ],
  "service": [
   "Laisse tiédir 5 min. Avec une salade verte, c'est un repas complet."
  ]
 },
 "p14": {
  "prep": [
   "Mélange la viande hachée, un peu d'œuf battu, l'oignon haché très fin, sel, poivre, herbes. Forme des boulettes avec les mains mouillées."
  ],
  "cuisson": [
   "Dore-les 5 min dans une poêle huilée, en les roulant.",
   "Ajoute les tomates et du basilic, couvre : 15 min à feu doux.",
   "Pendant ce temps, cuis les pâtes."
  ],
  "service": [
   "Sers les boulettes et leur sauce sur les pâtes, un peu de fromage râpé dessus."
  ]
 },
 "p16": {
  "prep": [
   "Préchauffe le four à 220 °C. Coupe les pommes de terre en bâtonnets, sèche-les dans un torchon, mélange avec huile et sel.",
   "Lave la salade, coupe la tomate et l'oignon en rondelles."
  ],
  "cuisson": [
   "Frites : 30 min au four, en les retournant à mi-cuisson.",
   "10 min avant la fin, cuis le steak à la poêle 3 à 4 min de chaque côté ; pose le fromage dessus la dernière minute, couvercle fermé.",
   "Toaste les pains 1 min à la poêle, face coupée en dessous."
  ],
  "service": [
   "Monte le burger : pain, salade, tomate, steak et fromage, oignon, ketchup ou moutarde, pain.",
   "Sers avec les frites."
  ]
 },
 "p18": {
  "prep": [
   "Préchauffe le four à 220 °C. Frites : bâtonnets de pommes de terre, huile, sel, sur une plaque.",
   "Coupe le poulet en morceaux. Prépare 3 assiettes : farine, œuf battu salé, chapelure (ou biscottes écrasées)."
  ],
  "cuisson": [
   "Enfourne les frites pour 30 min.",
   "Passe chaque morceau de poulet dans la farine, puis l'œuf, puis la chapelure.",
   "Ajoute les nuggets sur une plaque les 15 dernières minutes avec un filet d'huile (ou 6 min à la poêle)."
  ],
  "service": [
   "Sers avec du ketchup ou du fromage blanc aux herbes."
  ]
 },
 "p20": {
  "prep": [
   "Coupe le bœuf en gros cubes s'il ne l'est pas, les carottes en rondelles épaisses, émince l'oignon."
  ],
  "cuisson": [
   "Dans la cocotte-minute, dore la viande 5 min de tous les côtés dans un filet d'huile, puis l'oignon 2 min.",
   "Carottes, thym, laurier, un cube de bouillon, un grand verre d'eau, sel, poivre.",
   "Ferme et compte 40 min après le sifflement, à feu moyen (sans cocotte-minute : 2 h 30 à couvert, à feu très doux).",
   "Pendant ce temps, cuis les pommes de terre à l'eau : 20 min."
  ],
  "service": [
   "Ouvre une fois la pression retombée : la viande doit se défaire à la fourchette.",
   "Encore meilleur réchauffé le lendemain."
  ]
 },
 "p21": {
  "prep": [
   "Coupe le poulet en morceaux, les carottes en rondelles, les champignons en lamelles."
  ],
  "cuisson": [
   "Couvre le poulet et les carottes d'eau froide avec un cube de bouillon. Porte à ébullition, puis 25 min à feu doux.",
   "Fais cuire le riz.",
   "Retire le poulet et les carottes ; garde le bouillon.",
   "Sauce : beurre fondu, farine, remue 1 min, puis 2 louches de bouillon petit à petit en fouettant, jusqu'à ce que ça nappe la cuillère.",
   "Champignons 5 min dans la sauce, puis la crème, le poulet et les carottes : 2 min sans faire bouillir."
  ],
  "service": [
   "Un filet de citron si tu en as. Sers avec le riz."
  ]
 },
 "p22": {
  "prep": [
   "Préchauffe le four à 200 °C. Retire le petit cône amer à la base des endives."
  ],
  "cuisson": [
   "Endives 15 min à la vapeur ou dans l'eau bouillante salée.",
   "Égoutte-les en les pressant bien, sinon le plat rend de l'eau.",
   "Béchamel : beurre fondu, farine, puis le lait petit à petit en fouettant ; sel, poivre, muscade.",
   "Roule chaque endive dans une tranche de jambon, range-les dans le plat, béchamel et fromage dessus : 20 min au four."
  ],
  "service": [
   "Sers bien doré, avec du pain."
  ]
 },
 "p24": {
  "prep": [
   "Préchauffe le four à 180 °C. Déroule la pâte dans un moule avec son papier, pique le fond à la fourchette.",
   "Dore les lardons 3 min à la poêle sans matière grasse, égoutte-les."
  ],
  "cuisson": [
   "Pour 4 parts : bats 4 œufs avec 20 cl de crème et 20 cl de lait, poivre, muscade (peu de sel, les lardons sont salés).",
   "Répartis lardons et fromage sur la pâte, verse le mélange.",
   "35 min au four : c'est cuit quand le centre ne tremble plus."
  ],
  "service": [
   "Laisse tiédir 10 min avant de couper. Avec une salade verte.",
   "Les parts restantes se gardent 3 jours au frigo : parfait pour les midis."
  ]
 },
 "p25": {
  "prep": [
   "Lave les pommes de terre, émince l'oignon, préchauffe le four à 200 °C."
  ],
  "cuisson": [
   "Pommes de terre entières dans l'eau bouillante salée : 15 min, elles doivent rester un peu fermes. Pèle-les, coupe-les en rondelles.",
   "Dore lardons et oignon 5 min à la poêle.",
   "Dans le plat : pommes de terre, lardons-oignons, crème, poivre ; mélange.",
   "Coupe le reblochon en deux dans l'épaisseur et pose-le dessus, croûte vers le haut : 25 min au four."
  ],
  "service": [
   "Sers bien chaud, avec une salade verte pour équilibrer."
  ]
 },
 "p26": {
  "prep": [
   "Pâte pour 3 : 250 g de farine et une pincée de sel dans un saladier. Creuse un puits, casse 3 œufs, et verse 50 cl de lait petit à petit en mélangeant, pour éviter les grumeaux.",
   "Laisse reposer 30 min si tu as le temps : les crêpes seront plus souples."
  ],
  "cuisson": [
   "Chauffe une poêle et graisse-la avec un papier imbibé de beurre ou d'huile.",
   "Une petite louche de pâte, fais tourner la poêle pour couvrir le fond : 1 min, retourne, 30 s.",
   "Remets une crêpe dans la poêle, jambon et fromage, plie en quatre, 1 min pour faire fondre."
  ],
  "service": [
   "Sers aussitôt avec la salade. Les crêpes nature se gardent 2 jours au frigo, filmées."
  ]
 },
 "p27": {
  "prep": [
   "Préchauffe le four à 180 °C. Épluche les pommes de terre et coupe-les en rondelles fines (2 à 3 mm), sans les rincer : leur amidon fait la crème.",
   "Frotte le plat avec une gousse d'ail coupée si tu en as."
  ],
  "cuisson": [
   "Dans une casserole, chauffe le lait et la crème avec sel, poivre, muscade, ajoute les pommes de terre et le jambon en lanières : 10 min à feu doux en remuant.",
   "Verse dans le plat, fromage dessus.",
   "50 min au four : la pointe d'un couteau doit traverser sans résistance."
  ],
  "service": [
   "Laisse reposer 10 min. Se réchauffe très bien le lendemain."
  ]
 },
 "p29": {
  "prep": [
   "Préchauffe le four à 220 °C. Coupe les pommes de terre en bâtonnets, sèche-les, mélange avec huile et sel.",
   "Gratte et rince les moules ; jette celles qui sont cassées ou qui restent ouvertes quand tu les tapotes. Émince l'oignon."
  ],
  "cuisson": [
   "Frites : 30 min au four sur une plaque, retournées à mi-cuisson.",
   "10 min avant la fin, oignon 3 min dans une grande casserole, puis les moules et un demi-verre d'eau ou de vin blanc.",
   "Couvre : 5 à 6 min à feu vif en secouant la casserole, jusqu'à ce que toutes soient ouvertes. Ajoute la crème et du persil."
  ],
  "service": [
   "Jette celles qui sont restées fermées. Sers les moules dans leur jus, les frites à côté."
  ]
 },
 "p30": {
  "prep": [
   "Coupe les saucisses en rondelles épaisses, émince les oignons, hache l'ail et le piment (si tu aimes le piquant)."
  ],
  "cuisson": [
   "Dans une cocotte, dore les saucisses 5 min sans matière grasse, puis retire l'excédent de gras.",
   "Oignons, ail, 1 c. à café de curcuma et le piment : 3 min.",
   "Tomates, sel, thym : 20 min à feu doux à couvert, en remuant de temps en temps.",
   "Pendant ce temps, fais cuire le riz."
  ],
  "service": [
   "Sers le rougail sur le riz. Encore meilleur réchauffé le lendemain."
  ]
 },
 "p31": {
  "prep": [
   "Pâte pour 2 : 200 g de farine, 1 c. à café de levure de boulanger, une pincée de sel, 12 cl d'eau tiède et un filet d'huile. Pétris 5 min jusqu'à ce qu'elle soit souple.",
   "Couvre d'un torchon : 20 à 30 min dans un endroit tiède. Préchauffe le four au plus chaud (240 à 250 °C)."
  ],
  "cuisson": [
   "Étale la pâte sur une plaque huilée ou du papier cuisson.",
   "Tomates, jambon, champignons émincés, fromage, origan.",
   "12 à 15 min au four, jusqu'à ce que les bords soient dorés."
  ],
  "service": [
   "Coupe en parts et sers aussitôt, avec une salade."
  ]
 },
 "p33": {
  "prep": [
   "Décongèle le colin au frigo la veille (ou au micro-ondes), puis sèche-le bien avec du papier absorbant.",
   "Prépare 3 assiettes : farine, œuf battu salé, chapelure."
  ],
  "cuisson": [
   "Fais cuire le riz.",
   "Passe chaque filet dans la farine, l'œuf, puis la chapelure.",
   "Dore-les 4 min de chaque côté dans une poêle avec un fond d'huile, à feu moyen."
  ],
  "service": [
   "Sers avec le riz, un quartier de citron et la salade."
  ]
 },
 "p38": {
  "prep": [
   "Préchauffe le four à 180 °C. Coupe un chapeau sur chaque tomate, vide-les à la petite cuillère et garde la pulpe.",
   "Farce : viande hachée, oignon haché, persil, sel, poivre (et un peu de pain trempé dans du lait si tu en as)."
  ],
  "cuisson": [
   "Remplis les tomates, remets les chapeaux.",
   "Dans le plat : le riz cru, la pulpe hachée et un verre d'eau ; pose les tomates dessus.",
   "45 min au four : le riz doit avoir bu le jus. Ajoute un peu d'eau s'il sèche."
  ],
  "service": [
   "Deux tomates par personne, avec le riz du plat."
  ]
 },
 "p42": {
  "prep": [
   "Préchauffe le four à 180 °C. Coupe le potimarron en cubes (inutile de l'éplucher), retire les graines."
  ],
  "cuisson": [
   "Potimarron 15 min à la vapeur ou à l'eau, puis écrasé en purée, sel, poivre.",
   "Béchamel : beurre fondu, farine, remue 1 min, puis le lait petit à petit en fouettant jusqu'à ce que ça épaississe ; muscade.",
   "Dans le plat : béchamel, plaques, potimarron, béchamel, et ainsi de suite. Termine par béchamel et fromage.",
   "35 min au four."
  ],
  "service": [
   "Laisse reposer 10 min avant de couper."
  ]
 },
 "p44": {
  "prep": [
   "Coupe le poulet en morceaux si besoin, émince les oignons. Épluche carottes et navets et coupe-les en quatre, les courgettes en gros tronçons. Égoutte les pois chiches."
  ],
  "cuisson": [
   "Dans une grande casserole, dore le poulet dans un peu d'huile d'olive, puis les oignons. Ajoute la tomate, de la harissa si tu aimes, et un demi-verre d'eau.",
   "Quand ça bout, couvre d'eau et laisse cuire 20 min en écumant.",
   "Carottes, navets, pois chiches et ras-el-hanout : 15 min. Puis les courgettes : encore 15 min. Rectifie le sel.",
   "Fais griller les merguez à la poêle."
  ],
  "service": [
   "Semoule : même volume d'eau bouillante salée avec un filet d'huile, 5 min à couvert, puis égrène à la fourchette.",
   "Sers semoule, légumes et viande, et le bouillon à part pour arroser."
  ]
 },
 "p45": {
  "prep": [
   "Émince les oignons, épluche les pommes de terre et coupe-les en quartiers, coupe le citron en rondelles."
  ],
  "cuisson": [
   "Dans une cocotte, dore le poulet 5 min avec un filet d'huile.",
   "Oignons, 1 c. à café de gingembre, de curcuma et de cumin, sel, poivre : 3 min.",
   "Pommes de terre, rondelles de citron et un verre d'eau : 45 min à feu doux à couvert."
  ],
  "service": [
   "Ajoute des olives si tu en as, et de la coriandre. Du pain pour la sauce."
  ]
 },
 "p46": {
  "prep": [
   "Coupe le poulet en petits morceaux. Râpe l'oignon, la carotte, la courgette et le céleri."
  ],
  "cuisson": [
   "Dans une cocotte : le poulet, les légumes râpés, les tomates, les pois chiches et un filet d'huile, 3 à 4 min sur le feu.",
   "Couvre d'eau, cannelle, piment doux, sel, poivre : 25 à 30 min à couvert.",
   "Ajoute les vermicelles : encore 15 min sans couvercle."
  ],
  "service": [
   "Coriandre et menthe hachées juste avant de servir, avec un filet de citron."
  ]
 },
 "p49": {
  "prep": [
   "Mélange la viande hachée avec l'oignon râpé, 1 c. à café de cumin, du paprika, du persil haché, sel, poivre. Forme des boulettes de la taille d'une noix."
  ],
  "cuisson": [
   "Sauce : ail haché 1 min dans l'huile, puis les tomates, cumin, sel : 10 min dans une grande poêle.",
   "Les boulettes dans la sauce, couvert : 12 min, retournées à mi-cuisson.",
   "Casse l'œuf au centre et couvre encore 5 min, jusqu'à ce que le blanc soit pris."
  ],
  "service": [
   "Sers dans la poêle, avec du pain pour saucer."
  ]
 },
 "p50": {
  "prep": [
   "Coupe les pommes de terre et le légume (courgette ou aubergine) en dés, émince l'oignon, hache l'ail."
  ],
  "cuisson": [
   "Dans une cocotte, dore le poulet 5 min, puis l'oignon et l'ail.",
   "2 c. à café de poudre de colombo, mélange 1 min pour libérer les arômes.",
   "Pommes de terre, légume, thym et un verre d'eau : 35 min à couvert, à feu doux.",
   "Fais cuire le riz."
  ],
  "service": [
   "Un filet de citron vert juste avant de servir, avec le riz."
  ]
 },
 "p51": {
  "prep": [
   "Émince l'oignon, hache l'ail et le gingembre, coupe les tomates en dés."
  ],
  "cuisson": [
   "Dore le poulet dans un filet d'huile, puis l'oignon, l'ail, le gingembre et 1 c. à café de curcuma : 3 min.",
   "Tomates, thym et un verre d'eau : 35 min à couvert, à feu doux.",
   "Fais cuire le riz."
  ],
  "service": [
   "Sers avec le riz, et des grains (haricots rouges ou lentilles) si tu en as."
  ]
 },
 "p53": {
  "prep": [
   "Marinade : jus de citron, 1 c. à soupe de moutarde, ail haché, sel, poivre. Mets-y le poulet au moins 30 min (ou la veille au frigo).",
   "Émince finement tous les oignons."
  ],
  "cuisson": [
   "Égoutte le poulet et dore-le 5 min dans une cocotte avec un filet d'huile.",
   "Ajoute les oignons et fais-les fondre 10 min à feu moyen, jusqu'à ce qu'ils soient tendres et blonds.",
   "La marinade et un demi-verre d'eau : 30 min à couvert.",
   "Fais cuire le riz."
  ],
  "service": [
   "Sers le poulet nappé d'oignons, sur le riz."
  ]
 },
 "p54": {
  "prep": [
   "Émince l'oignon, coupe les carottes (ou la patate douce) en morceaux, délaie la pâte d'arachide dans un verre d'eau chaude."
  ],
  "cuisson": [
   "Dore le poulet et l'oignon dans une cocotte.",
   "Tomates, légumes et pâte d'arachide délayée, sel, poivre.",
   "35 min à feu doux, en remuant de temps en temps pour que ça n'attache pas.",
   "Fais cuire le riz."
  ],
  "service": [
   "Sers bien chaud avec le riz, une pointe de piment si tu aimes."
  ]
 },
 "m01": {
  "prep": [
   "Fais chauffer le lait dans une casserole à feu doux, ou 1 min 30 au micro-ondes dans un grand bol."
  ],
  "cuisson": [
   "Prépare le café (ou la chicorée) et verse-le dans le lait chaud.",
   "Coupe un quart de baguette en deux dans la longueur ; passe-le au grille-pain 2 min s'il est de la veille."
  ],
  "service": [
   "Étale le beurre pendant que le pain est encore tiède, puis la confiture."
  ]
 },
 "m02": {
  "prep": [
   "Lave le fruit ; coupe-le en morceaux si c'est une pomme ou une poire."
  ],
  "cuisson": [
   "Verse les céréales dans un bol, puis le lait froid juste au moment de manger (sinon elles ramollissent)."
  ],
  "service": [
   "Le fruit dessus ou à côté. Un peu de cannelle sur la pomme, c'est très bon."
  ]
 },
 "m03": {
  "prep": [
   "Lave et coupe le fruit en petits morceaux."
  ],
  "cuisson": [
   "Verse le yaourt dans un bol, le fruit dessus.",
   "Fais griller une tranche de baguette 2 min."
  ],
  "service": [
   "Beurre la tartine encore chaude. Un filet de miel sur le yaourt si tu aimes."
  ]
 },
 "m04": {
  "prep": [
   "Dans une assiette creuse, bats l'œuf avec le lait et 1 c. à café de sucre (et une pincée de cannelle).",
   "Le pain un peu rassis est le meilleur : il absorbe sans se défaire."
  ],
  "cuisson": [
   "Fais fondre une noisette de beurre dans une poêle à feu moyen.",
   "Trempe chaque tranche 10 secondes de chaque côté dans le mélange.",
   "Fais dorer 2 min de chaque côté, jusqu'à ce que ce soit bien doré."
  ],
  "service": [
   "Saupoudre d'un peu de sucre, avec le fruit coupé à côté."
  ]
 },
 "m05": {
  "prep": [
   "Pour 4 : 200 g de farine et une pincée de sel dans un saladier. Creuse un puits, casse 2 œufs, mélange en versant 40 cl de lait petit à petit pour éviter les grumeaux.",
   "Laisse reposer 30 min si tu peux : les crêpes seront plus souples."
  ],
  "cuisson": [
   "Chauffe la poêle et graisse-la avec un papier imbibé d'huile ou de beurre.",
   "Une petite louche de pâte, fais tourner la poêle pour couvrir tout le fond.",
   "1 min, jusqu'à ce que les bords se décollent, retourne, encore 30 s."
  ],
  "service": [
   "Confiture ou sucre, roule ou plie en quatre. Les crêpes restantes se gardent 2 jours au frigo, filmées."
  ]
 },
 "m06": {
  "prep": [
   "Bats les œufs à la fourchette avec sel et poivre (et une cuillère de lait pour qu'ils soient plus crémeux)."
  ],
  "cuisson": [
   "Fais griller les tartines.",
   "Dans une petite poêle à feu doux, une noisette de beurre, puis les œufs.",
   "Remue sans arrêt avec une spatule, 2 à 3 min : arrête quand ils sont encore un peu baveux, ils finissent de cuire hors du feu."
  ],
  "service": [
   "Sur les tartines, avec de la ciboulette si tu en as."
  ]
 },
 "p02": {
  "prep": [
   "Bats l'œuf avec la crème, le fromage râpé et beaucoup de poivre (pas de sel : les lardons sont salés).",
   "Mets à chauffer une grande casserole d'eau salée."
  ],
  "cuisson": [
   "Cuis les pâtes le temps indiqué sur le paquet.",
   "Pendant ce temps, dore les lardons 5 min à la poêle, sans matière grasse.",
   "Égoutte les pâtes en gardant un demi-verre d'eau de cuisson."
  ],
  "service": [
   "Hors du feu, verse les pâtes dans la poêle des lardons, puis le mélange œuf-crème, et remue vite : la chaleur des pâtes cuit l'œuf en douceur, sans faire d'omelette.",
   "Si c'est trop épais, ajoute un peu d'eau de cuisson. Sers tout de suite."
  ]
 },
 "p03": {
  "prep": [
   "Émince l'oignon, égoutte le thon.",
   "Mets à chauffer une grande casserole d'eau salée."
  ],
  "cuisson": [
   "Cuis les pâtes le temps indiqué sur le paquet.",
   "Pendant ce temps, fais revenir l'oignon 3 min dans un filet d'huile.",
   "Ajoute les tomates, une pincée de sucre, des herbes de Provence, sel, poivre : 8 min à feu doux.",
   "Ajoute le thon émietté à la fin, juste pour le réchauffer."
  ],
  "service": [
   "Mélange avec les pâtes égouttées, un filet d'huile d'olive et du basilic si tu en as."
  ]
 },
 "p04": {
  "prep": [
   "Coupe le jambon en petits dés. Mets à chauffer de l'eau salée."
  ],
  "cuisson": [
   "Cuis les coquillettes le temps indiqué (environ 8 min).",
   "Égoutte, remets-les dans la casserole chaude, feu éteint.",
   "Ajoute le beurre, la crème, le jambon et le fromage, une pincée de muscade : remue 1 min sur feu doux, jusqu'à ce que le fromage file."
  ],
  "service": [
   "Sers aussitôt, poivre au moulin."
  ]
 },
 "p06": {
  "prep": [
   "Coupe le poulet en lanières, émince l'oignon et les champignons.",
   "Mets à chauffer une grande casserole d'eau salée."
  ],
  "cuisson": [
   "Cuis les pâtes.",
   "Dans une poêle, dore le poulet 6 min dans un filet d'huile, sel, poivre ; réserve-le.",
   "Dans la même poêle, oignon et champignons 5 min, jusqu'à ce que les champignons aient rendu leur eau.",
   "Remets le poulet, ajoute la crème et 2 c. à soupe d'eau de cuisson des pâtes : 2 min à feu doux."
  ],
  "service": [
   "Mélange avec les pâtes égouttées, persil ou ciboulette dessus."
  ]
 },
 "p07": {
  "prep": [
   "Préchauffe le four à 200 °C. Coupe le jambon en lanières."
  ],
  "cuisson": [
   "Cuis les pâtes 2 min de moins que le temps indiqué : elles finiront au four.",
   "Égoutte, mélange avec le jambon, la crème, poivre et un peu de muscade.",
   "Verse dans un plat, fromage râpé dessus : 15 min au four, jusqu'à ce que ce soit doré."
  ],
  "service": [
   "Laisse tiédir 2 min, avec une salade verte."
  ]
 },
 "p09": {
  "prep": [
   "Préchauffe le four à 220 °C.",
   "Coupe les pommes de terre en bâtonnets de l'épaisseur d'un doigt, sèche-les dans un torchon, mélange avec 1 c. à soupe d'huile et du sel."
  ],
  "cuisson": [
   "Étale les frites sur une plaque, sans qu'elles se chevauchent : 30 min au four, retournées à mi-cuisson.",
   "5 min avant la fin, chauffe une poêle bien chaude avec un filet d'huile.",
   "Steak : 3 min de chaque côté pour qu'il reste rosé, 4 min pour bien cuit. Sale à la fin."
  ],
  "service": [
   "Sers avec la salade assaisonnée (huile, vinaigre, moutarde)."
  ]
 },
 "p10": {
  "prep": [
   "Aplatis un peu l'escalope si elle est épaisse, pour qu'elle cuise régulièrement. Émince les champignons."
  ],
  "cuisson": [
   "Cuis le riz.",
   "Dans une poêle, dore l'escalope 5 min de chaque côté dans un filet d'huile ; sel, poivre ; réserve-la.",
   "Dans la même poêle, champignons 5 min.",
   "Ajoute la crème et 2 c. à soupe d'eau, remets l'escalope : 2 min à feu doux pour qu'elle s'imprègne de la sauce."
  ],
  "service": [
   "Sers sur le riz, nappée de sauce."
  ]
 },
 "p11": {
  "prep": [
   "Coupe le poulet en cubes, émince l'oignon."
  ],
  "cuisson": [
   "Fais revenir le poulet et l'oignon 5 min dans un filet d'huile.",
   "Ajoute 1 c. à café de curry et remue 1 min pour libérer les arômes.",
   "Tomates et lait de coco, sel : 12 min à feu doux, en remuant de temps en temps.",
   "Pendant ce temps, cuis le riz."
  ],
  "service": [
   "Sers le curry sur le riz, coriandre dessus si tu en as."
  ]
 },
 "p15": {
  "prep": [
   "Épluche les pommes de terre et coupe-les en gros morceaux."
  ],
  "cuisson": [
   "Pommes de terre dans l'eau froide salée : porte à ébullition, puis 20 min.",
   "Pendant ce temps, cuis les saucisses à la poêle à feu moyen, 12 à 15 min, en les retournant souvent (pique-les une fois pour qu'elles n'éclatent pas).",
   "Égoutte les pommes de terre, écrase-les avec le lait chaud et le beurre ; sel, muscade."
  ],
  "service": [
   "La purée en dôme, les saucisses à côté, un peu de jus de cuisson par-dessus."
  ]
 },
 "p17": {
  "prep": [
   "Coupe le poulet en lanières, les crudités en fines lamelles (carotte râpée, salade, tomate)."
  ],
  "cuisson": [
   "Fais dorer le poulet 6 min dans une poêle avec un filet d'huile, paprika, sel, poivre.",
   "Réchauffe les tortillas 20 secondes à la poêle ou au micro-ondes : elles se roulent sans casser."
  ],
  "service": [
   "Étale le fromage blanc sur les tortillas, ajoute les crudités et le poulet.",
   "Replie le bas, puis roule bien serré ; coupe en deux en biais."
  ]
 },
 "p19": {
  "prep": [
   "Coupe les poivrons en lanières (sans les graines), émince l'oignon et l'ail."
  ],
  "cuisson": [
   "Dans une cocotte, dore les cuisses de poulet 8 min, peau en dessous d'abord ; réserve-les.",
   "Dans la même cocotte, oignon et poivrons 5 min.",
   "Tomates, piment d'Espelette ou paprika, sel ; remets le poulet : 35 min à couvert, à feu doux.",
   "Cuis le riz."
  ],
  "service": [
   "Sers le poulet nappé de sauce aux poivrons, avec le riz."
  ]
 },
 "p23": {
  "prep": [
   "Beurre légèrement les tranches de pain à l'extérieur."
  ],
  "cuisson": [
   "Monte : pain, jambon, fromage, pain (beurre à l'extérieur).",
   "Dans une poêle à feu moyen, 4 min de chaque côté, en appuyant avec la spatule, jusqu'à ce que le pain soit doré et le fromage fondu."
  ],
  "service": [
   "Coupe en deux en triangle, avec la salade assaisonnée."
  ]
 },
 "p28": {
  "prep": [
   "Coupe les carottes en rondelles, émince l'oignon, égoutte les lentilles."
  ],
  "cuisson": [
   "Dore les saucisses 5 min dans une cocotte, en les retournant.",
   "Ajoute l'oignon et les carottes : 3 min.",
   "Lentilles, thym, laurier et un demi-verre d'eau : 15 min à couvert, à feu doux."
  ],
  "service": [
   "Sers bien chaud, un filet de vinaigre sur les lentilles relève le goût."
  ]
 },
 "p32": {
  "prep": [
   "Utilise du riz cuit la veille : il colle moins et donne un meilleur riz sauté.",
   "Coupe le jambon en petits dés, bats les œufs."
  ],
  "cuisson": [
   "Dans une grande poêle, une omelette fine avec les œufs battus ; roule-la et coupe-la en lanières.",
   "Dans la même poêle, les petits pois 3 min avec un filet d'huile.",
   "Ajoute le riz et le jambon : 5 min à feu vif en remuant, jusqu'à ce que le riz soit chaud et un peu grillé.",
   "Remets l'omelette, sauce soja."
  ],
  "service": [
   "Sers aussitôt, avec un peu d'oignon vert si tu en as."
  ]
 },
 "p34": {
  "prep": [
   "Épluche les pommes de terre et coupe-les en morceaux. Décongèle le colin au frigo (ou au micro-ondes)."
  ],
  "cuisson": [
   "Pommes de terre dans l'eau froide salée : 20 min après l'ébullition.",
   "Dans une poêle, le colin avec un fond d'eau, sel, poivre : 10 min à couvert, à feu doux, il doit s'effeuiller.",
   "Verse la crème autour du poisson, ajoute aneth ou persil : 2 min."
  ],
  "service": [
   "Sers le poisson nappé de sauce, les pommes de terre à côté, un filet de citron."
  ]
 },
 "p35": {
  "prep": [
   "Cuis l'œuf 9 min dans l'eau bouillante (œuf dur), refroidis-le sous l'eau froide.",
   "Coupe la tomate et le concombre en dés."
  ],
  "cuisson": [
   "Cuis le riz, rince-le à l'eau froide et laisse-le égoutter."
  ],
  "service": [
   "Mélange riz, thon émietté, légumes et œuf écalé en quartiers.",
   "Vinaigrette : 3 c. à soupe d'huile, 1 de vinaigre, 1 c. à café de moutarde, sel, poivre.",
   "Se garde 2 jours au frigo dans une boîte fermée."
  ]
 },
 "p36": {
  "prep": [
   "Épluche les pommes de terre et coupe-les en rondelles très fines ; émince l'oignon.",
   "Bats les œufs avec du sel."
  ],
  "cuisson": [
   "Dans une poêle, 3 c. à soupe d'huile, pommes de terre et oignon : 15 min à feu doux, à couvert, en remuant ; elles doivent être tendres, pas grillées.",
   "Mélange-les aux œufs battus, puis verse le tout dans la poêle : 8 min à feu doux.",
   "Retourne la tortilla à l'aide d'une grande assiette : glisse-la dessus, puis remets-la dans la poêle à l'envers : 3 min."
  ],
  "service": [
   "Sers tiède ou froide, coupée en parts, avec une salade."
  ]
 },
 "p37": {
  "prep": [
   "Coupe courgettes, aubergine, poivron et tomates en dés de même taille ; émince l'oignon et l'ail."
  ],
  "cuisson": [
   "Dans une grande casserole, 2 c. à soupe d'huile d'olive : oignon et poivron 5 min.",
   "Ajoute l'aubergine et la courgette : 5 min, puis les tomates, l'ail, thym, laurier, sel, poivre.",
   "35 min à feu doux à couvert, en remuant de temps en temps.",
   "Au dernier moment, deux œufs au plat dans une poêle : 3 min."
  ],
  "service": [
   "Sers la ratatouille avec les œufs dessus et du pain. Encore meilleure le lendemain."
  ]
 },
 "p39": {
  "prep": [
   "Épluche et coupe tous les légumes et la pomme de terre en morceaux, émince l'oignon."
  ],
  "cuisson": [
   "Fais revenir l'oignon 3 min dans un filet d'huile dans une grande casserole.",
   "Ajoute les légumes, couvre d'eau, un cube de bouillon : 25 min à feu moyen.",
   "Mixe (ou écrase au presse-purée), goûte et rectifie le sel."
  ],
  "service": [
   "Tartines : fromage sur le pain, 1 min au micro-ondes ou 3 min au four.",
   "La soupe se garde 3 jours au frigo et se congèle."
  ]
 },
 "p40": {
  "prep": [
   "Coupe en petits morceaux les légumes qui restent (courgette, poivron, oignon, champignons…).",
   "Bats les œufs avec la crème, le fromage, sel et poivre."
  ],
  "cuisson": [
   "Fais revenir les légumes 5 min dans une poêle avec un filet d'huile.",
   "Verse les œufs par-dessus, sans remuer.",
   "10 min à feu doux à couvert : le dessus doit être pris. (Ou 5 min sous le gril du four pour dorer.)"
  ],
  "service": [
   "Coupe en parts, avec du pain. Se mange aussi froide le lendemain."
  ]
 },
 "p41": {
  "prep": [
   "Beurre légèrement les tranches de pain à l'extérieur."
  ],
  "cuisson": [
   "Monte : pain, jambon, fromage, pain. 4 min de chaque côté à la poêle, en appuyant avec la spatule.",
   "Dans une petite poêle, l'œuf au plat : 3 min, le jaune doit rester coulant."
  ],
  "service": [
   "Pose l'œuf sur le croque, poivre, avec la salade."
  ]
 },
 "p43": {
  "prep": [
   "Coupe les poivrons en lanières, émince l'oignon, hache l'ail."
  ],
  "cuisson": [
   "Dans une grande poêle, oignon et poivrons 8 min dans un filet d'huile d'olive, avec ail, cumin et paprika.",
   "Ajoute les tomates, sel : 8 min à feu doux.",
   "Creuse deux trous dans la sauce et casse un œuf dans chacun. Couvre : 5 min, le blanc doit être pris et le jaune encore coulant."
  ],
  "service": [
   "Sers dans la poêle, coriandre dessus, avec du pain pour saucer."
  ]
 },
 "p47": {
  "prep": [
   "Égoutte et rince les haricots blancs. Hache l'oignon et l'ail."
  ],
  "cuisson": [
   "Fais revenir l'oignon et l'ail 3 min dans un filet d'huile, avec 1 c. à café de cumin et de paprika.",
   "Ajoute les haricots, les tomates et un demi-verre d'eau, sel : 20 min à feu doux, en remuant de temps en temps.",
   "La sauce doit épaissir et napper les haricots."
  ],
  "service": [
   "Coriandre ou persil, un filet d'huile d'olive, avec du pain."
  ]
 },
 "p48": {
  "prep": [
   "Égoutte et rince les lentilles. Hache l'oignon et l'ail."
  ],
  "cuisson": [
   "Oignon et ail 3 min dans un filet d'huile, avec cumin, paprika et un peu de curcuma.",
   "Ajoute les lentilles, les tomates et un verre d'eau, sel : 20 min à feu doux.",
   "Écrase quelques lentilles contre la casserole pour lier la sauce."
  ],
  "service": [
   "Coriandre et un filet d'huile d'olive. Avec du pain."
  ]
 },
 "p52": {
  "prep": [
   "Égoutte les haricots rouges (les « grains »). Rougail : coupe les tomates en tout petits dés, hache finement l'oignon et le piment."
  ],
  "cuisson": [
   "Cuis le riz.",
   "Réchauffe les grains avec un oignon, de l'ail, du thym et un fond d'eau : 10 min à feu doux.",
   "Mélange le rougail : tomates, oignon, piment, sel, un filet d'huile (et un peu de gingembre si tu en as)."
  ],
  "service": [
   "Dans l'assiette : le riz, les grains à côté, le rougail frais par-dessus."
  ]
 },
 "p55": {
  "prep": [
   "Utilise du riz cuit la veille. Bats les œufs."
  ],
  "cuisson": [
   "Dans une grande poêle, les légumes surgelés 5 min avec un filet d'huile.",
   "Ajoute le riz : 3 min à feu vif en remuant.",
   "Pousse le riz sur le côté, verse les œufs dans l'espace libre, remue jusqu'à ce qu'ils prennent, puis mélange tout.",
   "Sauce soja, poivre."
  ],
  "service": [
   "Sers aussitôt."
  ]
 },
 "p56": {
  "prep": [
   "Égoutte et rince les pois chiches, émince l'oignon."
  ],
  "cuisson": [
   "Oignon 3 min dans un filet d'huile, avec 1 c. à café de curry (et un peu de gingembre).",
   "Ajoute les pois chiches, les tomates et le lait de coco, sel : 15 min à feu doux.",
   "Cuis le riz."
  ],
  "service": [
   "Sers sur le riz, coriandre dessus, un filet de citron vert."
  ]
 },
 "p57": {
  "prep": [
   "Rince les lentilles corail à l'eau froide, jusqu'à ce que l'eau soit claire."
  ],
  "cuisson": [
   "Dans une casserole : lentilles, tomates, lait de coco, un verre d'eau, 1 c. à café de curry, sel.",
   "15 min à feu doux, en remuant souvent : elles fondent et deviennent crémeuses. Ajoute un peu d'eau si ça épaissit trop.",
   "Cuis le riz."
  ],
  "service": [
   "Sers le dahl avec le riz, un filet de citron."
  ]
 },
 "p58": {
  "prep": [
   "Lave et essore la salade. Coupe le pain en petits cubes."
  ],
  "cuisson": [
   "Dore les lardons 5 min à la poêle, puis les cubes de pain dans leur graisse jusqu'à ce qu'ils soient croustillants.",
   "Œuf mollet : 6 min dans l'eau bouillante, puis eau froide, et écale-le délicatement."
  ],
  "service": [
   "Vinaigrette : 3 c. à soupe d'huile, 1 de vinaigre, 1 c. à café de moutarde.",
   "Salade, lardons, croûtons, l'œuf dessus ouvert en deux."
  ]
 },
 "p59": {
  "prep": [
   "Égoutte et rince pois chiches et haricots rouges.",
   "Coupe concombre, poivron et tomate en petits dés, l'oignon rouge en lamelles fines."
  ],
  "cuisson": [
   "Rien à cuire : mélange tout dans un saladier."
  ],
  "service": [
   "Assaisonne avec huile d'olive, citron ou vinaigre, sel, poivre, herbes.",
   "Laisse 10 min au frais pour que les saveurs se mélangent. Se garde 2 jours."
  ]
 },
 "p60": {
  "prep": [
   "Épluche les pommes de terre et coupe-les en cubes."
  ],
  "cuisson": [
   "Pommes de terre dans l'eau froide salée : 15 min après ébullition, elles doivent rester fermes.",
   "Œuf dur : 9 min dans l'eau bouillante, puis eau froide.",
   "Laisse refroidir les pommes de terre."
  ],
  "service": [
   "Mélange pommes de terre, thon, œuf en quartiers, tomates et quelques cornichons.",
   "Vinaigrette à la moutarde ou une cuillère de mayonnaise."
  ]
 },
 "p61": {
  "prep": [
   "Lave les crudités ; râpe la carotte."
  ],
  "cuisson": [
   "Coupe la baguette dans la longueur sans aller jusqu'au bout.",
   "Beurre généreusement les deux côtés, ajoute le jambon plié, et des cornichons si tu aimes."
  ],
  "service": [
   "Crudités à côté avec un filet de vinaigrette."
  ]
 },
 "p62": {
  "prep": [
   "Œuf dur : 9 min dans l'eau bouillante, puis eau froide.",
   "Coupe la tomate et le poivron en fines rondelles."
  ],
  "cuisson": [
   "Ouvre la baguette, arrose l'intérieur d'huile d'olive (et un peu de vinaigre).",
   "Garnis : tomate, poivron, thon émietté, œuf en rondelles, olives si tu en as."
  ],
  "service": [
   "Referme et presse fort avec la main, ou sous une assiette 10 min : le pain s'imprègne, c'est le secret du pan bagnat."
  ]
 },
 "p63": {
  "prep": [
   "Coupe la tomate et le concombre en tout petits dés. Presse le citron."
  ],
  "cuisson": [
   "Verse sur la semoule le même volume d'eau bouillante salée, couvre 5 min.",
   "Égrène à la fourchette avec 2 c. à soupe d'huile d'olive et le jus de citron."
  ],
  "service": [
   "Ajoute les légumes, le thon émietté et de la menthe ou du persil.",
   "Meilleur après 30 min au frais. Se garde 2 jours."
  ]
 },
 "p64": {
  "prep": [
   "Égoutte le thon et les pois chiches. Coupe les tomates."
  ],
  "cuisson": [
   "Rien à cuire : mélange dans un saladier."
  ],
  "service": [
   "Huile d'olive, vinaigre, sel, poivre, un peu d'oignon si tu aimes. Avec du pain."
  ]
 },
 "p65": {
  "prep": [
   "Égoutte le thon et émiette-le. Râpe la carotte, coupe la salade et la tomate."
  ],
  "cuisson": [
   "Réchauffe les tortillas 20 secondes à la poêle pour qu'elles se roulent sans casser."
  ],
  "service": [
   "Fromage blanc, crudités, thon ; replie le bas et roule bien serré. Coupe en deux."
  ]
 },
 "p66": {
  "prep": [
   "Lave les pommes de terre et pique-les à la fourchette.",
   "Cervelle de canut : fromage blanc, échalote ou oignon très finement haché, une demi-gousse d'ail râpée, ciboulette, un filet d'huile et de vinaigre, sel, poivre."
  ],
  "cuisson": [
   "Pommes de terre 8 min au micro-ondes (plus si elles sont grosses) : la pointe du couteau doit entrer facilement."
  ],
  "service": [
   "Ouvre-les en deux, nappe de cervelle de canut bien froide."
  ]
 },
 "e03": {
  "prep": [
   "Coupe un morceau de baguette en deux."
  ],
  "cuisson": [
   "Fais-le griller 2 min s'il est de la veille."
  ],
  "service": [
   "Beurre et confiture."
  ]
 },
 "e04": {
  "prep": [
   "Préchauffe le four à 180 °C. Huile un moule.",
   "Pour 8 parts : vide 1 yaourt dans un saladier ; avec le pot vide, mesure 3 pots de farine, 2 de sucre et ½ d'huile."
  ],
  "cuisson": [
   "Mélange le yaourt, le sucre et 3 œufs, puis la farine et 1 sachet de levure, puis l'huile.",
   "35 min au four : une lame plantée au centre doit ressortir sèche."
  ],
  "service": [
   "Laisse refroidir avant de démouler. Se garde 4 jours dans une boîte."
  ]
 },
 "p67": {
  "prep": [
   "Si tu n'as pas de riz cuit, cuis-le d'abord et laisse-le refroidir : froid, il ne colle pas.",
   "Concasse les cacahuètes, bats les œufs avec une pincée de sel."
  ],
  "cuisson": [
   "Poêle bien chaude avec un peu d'huile : légumes surgelés et cacahuètes, 3 min.",
   "Pousse-les sur le côté, verse les œufs, laisse prendre puis brouille.",
   "Ajoute le riz, 5 min à feu vif en remuant."
  ],
  "service": [
   "Un trait de sauce soja, goûte avant de saler."
  ]
 },
 "p68": {
  "prep": [
   "Égoutte et rince les pois chiches.",
   "Coupe ou râpe les crudités."
  ],
  "cuisson": [],
  "service": [
   "Mélange le tout avec le fromage râpé, le jus de citron, un filet d'huile, sel et poivre.",
   "Se garde jusqu'au lendemain au frigo."
  ]
 },
 "p69": {
  "prep": [
   "Émince l'oignon, égoutte et rince les haricots rouges."
  ],
  "cuisson": [
   "Lance le riz dans une casserole d'eau bouillante salée.",
   "Dans une autre casserole, l'oignon 3 min à l'huile.",
   "Ajoute haricots, tomates, 1 c. à café de cumin, 1 de paprika et un peu de piment : 12 min à feu doux."
  ],
  "service": [
   "Sers le chili sur le riz. Encore meilleur réchauffé le lendemain."
  ]
 },
 "p70": {
  "prep": [
   "Épluche les pommes de terre et coupe-les en très petits dés (1 cm), pour qu'elles cuisent vite.",
   "Émince l'oignon, bats les œufs avec sel et poivre."
  ],
  "cuisson": [
   "Pommes de terre à la poêle avec un peu d'huile, 8 min à couvert en remuant deux fois.",
   "Ajoute l'oignon, 3 min à découvert pour dorer.",
   "Verse les œufs et le fromage, couvre : 6 min à feu doux, jusqu'à ce que le dessus soit pris."
  ],
  "service": [
   "Fais glisser sur une assiette et coupe en parts."
  ]
 },
 "p71": {
  "prep": [
   "Épluche la patate douce et coupe-la en petits dés.",
   "Égoutte et rince les pois chiches."
  ],
  "cuisson": [
   "Lance le riz dans une casserole d'eau bouillante salée.",
   "Patate douce dans une autre casserole avec un fond d'eau, 10 min à couvert.",
   "Ajoute pois chiches, tomates, lait de coco et 1 c. à café de curry : 8 min à feu doux."
  ],
  "service": [
   "Sers sur le riz, sale à la fin."
  ]
 },
 "p72": {
  "prep": [
   "Bats les œufs à la fourchette avec sel et poivre, sans trop insister."
  ],
  "cuisson": [
   "Fais mousser le beurre dans la poêle à feu moyen, verse les œufs.",
   "Ramène les bords vers le centre pendant 2 min.",
   "Fromage sur une moitié, plie en deux, 1 min de plus."
  ],
  "service": [
   "À manger tout de suite, baveuse ou bien cuite selon ton goût."
  ]
 },
 "p73": {
  "prep": [
   "Rince les lentilles corail.",
   "Coupe l'oignon en petits dés et sépare-le en deux parts."
  ],
  "cuisson": [
   "Lance le riz dans une casserole d'eau bouillante salée.",
   "Lentilles couvertes de deux fois leur volume d'eau, avec la moitié de l'oignon et une pincée de curcuma : 12 min à feu doux, en remuant.",
   "Rougail : mélange les tomates, le reste de l'oignon, un peu de piment et un filet d'huile, sans cuire."
  ],
  "service": [
   "Riz, lentilles et rougail côte à côte dans l'assiette. Sale les lentilles à la fin."
  ]
 },
 "p74": {
  "prep": [
   "Émince l'oignon, égoutte et rince les haricots blancs."
  ],
  "cuisson": [
   "Oignon 3 min à l'huile avec 1 c. à café de paprika.",
   "Haricots et tomates, 7 min à feu doux.",
   "Creuse deux puits, casse les œufs dedans, couvre : 4 min, le blanc doit être pris."
  ],
  "service": [
   "Sers dans la poêle, sel et poivre sur les œufs."
  ]
 },
 "p75": {
  "prep": [
   "Égoutte et rince les haricots blancs.",
   "Coupe les crudités en bâtonnets."
  ],
  "cuisson": [],
  "service": [
   "Écrase les haricots à la fourchette avec le fromage blanc, le jus de citron, sel et poivre.",
   "Un filet d'huile dessus, les crudités autour pour tremper."
  ]
 },
 "p76": {
  "prep": [
   "Coupe les légumes en petits dés.",
   "Fais chauffer de l'eau (bouilloire ou casserole)."
  ],
  "cuisson": [
   "Fais fondre le beurre dans une casserole, ajoute le riz, 1 min en remuant.",
   "Verse l'eau chaude petit à petit, en remuant souvent : 15 min.",
   "Ajoute les légumes pour les 5 dernières minutes."
  ],
  "service": [
   "Hors du feu, la crème et le fromage râpé, mélange bien. Sale, poivre, sers tout de suite."
  ]
 },
 "e05": {
  "prep": [
   "Épluche les pommes ou les poires, retire le cœur, coupe-les en morceaux."
  ],
  "cuisson": [
   "Dans une casserole avec un fond d'eau (2 c. à soupe) : 15 min à feu doux à couvert, en remuant de temps en temps.",
   "Écrase à la fourchette, ou mixe pour une compote lisse."
  ],
  "service": [
   "Cannelle si tu aimes. Se garde 4 jours au frigo."
  ]
 }
};

/* Compléments des fiches : matériel, repères pour réussir, conservation, variante. */
const DETAILS = {
 p01:{materiel:"Une grande casserole pour les pâtes, une casserole ou une sauteuse pour la sauce, une passoire, une cuillère en bois.",
  reussir:["Laisse la viande dorer sans la remuer tout le temps : c'est la couleur brune qui donne le goût.","La sauce est prête quand elle est épaisse et qu'il n'y a plus d'eau autour : une cuillère tirée au fond laisse un sillon.","Compte 1 litre d'eau et 1 cuillère à café rase de gros sel pour 100 g de pâtes. Goûte une pâte une minute avant la fin du temps du paquet."],
  garder:"La sauce se garde 3 jours au frigo dans une boîte fermée, 3 mois au congélateur. Les pâtes cuites se gardent 2 jours.",
  variante:"Sans viande : remplace le steak par des lentilles cuites, ajoutées avec les tomates."},
 p02:{materiel:"Une grande casserole, une poêle, une passoire, un bol et une fourchette.",
  reussir:["Le mélange à l'œuf se verse toujours hors du feu, sinon il cuit en grumeaux comme une omelette.","Garde un demi-verre d'eau de cuisson avant d'égoutter : c'est elle qui rend la sauce crémeuse.","Ne sale pas la sauce : les lardons et le fromage le font déjà. Poivre généreusement."],
  garder:"À manger tout de suite. Réchauffée, la sauce devient sèche.",
  variante:"Sans porc : des dés de poulet dorés ou des champignons à la place des lardons."},
 p05:{materiel:"Un plat à gratin d'environ 20 × 30 cm, deux casseroles, un fouet, une cuillère en bois.",
  reussir:["Pour la béchamel, verse le lait froid en trois ou quatre fois en fouettant sans arrêt : pas de grumeaux. Elle est prête quand elle nappe le dos de la cuillère.","Garde la bolognaise assez liquide : les plaques sèches boivent le jus pendant la cuisson.","Commence par une fine couche de sauce au fond du plat pour que les plaques n'accrochent pas, et finis par la béchamel et le fromage.","Si le dessus dore trop vite, couvre d'une feuille de papier cuisson."],
  garder:"3 jours au frigo. Se congèle en parts, 3 mois. Réchauffe 20 min au four à 160 °C ou 3 min au micro-ondes.",
  variante:"Version végétarienne : remplace la viande par des légumes surgelés revenus à la poêle."},
 p08:{materiel:"Un grand plat allant au four, un couteau, une planche, une cuillère pour arroser.",
  reussir:["Sèche la peau du poulet avec du papier absorbant avant de l'assaisonner : elle sera croustillante.","Étale les pommes de terre sur une seule couche : entassées, elles cuisent à la vapeur au lieu de dorer.","C'est cuit quand la chair se détache facilement de l'os et que le jus est clair, sans trace rose."],
  garder:"3 jours au frigo. Le reste de poulet se mange froid en sandwich ou en salade le lendemain.",
  variante:"Ajoute des carottes ou des patates douces en morceaux avec les pommes de terre."},
 p16:{materiel:"Une plaque de four, du papier cuisson, une poêle avec un couvercle, un torchon propre.",
  reussir:["Sèche bien les bâtonnets de pommes de terre dans le torchon : mouillés, ils ramollissent au lieu de dorer.","Espace les frites sur la plaque, sans les superposer, et retourne-les à mi-cuisson.","Ne presse pas le steak dans la poêle : il perd son jus. Retourne-le une seule fois.","Toaste le pain : il ne se détrempe pas avec la sauce."],
  garder:"Le burger se mange tout de suite. Les frites se réchauffent 5 min au four chaud, pas au micro-ondes.",
  variante:"Steak de haricots rouges écrasés avec un œuf et de la farine pour une version sans viande."},
 p18:{materiel:"Une ou deux plaques de four, du papier cuisson, trois assiettes creuses, une fourchette.",
  reussir:["Coupe le poulet en morceaux de même taille, environ 3 cm, pour qu'ils cuisent tous en même temps.","Utilise une main pour la farine et la chapelure, l'autre pour l'œuf : tes doigts ne s'enrobent pas.","Appuie la chapelure sur le poulet pour qu'elle tienne, puis retourne les nuggets à mi-cuisson.","Coupe un nugget en deux pour vérifier : la chair doit être blanche jusqu'au centre."],
  garder:"2 jours au frigo. Réchauffe 8 min au four à 200 °C pour retrouver le croustillant.",
  variante:"Pas de chapelure : écrase des biscottes ou des pétales de maïs nature."},
 p30:{materiel:"Une cocotte ou une sauteuse avec un couvercle, une casserole pour le riz, une cuillère en bois.",
  reussir:["Fais bien dorer les saucisses au début : c'est leur gras grillé qui parfume toute la sauce.","Si les saucisses sont très salées ou fumées, fais-les bouillir 5 min dans l'eau avant, puis jette l'eau.","La sauce est prête quand elle est épaisse et brillante, sans eau au fond. Si elle accroche, ajoute deux cuillères d'eau.","Pour le riz : rince-le, puis compte une fois et demie son volume d'eau, couvre, 12 min à feu très doux sans soulever le couvercle."],
  garder:"3 jours au frigo, encore meilleur réchauffé. Se congèle 3 mois, sans le riz.",
  variante:"Même recette avec des œufs durs coupés en deux à la place des saucisses."},
 p69:{materiel:"Deux casseroles, une passoire, une cuillère en bois.",
  reussir:["Rince les haricots sous l'eau froide jusqu'à ce que l'eau soit claire : le jus de la boîte donne un goût de conserve.","Fais chauffer les épices 30 secondes avec l'oignon avant d'ajouter les tomates : elles ont plus de goût.","Écrase quelques haricots contre le bord de la casserole pour épaissir la sauce."],
  garder:"4 jours au frigo, 3 mois au congélateur. Encore meilleur le lendemain.",
  variante:"Sers-le dans des tortillas avec du fromage râpé, ou ajoute du maïs en boîte."},
 p72:{materiel:"Une poêle antiadhésive d'environ 24 cm, un bol, une fourchette, une spatule.",
  reussir:["Bats les œufs juste assez pour mélanger le blanc et le jaune : trop battue, l'omelette est sèche.","Le beurre doit mousser sans brunir avant de verser les œufs. S'il fume, la poêle est trop chaude.","Arrête la cuisson quand le dessus est encore un peu brillant : l'omelette continue de cuire dans l'assiette."],
  garder:"À manger tout de suite.",
  variante:"Ajoute un reste de pommes de terre cuites, du jambon ou des oignons revenus avant de plier."},
 p73:{materiel:"Deux casseroles dont une avec un couvercle, un bol, une passoire fine.",
  reussir:["Les lentilles corail cuisent vite : après 12 min elles s'écrasent en purée, c'est normal et c'est ce qu'on cherche.","Sale les lentilles seulement à la fin : salées au début, elles restent fermes.","Remue de temps en temps et ajoute un peu d'eau si ça accroche au fond.","Prépare le rougail en premier : dix minutes de repos lui donnent plus de goût."],
  garder:"Les lentilles se gardent 3 jours au frigo et se congèlent. Le rougail cru se mange dans la journée.",
  variante:"Ajoute un œuf dur par personne pour un plat plus complet."}
};
Object.assign(DETAILS, {
 m01:{materiel:"Un grand bol, un couteau à pain, un grille-pain ou une poêle.",
  reussir:["Sors le beurre du frigo 10 min avant : il s'étale sans déchirer le pain.","Chauffe le lait sans le faire bouillir : il déborde vite et prend un goût de cuit."],
  garder:"À préparer au moment. La baguette de la veille se garde dans un torchon, pas au frigo.",variante:"Du miel ou de la pâte d'arachide à la place de la confiture."},
 m02:{materiel:"Un bol, un couteau, une cuillère.",
  reussir:["Verse le lait au dernier moment pour garder les céréales croquantes.","Choisis un fruit mûr : il sucre le bol sans rien ajouter."],
  garder:"À préparer au moment.",variante:"Remplace le lait par un yaourt nature pour un bol plus épais."},
 m03:{materiel:"Un bol, un couteau, un grille-pain ou une poêle.",
  reussir:["Coupe le fruit en petits morceaux : il se mélange mieux au yaourt.","Beurre la tartine tant qu'elle est chaude."],
  garder:"À préparer au moment.",variante:"Ajoute une poignée de flocons d'avoine dans le yaourt pour tenir jusqu'à midi."},
 m04:{materiel:"Une assiette creuse, une fourchette, une poêle, une spatule.",
  reussir:["Prends du pain de la veille : le pain frais se défait dans le mélange.","Feu moyen, pas plus : à feu vif l'extérieur brûle avant que l'intérieur soit cuit.","Le pain est prêt quand il est doré des deux côtés et ferme sous le doigt."],
  garder:"À manger chaud. Se réchauffe 1 min à la poêle.",variante:"Version salée : sans sucre, avec du fromage râpé fondu dessus."},
 m05:{materiel:"Un saladier, un fouet, une louche, une poêle plate, une spatule.",
  reussir:["Verse le lait en plusieurs fois en partant du centre : pas de grumeaux. S'il y en a, passe la pâte dans une passoire.","La poêle doit être bien chaude : une goutte de pâte doit grésiller.","La première crêpe est souvent ratée : elle sert à régler le feu.","Retourne la crêpe quand les bords se décollent et brunissent."],
  garder:"La pâte se garde 24 h au frigo, les crêpes cuites 2 jours sous un film ou une assiette retournée.",variante:"Sucre et citron, ou compote maison, à la place de la confiture."},
 m06:{materiel:"Un bol, une fourchette, une petite poêle, une spatule, un grille-pain.",
  reussir:["Feu doux tout le long : les œufs brouillés ne doivent jamais colorer.","Retire la poêle du feu quand les œufs sont encore brillants et un peu coulants.","Sale à la fin : salés trop tôt, les œufs rendent de l'eau."],
  garder:"À manger tout de suite.",variante:"Ajoute du fromage râpé ou des herbes hors du feu."},
 p03:{materiel:"Une grande casserole, une poêle ou une petite casserole, une passoire.",
  reussir:["Ajoute le thon hors du feu, à la fin : cuit longtemps, il devient sec.","Garde une louche d'eau de cuisson pour détendre la sauce.","La pincée de sucre enlève l'acidité des tomates en boîte."],
  garder:"2 jours au frigo. Se mange aussi froid, en salade.",variante:"Des sardines ou des maquereaux en boîte à la place du thon."},
 p04:{materiel:"Une casserole, une passoire, une cuillère en bois.",
  reussir:["Remets les pâtes égouttées dans la casserole encore chaude : la chaleur suffit à faire fondre le fromage.","Ajoute le fromage en dernier et remue tout de suite pour qu'il file sans faire de paquets."],
  garder:"2 jours au frigo. Réchauffe avec une cuillère de lait pour retrouver le crémeux.",variante:"Sans porc : du blanc de poulet cuit en dés."},
 p06:{materiel:"Une grande casserole, une grande poêle, une passoire.",
  reussir:["Ne remue pas le poulet pendant les deux premières minutes : il dore au lieu de bouillir.","Attends que les champignons aient rendu toute leur eau avant d'ajouter la crème, sinon la sauce est liquide.","Le poulet est cuit quand il est blanc à cœur, sans trace rose."],
  garder:"2 jours au frigo. Réchauffe à feu doux avec un peu d'eau.",variante:"Sans champignons : des légumes surgelés ou des courgettes en dés."},
 p07:{materiel:"Une casserole, une passoire, un plat à gratin.",
  reussir:["Cuis les pâtes 2 min de moins que le temps du paquet : elles finissent au four.","Mélange bien la crème avant d'enfourner pour que les pâtes du dessus ne sèchent pas.","Pour un dessus plus croustillant, finis 2 min sous le gril."],
  garder:"3 jours au frigo. Se réchauffe au four 10 min ou au micro-ondes 2 min.",variante:"Ajoute des légumes surgelés décongelés pour un plat complet."},
 p09:{materiel:"Une plaque de four, du papier cuisson, une poêle, un torchon propre, un saladier.",
  reussir:["Sèche les bâtonnets dans le torchon et espace-les sur la plaque : c'est ce qui les rend croustillants.","Poêle très chaude pour le steak, et ne le retourne qu'une fois.","Laisse reposer le steak 1 min dans l'assiette avant de servir : il reste juteux."],
  garder:"À manger tout de suite. Les frites se réchauffent 5 min au four chaud.",variante:"Un œuf au plat sur le steak, façon « à cheval »."},
 p10:{materiel:"Une poêle, une casserole avec couvercle pour le riz.",
  reussir:["Aplatis l'escalope avec le fond d'une casserole : même épaisseur partout, cuisson régulière.","Gratte le fond de la poêle en versant la crème : les sucs dorés donnent le goût de la sauce.","Ne fais pas bouillir la crème à gros bouillons, elle se sépare."],
  garder:"2 jours au frigo.",variante:"Une cuillère à café de moutarde dans la crème."},
 p11:{materiel:"Une sauteuse ou une grande poêle, une casserole avec couvercle pour le riz.",
  reussir:["Fais chauffer le curry 1 min avec le poulet avant d'ajouter le liquide : il perd son goût de poudre crue.","Secoue la boîte de lait de coco avant de l'ouvrir.","La sauce est prête quand elle nappe le dos de la cuillère."],
  garder:"3 jours au frigo, 3 mois au congélateur sans le riz.",variante:"Des pois chiches à la place du poulet pour une version sans viande."},
 p12:{materiel:"Une grande casserole ou une cocotte, une casserole pour le riz, une passoire.",
  reussir:["Fais bien dorer la viande avant d'ajouter les tomates.","Rince les haricots jusqu'à ce que l'eau soit claire.","Vingt minutes à petit feu au minimum : c'est le temps qu'il faut aux épices pour se fondre."],
  garder:"4 jours au frigo, 3 mois au congélateur. Meilleur le lendemain.",variante:"Dans des tortillas avec du fromage râpé."},
 p13:{materiel:"Une grande casserole, une poêle, un presse-purée ou une fourchette, un plat à gratin.",
  reussir:["Démarre les pommes de terre à l'eau froide : elles cuisent de façon régulière jusqu'au cœur.","Écrase-les à la main, jamais au mixeur : la purée devient collante.","Trace des sillons à la fourchette sur le dessus : ils dorent et croustillent."],
  garder:"3 jours au frigo. Se congèle en parts. Réchauffe 20 min au four.",variante:"Un reste de viande cuite hachée au couteau à la place du steak."},
 p14:{materiel:"Un saladier, une grande poêle avec couvercle, une casserole, une passoire.",
  reussir:["Mouille tes mains pour former les boulettes : la viande ne colle pas.","Fais-les toutes de la même taille, comme une noix, pour qu'elles cuisent ensemble.","Ne les remue pas la première minute : elles se tiennent une fois saisies."],
  garder:"3 jours au frigo dans leur sauce. Se congèlent très bien.",variante:"Avec du riz ou de la semoule à la place des pâtes."},
 p15:{materiel:"Une casserole, une poêle, un presse-purée ou une fourchette.",
  reussir:["Cuis les saucisses à feu moyen : à feu vif elles éclatent et restent crues au centre.","Égoutte bien les pommes de terre et remets-les 1 min sur le feu pour les sécher avant d'écraser.","Ajoute le lait chaud petit à petit jusqu'à la texture que tu aimes."],
  garder:"2 jours au frigo. La purée se réchauffe avec un peu de lait.",variante:"Moitié pommes de terre, moitié carottes dans la purée."},
 p17:{materiel:"Une poêle, un couteau, une planche, une râpe.",
  reussir:["Tiédis les tortillas : froides, elles cassent au pliage.","Ne charge pas trop : laisse 3 cm libres sur les bords.","Replie d'abord le bas, puis roule serré."],
  garder:"Le poulet cuit se garde 2 jours au frigo. Roule les wraps au dernier moment, ou emballe-les serrés pour le midi.",variante:"Un peu de curry ou de paprika dans le fromage blanc."},
 p19:{materiel:"Une cocotte avec couvercle, une casserole pour le riz.",
  reussir:["Dore le poulet côté peau en premier, sans le bouger, jusqu'à ce qu'il se décolle tout seul.","Feu doux et couvercle : la sauce doit frémir, pas bouillir.","C'est prêt quand la chair se détache de l'os."],
  garder:"3 jours au frigo, meilleur réchauffé. Se congèle 3 mois.",variante:"Avec des pommes de terre vapeur à la place du riz."},
 p20:{materiel:"Une cocotte-minute, un couteau, une planche.",
  reussir:["Sèche la viande et dore-la en deux fois : trop de morceaux à la fois, elle bout dans son jus.","Laisse tomber la pression avant d'ouvrir la cocotte.","La viande est cuite quand elle se coupe à la cuillère. Sinon, referme pour 10 min."],
  garder:"4 jours au frigo, meilleur réchauffé. Se congèle 3 mois.",variante:"Une cuillère de moutarde ou de concentré de tomate dans la sauce."},
 p21:{materiel:"Une grande casserole, une petite casserole, un fouet, une casserole pour le riz.",
  reussir:["La viande ne doit pas colorer : c'est ce qui garde la blanquette blanche.","Verse le bouillon chaud sur le mélange beurre-farine en fouettant : la sauce épaissit en 3 min.","Ajoute la crème à la fin et ne fais plus bouillir."],
  garder:"3 jours au frigo. Réchauffe à feu doux.",variante:"Un filet de citron dans la sauce au moment de servir."},
 p22:{materiel:"Une casserole, un fouet, un plat à gratin, une passoire.",
  reussir:["Presse bien les endives cuites entre tes mains : sinon elles rendent de l'eau dans le plat.","Retire le cône dur à la base : c'est lui qui est amer.","La béchamel est prête quand elle nappe la cuillère."],
  garder:"3 jours au frigo. Se réchauffe au four 15 min.",variante:"Des poireaux cuits à la place des endives."},
 p23:{materiel:"Une poêle, une spatule, un couteau.",
  reussir:["Beurre l'extérieur du pain, pas la poêle : la croûte dore de façon régulière.","Feu moyen et couvercle 1 min : le fromage fond avant que le pain brûle.","Appuie avec la spatule pour souder le croque."],
  garder:"À manger chaud.",variante:"Une fine couche de moutarde ou une rondelle de tomate à l'intérieur."},
 p24:{materiel:"Un moule à tarte d'environ 26 cm, un saladier, un fouet, une poêle.",
  reussir:["Pique le fond de pâte à la fourchette pour qu'il ne gonfle pas.","Égoutte les lardons : leur gras détrempe la pâte.","La quiche est cuite quand le centre ne tremble presque plus et que le dessus est doré.","Attends 10 min avant de couper."],
  garder:"3 jours au frigo. Se mange tiède ou froide, parfaite pour le midi du lendemain.",variante:"Sans lardons : thon, ou poireaux revenus à la poêle."},
 p25:{materiel:"Une casserole, une poêle, un plat à gratin.",
  reussir:["Garde les pommes de terre un peu fermes à l'eau : elles finissent de cuire au four.","Pose le reblochon croûte vers le haut : elle dore et le fromage coule dans le plat.","C'est prêt quand le fromage bouillonne sur les bords."],
  garder:"3 jours au frigo. Se réchauffe au four 15 min.",variante:"Sans porc : des dés de volaille fumée ou des champignons."},
 p26:{materiel:"Un saladier, un fouet, une louche, une poêle plate, une spatule.",
  reussir:["Pâte fluide comme de la crème liquide : ajoute un peu de lait si elle est épaisse.","Garnis la crêpe dans la poêle, côté déjà cuit, puis replie les bords pour faire fondre le fromage.","Empile les crêpes sous une assiette retournée pour les garder chaudes."],
  garder:"La pâte se garde 24 h au frigo, les crêpes nature 2 jours.",variante:"Un œuf cassé au centre de la crêpe, cuit 2 min à couvert."},
 p27:{materiel:"Un plat à gratin, une casserole, un couteau bien aiguisé ou une mandoline.",
  reussir:["Coupe des rondelles fines et régulières et ne les rince pas : l'amidon épaissit la crème.","Si le dessus dore trop vite, couvre de papier cuisson.","Le gratin est cuit quand la lame d'un couteau s'enfonce sans résistance."],
  garder:"3 jours au frigo. Meilleur réchauffé au four.",variante:"Sans jambon, en accompagnement d'une viande ou d'une salade."},
 p28:{materiel:"Une cocotte ou une casserole avec couvercle, une passoire.",
  reussir:["Dore les saucisses en premier : leur gras parfume les lentilles.","Les lentilles en bocal sont déjà cuites : 15 min suffisent, plus et elles s'écrasent.","Goûte avant de saler, les saucisses le font déjà."],
  garder:"3 jours au frigo, meilleur réchauffé.",variante:"Une cuillère de moutarde dans les lentilles au moment de servir."},
 p29:{materiel:"Une grande casserole avec couvercle, une plaque de four, un torchon.",
  reussir:["Jette les moules cassées et celles qui restent ouvertes quand tu les tapotes.","Secoue la casserole deux fois pendant la cuisson : toutes les moules s'ouvrent en même temps.","Elles sont cuites dès qu'elles sont ouvertes, 4 à 5 min. Jette celles qui restent fermées."],
  garder:"Les moules se mangent tout de suite et ne se gardent pas.",variante:"Sans crème, avec du persil et un filet de citron."},
 p31:{materiel:"Un saladier, une plaque de four, du papier cuisson, un torchon.",
  reussir:["Eau tiède, pas chaude : au-dessus de 40 °C la levure meurt et la pâte ne lève pas.","Four au maximum et plaque déjà chaude : la pâte croustille dessous.","Peu de sauce et peu de garniture : une pizza trop chargée reste molle.","Égoutte bien les champignons ou fais-les revenir avant."],
  garder:"2 jours au frigo. Se réchauffe à la poêle à couvert, pas au micro-ondes.",variante:"Thon et oignons, ou seulement tomate et fromage."},
 p32:{materiel:"Une grande poêle ou un wok, un bol, une spatule.",
  reussir:["Riz froid de la veille : le riz chaud colle et fait de la bouillie.","Feu vif et poêle large : le riz doit sauter, pas cuire à la vapeur.","Ajoute la sauce soja à la fin, sur le bord de la poêle."],
  garder:"2 jours au frigo, refroidi vite. Réchauffe bien chaud à la poêle.",variante:"Sans porc : du poulet cuit en dés."},
 p33:{materiel:"Trois assiettes creuses, une poêle, du papier absorbant, une casserole pour le riz.",
  reussir:["Sèche bien le poisson : la panure ne tient pas sur un filet mouillé.","L'huile est assez chaude quand une miette de chapelure grésille.","Ne retourne les filets qu'une fois, avec une spatule large."],
  garder:"À manger tout de suite pour le croustillant.",variante:"Un filet de citron et du fromage blanc aux herbes en sauce."},
 p34:{materiel:"Une casserole, une poêle avec couvercle.",
  reussir:["Le poisson est cuit quand il devient blanc et se sépare en feuilles sous la fourchette.","Feu doux : le colin se défait à gros bouillons.","Ajoute la crème à la fin, juste pour la chauffer."],
  garder:"2 jours au frigo.",variante:"Un peu de moutarde ou de citron dans la crème."},
 p35:{materiel:"Une casserole, une passoire, un saladier.",
  reussir:["Rince le riz cuit à l'eau froide : il arrête de cuire et ne colle pas.","Assaisonne le riz tiède : il boit mieux la vinaigrette.","Ajoute la tomate au dernier moment pour qu'elle ne détrempe pas la salade."],
  garder:"2 jours au frigo dans une boîte fermée. Idéal à emporter.",variante:"Du maïs en boîte ou des olives en plus."},
 p36:{materiel:"Une poêle antiadhésive d'environ 22 cm, un saladier, une grande assiette plate.",
  reussir:["Les pommes de terre doivent cuire doucement dans l'huile sans griller.","Pour retourner : pose l'assiette sur la poêle, retourne d'un geste franc au-dessus de l'évier, puis fais glisser la tortilla.","Elle est prête quand elle est ferme sous le doigt au centre."],
  garder:"3 jours au frigo. Très bonne froide, en parts.",variante:"Du poivron ou du fromage râpé dans les œufs."},
 p37:{materiel:"Une grande casserole ou une cocotte avec couvercle, une poêle.",
  reussir:["Coupe tous les légumes à la même taille pour qu'ils cuisent ensemble.","Feu doux et patience : la ratatouille est prête quand les légumes sont fondants et qu'il n'y a presque plus de jus.","Si elle rend trop d'eau, retire le couvercle les 10 dernières minutes."],
  garder:"4 jours au frigo, 3 mois au congélateur. Meilleure le lendemain.",variante:"Sur des pâtes ou du riz, ou froide en entrée."},
 p38:{materiel:"Un plat à gratin, une petite cuillère, un saladier.",
  reussir:["Sale l'intérieur des tomates vidées et retourne-les 10 min : elles rendent leur eau.","Ne tasse pas trop la farce, elle gonfle un peu.","Le riz cuit dans le jus du plat : vérifie à mi-cuisson qu'il reste du liquide, sinon ajoute un demi-verre d'eau."],
  garder:"3 jours au frigo. Se réchauffent au four ou au micro-ondes.",variante:"Même farce dans des courgettes rondes ou des poivrons."},
 p39:{materiel:"Une grande casserole, un mixeur plongeant ou un presse-purée.",
  reussir:["Coupe les légumes en morceaux de même taille.","Couvre juste à hauteur d'eau : trop d'eau, la soupe est fade. Tu peux en ajouter après le mixage.","Les légumes sont cuits quand ils s'écrasent contre la casserole."],
  garder:"4 jours au frigo, 3 mois au congélateur en portions.",variante:"Une cuillère de crème ou de fromage frais dans le bol."},
 p40:{materiel:"Une poêle avec couvercle, un saladier, une fourchette.",
  reussir:["Fais revenir les légumes jusqu'à ce qu'ils n'aient plus d'eau, sinon la frittata est molle.","Feu doux et couvercle : le dessous ne brûle pas pendant que le dessus prend.","Elle est prête quand le centre ne tremble plus."],
  garder:"2 jours au frigo. Se mange froide, en parts.",variante:"Avec des pâtes ou des pommes de terre de la veille."},
 p41:{materiel:"Une grande poêle et une petite, une spatule.",
  reussir:["Beurre l'extérieur du pain pour une croûte dorée.","Pour l'œuf : feu moyen, et couvre 30 secondes à la fin si le blanc reste transparent autour du jaune.","Pose l'œuf au dernier moment."],
  garder:"À manger chaud.",variante:"Un peu de crème et de fromage sur le dessus, 3 min sous le gril."},
 p42:{materiel:"Une casserole, un fouet, un presse-purée, un plat à gratin.",
  reussir:["Le potimarron se cuit avec la peau : elle devient tendre.","Garde la purée assez souple : les plaques boivent beaucoup de liquide.","Termine par la béchamel et le fromage, et couvre de papier si ça dore trop vite."],
  garder:"3 jours au frigo. Se congèle en parts.",variante:"Avec de la courge butternut ou des patates douces."},
 p43:{materiel:"Une grande poêle avec couvercle.",
  reussir:["La sauce doit être épaisse avant de casser les œufs, sinon ils se noient.","Casse chaque œuf dans un bol d'abord : pas de coquille dans le plat.","Couvre et surveille : le blanc est pris en 5 min, le jaune reste coulant."],
  garder:"La sauce se garde 3 jours au frigo. Ajoute les œufs au moment de réchauffer.",variante:"Avec des merguez dorées en morceaux dans la sauce."},
 p44:{materiel:"Une très grande casserole ou un couscoussier, un saladier pour la semoule.",
  reussir:["Ajoute les légumes dans l'ordre : carottes et navets d'abord, courgettes et pois chiches 20 min avant la fin.","Cuis les merguez à part à la poêle : leur gras rend le bouillon lourd.","Semoule : même volume d'eau bouillante salée que de semoule, couvre 5 min, puis égrène à la fourchette avec un peu d'huile ou de beurre."],
  garder:"Le bouillon et la viande se gardent 3 jours au frigo et se congèlent. La semoule se garde 2 jours.",variante:"Sans viande : double les pois chiches et les légumes."},
 p45:{materiel:"Une cocotte ou un plat à tajine avec couvercle.",
  reussir:["Feu très doux et couvercle fermé : le poulet cuit dans sa vapeur.","Retire les pépins du citron, ils donnent de l'amertume.","C'est prêt quand la chair se détache de l'os et que la sauce est sirupeuse."],
  garder:"3 jours au frigo, meilleur réchauffé.",variante:"Avec des olives vertes ajoutées 10 min avant la fin."},
 p46:{materiel:"Une cocotte ou une grande casserole, une râpe.",
  reussir:["Râper les légumes les fait fondre dans la soupe et l'épaissit.","Ajoute les vermicelles à la fin : ils continuent de gonfler hors du feu.","Le jus de citron se met dans l'assiette, pas dans la casserole."],
  garder:"3 jours au frigo. Elle épaissit : ajoute un peu d'eau en réchauffant.",variante:"Sans poulet, avec plus de pois chiches."},
 p47:{materiel:"Une casserole, une passoire.",
  reussir:["Rince les haricots jusqu'à ce que l'eau soit claire.","Fais chauffer les épices avec l'oignon avant le liquide.","La sauce est prête quand elle nappe les haricots, sans eau autour."],
  garder:"4 jours au frigo, meilleur réchauffé. Se congèle.",variante:"Un œuf poché dans la sauce les 5 dernières minutes."},
 p48:{materiel:"Une casserole, une passoire.",
  reussir:["Les lentilles en bocal sont déjà cuites : inutile de dépasser 20 min.","Écrase quelques lentilles pour lier la sauce.","Goûte à la fin : un filet de citron ou de vinaigre réveille le plat."],
  garder:"4 jours au frigo. Se congèle.",variante:"Avec des carottes en petits dés ajoutées en même temps que l'oignon."},
 p49:{materiel:"Un saladier, une grande poêle avec couvercle.",
  reussir:["Râpe l'oignon dans la viande : les boulettes restent moelleuses.","Boulettes de la taille d'une noix, mains mouillées.","Casse les œufs entre les boulettes à la fin et couvre 4 min : blanc pris, jaune coulant."],
  garder:"Les boulettes en sauce se gardent 3 jours au frigo. Ajoute les œufs au moment de réchauffer.",variante:"Sans œufs, sur de la semoule."},
 p50:{materiel:"Une cocotte avec couvercle, une casserole pour le riz.",
  reussir:["Fais chauffer la poudre de colombo 1 min dans la cocotte : elle développe son parfum.","Coupe les pommes de terre en dés de même taille.","La sauce est prête quand les pommes de terre s'écrasent un peu et l'épaississent."],
  garder:"3 jours au frigo, meilleur réchauffé. Se congèle.",variante:"Un filet de citron vert au moment de servir."},
 p51:{materiel:"Une cocotte ou une marmite avec couvercle, une casserole pour le riz.",
  reussir:["Laisse l'oignon devenir blond avant d'ajouter le curcuma.","Ne noie pas le cari : un verre d'eau suffit, la sauce doit être courte et épaisse.","C'est prêt quand la chair se détache de l'os."],
  garder:"3 jours au frigo, meilleur réchauffé. Se congèle.",variante:"Même base avec des œufs durs ou du poisson."},
 p52:{materiel:"Deux casseroles, un bol, une passoire.",
  reussir:["Coupe la tomate et l'oignon du rougail en tout petits dés.","Laisse le rougail reposer 10 min avant de servir.","Les grains doivent être crémeux : écrases-en quelques-uns dans la casserole."],
  garder:"Les grains se gardent 3 jours au frigo. Le rougail cru se mange dans la journée.",variante:"Avec des lentilles ou des haricots blancs à la place des haricots rouges."},
 p53:{materiel:"Un saladier pour la marinade, une cocotte avec couvercle, une casserole pour le riz.",
  reussir:["Plus la marinade est longue, plus le poulet a de goût : une nuit au frigo, c'est l'idéal.","Les oignons doivent fondre longtemps, jusqu'à devenir tendres et dorés : c'est eux qui font la sauce.","Verse la marinade dans la cocotte et fais-la bouillir avec le reste."],
  garder:"3 jours au frigo, meilleur réchauffé.",variante:"Des olives vertes et un peu de piment en fin de cuisson."},
 p54:{materiel:"Une cocotte avec couvercle, un bol, une casserole pour le riz.",
  reussir:["Délaie la pâte d'arachide dans l'eau chaude avant de la verser : sinon elle fait des paquets.","Remue souvent et à feu doux : la sauce arachide accroche vite au fond.","Elle est prête quand une fine couche d'huile remonte à la surface."],
  garder:"3 jours au frigo. Elle épaissit : ajoute un peu d'eau en réchauffant. Se congèle.",variante:"Sans viande, avec des patates douces et des pois chiches."},
 p55:{materiel:"Une grande poêle ou un wok, un bol, une spatule.",
  reussir:["Riz froid de la veille, bien égrené avec les doigts.","Poêle très chaude et large.","Laisse les œufs prendre 20 secondes avant de les brouiller."],
  garder:"2 jours au frigo, refroidi vite. Réchauffe bien chaud à la poêle.",variante:"Un reste de poulet ou de jambon en dés."},
 p56:{materiel:"Une casserole ou une sauteuse, une casserole pour le riz, une passoire.",
  reussir:["Fais chauffer le curry avec l'oignon avant le liquide.","Laisse réduire à découvert les 5 dernières minutes pour une sauce épaisse.","Écrase quelques pois chiches pour la lier."],
  garder:"4 jours au frigo, 3 mois au congélateur.",variante:"Une poignée d'épinards ou de légumes surgelés en fin de cuisson."},
 p57:{materiel:"Une casserole, une passoire fine, une casserole pour le riz.",
  reussir:["Rince les lentilles : elles moussent moins et sont plus digestes.","Remue souvent, elles accrochent au fond en épaississant.","Le dahl est prêt quand les lentilles sont défaites, comme une purée souple."],
  garder:"4 jours au frigo, 3 mois au congélateur. Ajoute un peu d'eau en réchauffant.",variante:"Un oignon doré avec du cumin versé dessus au moment de servir."},
 p58:{materiel:"Une poêle, une casserole, un saladier.",
  reussir:["Sors l'œuf du frigo avant : il ne se fend pas dans l'eau bouillante.","Six minutes exactement pour un œuf mollet, puis eau froide tout de suite.","Assaisonne la salade au dernier moment et pose les lardons encore chauds."],
  garder:"À manger tout de suite.",variante:"Sans porc : des dés de pommes de terre sautées."},
 p59:{materiel:"Un saladier, une passoire, un couteau.",
  reussir:["Rince bien les légumes secs en boîte.","Coupe les légumes en petits dés : chaque bouchée a de tout.","Laisse reposer 10 min après l'assaisonnement."],
  garder:"2 jours au frigo. Idéal à emporter.",variante:"Avec du thon ou du fromage en dés."},
 p60:{materiel:"Une casserole, un saladier.",
  reussir:["Sors les pommes de terre quand elles sont juste tendres : trop cuites, elles s'écrasent dans la salade.","Assaisonne-les tièdes, elles prennent mieux la vinaigrette.","Refroidis l'œuf sous l'eau froide : il s'écale facilement."],
  garder:"2 jours au frigo. Idéal à emporter.",variante:"Des maquereaux en boîte à la place du thon."},
 p61:{materiel:"Un couteau à pain, une râpe.",
  reussir:["Beurre mou et pain frais : c'est toute la recette.","Plie le jambon au lieu de le poser à plat : le sandwich est plus moelleux."],
  garder:"Emballé serré, il tient jusqu'au midi.",variante:"Du fromage en plus, ou des œufs durs à la place du jambon."},
 p62:{materiel:"Une casserole, un couteau à pain.",
  reussir:["Arrose bien la mie d'huile d'olive : le pan bagnat doit être imbibé.","Presse le sandwich 10 min sous une assiette : les saveurs se mélangent et il se tient mieux.","Égoutte bien le thon."],
  garder:"Meilleur 1 à 2 h après, emballé serré. Se garde jusqu'au soir au frais.",variante:"Des radis, de l'oignon nouveau ou des olives."},
 p63:{materiel:"Un saladier, une bouilloire ou une casserole, une fourchette.",
  reussir:["Même volume d'eau que de semoule, pas plus.","Égrène à la fourchette, pas à la cuillère : les grains restent séparés.","Laisse reposer 30 min au frais."],
  garder:"2 jours au frigo. Idéal à emporter.",variante:"Des pois chiches à la place du thon."},
 p64:{materiel:"Un saladier, une passoire.",
  reussir:["Égoutte bien le thon et les pois chiches.","Assaisonne juste avant de manger."],
  garder:"Jusqu'au lendemain au frigo.",variante:"Avec du concombre ou du poivron en dés."},
 p65:{materiel:"Une poêle, une râpe, un couteau.",
  reussir:["Tiédis les tortillas pour qu'elles ne cassent pas.","Égoutte bien le thon et essore la salade : le wrap ne se détrempe pas.","Roule serré et coupe en biais."],
  garder:"Emballé serré, il tient jusqu'au midi au frais.",variante:"Des œufs durs écrasés à la place du thon."},
 p66:{materiel:"Une assiette allant au micro-ondes, un bol, une fourchette.",
  reussir:["Pique les pommes de terre : sinon elles éclatent au micro-ondes.","Retourne-les à mi-cuisson. Elles sont cuites quand le couteau entre sans forcer.","Hache l'oignon très fin : cru, de gros morceaux piquent."],
  garder:"La sauce se garde 2 jours au frigo.",variante:"Sans micro-ondes : pommes de terre à l'eau, 20 min."},
 p67:{materiel:"Une grande poêle ou un wok, un bol, une spatule.",
  reussir:["Riz froid, bien égrené.","Fais griller les cacahuètes 1 min à sec : elles ont plus de goût.","Feu vif et gestes rapides."],
  garder:"2 jours au frigo, refroidi vite. Réchauffe bien chaud à la poêle.",variante:"Un filet de citron à la place de la sauce soja."},
 p68:{materiel:"Un saladier, une passoire, une râpe.",
  reussir:["Rince les pois chiches jusqu'à ce que l'eau soit claire.","Le citron et le sel se mettent en dernier, en goûtant."],
  garder:"Jusqu'au lendemain au frigo.",variante:"Avec du cumin et de la menthe ou du persil."},
 p70:{materiel:"Une poêle avec couvercle, un bol, une spatule.",
  reussir:["Dés d'un centimètre, pas plus : c'est ce qui permet de cuire en 20 min.","Couvercle au début pour cuire, découvert ensuite pour dorer.","Les pommes de terre sont prêtes quand la pointe du couteau entre sans résistance."],
  garder:"2 jours au frigo. Se mange froid, en parts.",variante:"Avec du poivron ou un reste de légumes."},
 p71:{materiel:"Deux casseroles dont une avec couvercle, une passoire.",
  reussir:["Petits dés de patate douce, tous de la même taille.","Elle est cuite quand elle s'écrase à la fourchette.","Laisse réduire à découvert si la sauce est trop liquide."],
  garder:"4 jours au frigo, 3 mois au congélateur.",variante:"Avec une pomme de terre ou des carottes à la place de la patate douce."},
 p74:{materiel:"Une poêle avec couvercle.",
  reussir:["La sauce doit être épaisse avant de casser les œufs.","Couvre et surveille : 4 min pour un jaune coulant, 6 pour un jaune pris."],
  garder:"La base se garde 3 jours au frigo. Ajoute les œufs au moment de réchauffer.",variante:"Avec des pois chiches à la place des haricots blancs."},
 p75:{materiel:"Un bol, une fourchette, une passoire.",
  reussir:["Écrase longtemps pour une purée lisse, ou laisse des morceaux si tu préfères.","Goûte et ajuste le citron et le sel à la fin."],
  garder:"2 jours au frigo dans une boîte fermée.",variante:"Avec une pointe de cumin ou de paprika, à tartiner sur du pain."},
 p76:{materiel:"Une casserole, une bouilloire ou une seconde casserole, une cuillère en bois.",
  reussir:["Verse l'eau chaude en plusieurs fois et attends qu'elle soit bue avant d'en remettre.","Remue souvent : c'est ce qui rend le riz crémeux.","Le riz est prêt quand il est tendre et encore un peu ferme au centre."],
  garder:"2 jours au frigo. Réchauffe avec un peu d'eau.",variante:"Avec des champignons ou des petits pois surgelés."},
 e03:{materiel:"Un couteau à pain, un grille-pain ou une poêle.",reussir:["Beurre le pain tant qu'il est tiède."],garder:"À préparer au moment.",variante:"Avec du miel ou de la compote maison."},
 e04:{materiel:"Un saladier, un fouet, un moule à cake ou à manqué.",
  reussir:["Mélange juste ce qu'il faut : une pâte trop travaillée donne un gâteau dur.","N'ouvre pas le four pendant les 25 premières minutes, le gâteau retomberait.","Il est cuit quand une lame plantée au centre ressort sèche."],
  garder:"4 jours dans une boîte fermée ou sous un torchon. Se congèle en parts.",variante:"Avec des morceaux de pomme ou un zeste de citron."},
 e05:{materiel:"Une casserole avec couvercle, un couteau, une fourchette.",
  reussir:["Des fruits bien mûrs : pas besoin d'ajouter de sucre.","Feu doux et couvercle : les fruits cuisent dans leur jus."],
  garder:"4 jours au frigo. Se congèle en petites boîtes.",variante:"Pomme et banane, ou pomme et poire."}
});
