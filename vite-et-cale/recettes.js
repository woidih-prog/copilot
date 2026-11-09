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
  healthy:["p10","p11","p17","p19","p33","p34","p35","p37","p39","p40","p43","p46","p47","p48","p52","p55","p56","p57","p59","p60","p63","p64","p65","p66"],
  tradition:["p01","p04","p07","p08","p13","p15","p20","p21","p22","p24","p25","p26","p27","p28","p29","p38","p58"]
};

/* Recettes détaillées en trois phases (préparer, cuire, servir), pour les plats les plus longs.
   Elles remplacent les étapes courtes dans la fiche ; les autres plats gardent leurs étapes. */
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
 }
};
