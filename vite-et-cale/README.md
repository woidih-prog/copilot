# Vite & Calé

Une semaine de repas qui calent, à petit budget, avec des produits de saison et le moins de cuisine possible.

Une seule page (`index.html`), sans serveur ni compte : le profil, la semaine et la liste de courses sont gardés sur le téléphone.

## Ce que fait la V1
- **Profil** : Métropole ou La Réunion, magasin habituel, fruits et légumes au marché ou au magasin, allergies (gluten, lait, arachides, œufs, poisson, soja), régime (sans porc, végétarien), ce qu'on n'aime pas, nombre de personnes, budget, temps de cuisine.
- **Semaine** : 7 jours, 3 repas et un en-cas, image et prix de chaque plat, « Changer ce plat », préparation du dimanche.
- **Chez moi** : ce qu'on a au frigo, au congélateur et au placard. C'est retiré de la liste de courses, la semaine suivante l'utilise en priorité, et l'appli montre ce qu'on peut cuisiner tout de suite. « J'ai cuisiné ce plat » retire les ingrédients, « J'ai fait les courses » les range.
- **Courses** : liste par rayon à cocher, total estimé chez le magasin choisi, économie grâce à ce qu'on a déjà, copie de la liste.
- **Plats** : tous les plats permis par le profil, avec le prix par assiette.
- **Hors connexion** une fois ouverte une première fois (`sw.js`), et installable sur l'écran d'accueil (`manifest.json`).

## Limites connues
- Les prix sont des estimations d'enseigne discount, ajustées grossièrement par magasin et pour La Réunion.
- Les calories et protéines sont approximatives.
- 17 plats midi et soir : avec beaucoup d'allergies et peu de temps de cuisine, il peut en rester trop peu.
