# 13 – Passage au payant : tout ce qu'il faut changer

Ce fichier liste, de façon exhaustive, tout ce qui doit changer le jour où `WHOP.actif` passe à `true` dans `vite-et-cale/index.html`. Il est préparé maintenant, pour que ce jour-là il n'y ait qu'à suivre la liste — mais **rien n'est modifié ni publié sans l'accord du fondateur**. Ce fichier propose les textes, il ne les applique pas.

Règles qui s'appliquent à tout ce qui suit (identiques aux autres fichiers du dossier) :

- Pas de chiffre inventé : la seule source du prix est `WHOP.prix` dans `vite-et-cale/index.html`. Si un texte ci-dessous donne un prix différent de ce qui est codé à ce moment-là, c'est `WHOP.prix` qui a raison, pas ce fichier.
- Pas de faux avis.
- Pas de promesse d'économies (« tu économises X € par mois ») : personne ne peut la prouver.
- Tant que `WHOP.actif` est `false`, l'appli reste gratuite et rien ci-dessous ne doit être appliqué.

## 0. Repère technique

Dans `vite-et-cale/index.html`, bloc `const WHOP={...}` (section « Accès payant : Whop », vers la ligne 2053) :

| Clé | Rôle |
|---|---|
| `actif` | `false` aujourd'hui. Le bloc entier de ce fichier ne s'applique qu'à partir du moment où elle passe à `true`. |
| `paiement` | Adresse de la page de paiement Whop. À corriger **avant** le passage au payant (voir `05-page-whop.md`, « À corriger d'abord ») : l'adresse actuelle contient encore `coffee-insider-community`. |
| `prix` | Le texte de prix affiché dans l'appli (mur de paiement). Aujourd'hui : « 2,99 € par mois ou 19,99 € par an ». C'est la seule valeur à recopier ailleurs. |
| `essai` | Vide aujourd'hui. À remplir seulement si un essai gratuit est activé côté Whop (ex. « 7 jours gratuits, puis »). |

Le mur de paiement (`renderMur`, dans le même fichier) affiche déjà `WHOP.prix` et `WHOP.essai` automatiquement dès que l'accès devient payant : il n'y a rien à écrire à la main à cet endroit, juste à vérifier que ces deux valeurs sont justes avant de basculer l'interrupteur.

## 1. Avant de basculer l'interrupteur (prérequis)

- [ ] Renommer le produit Whop (actuellement « Coffee insider community » dans l'adresse) et mettre à jour `WHOP.paiement` avec la nouvelle adresse.
- [ ] Décider s'il y a un essai gratuit sur le lien Whop ; remplir `WHOP.essai` en conséquence, sinon le laisser vide.
- [ ] Vérifier que `WHOP.prix` correspond exactement au prix réellement configuré sur la page Whop.
- [ ] Dans Whop, créer un code promo à 100 % (ou un lien de paiement gratuit) pour chaque bêta-testeur inscrit, pour qu'il garde un accès sans payer.
- [ ] Prévenir chaque bêta-testeur une semaine avant, avec son code (modèle en section 8).
- [ ] Relire le texte de la page de vente Whop (`05-page-whop.md`) et vérifier qu'il est toujours à jour avec le vrai prix.
- [ ] Tester une fois le parcours de paiement de bout en bout sur un téléphone avec `?whop=test`, avant de couper l'essai pour de vrai.

## 2. Le jour J : l'ordre des opérations

1. Vérifier que toutes les sections 3 à 6 ci-dessous ont été relues et validées par le fondateur.
2. Dans `vite-et-cale/index.html` : mettre `actif:true` dans le bloc `WHOP` (et `paiement` si ce n'est pas déjà fait).
3. Appliquer dans la même foulée les changements de texte des sections 3 à 6 : il ne doit plus subsister un seul « gratuit » qui parle du prix de l'appli après ce moment-là.
4. Publier une vidéo qui annonce franchement le changement : ce que ça coûte, pourquoi, sans promettre d'économies (déjà prévu dans `03-calendrier-30-jours.md`, section « Avant d'activer l'abonnement »).
5. Repasser sur les publications encore visibles et modifiables (bio TikTok/Instagram/YouTube, commentaires épinglés) pour corriger le texte « gratuit ». Les publications Facebook déjà postées ne sont en général pas modifiables : voir section 6 pour ce qui reste possible.

## 3. Dans l'appli (`vite-et-cale/index.html`)

| Emplacement | Texte actuel | Ce qu'il faut faire |
|---|---|---|
| Fonction `textePromo()` (vers la ligne 1762) | `", repérée sur Vite & Calé, l'appli gratuite des promos du coin :"` | Retirer « gratuite » : `", repérée sur Vite & Calé, l'appli des promos du coin :"`. Ce texte accompagne le partage d'une promo précise, pas une pub pour l'abonnement — pas besoin d'y mettre le prix. |
| Gestionnaire du bouton « Inviter mes voisins » (`$("inviter").onclick`, vers la ligne 1835) | `"Je partage les promos que je vois en magasin sur Vite & Calé : c'est gratuit, sans pub, et ça fait aussi les repas de la semaine dans ton budget. Rejoins-moi, plus on est, plus il y a de promos près de chez nous :"` | Retirer « c'est gratuit, » en gardant « sans pub » (ça reste vrai) : `"Je partage les promos que je vois en magasin sur Vite & Calé : sans pub, et ça fait aussi les repas de la semaine dans ton budget. Rejoins-moi, plus on est, plus il y a de promos près de chez nous :"`. |

**Ne pas toucher** : les deux mentions « Il est gratuit : créer un compte Open Food Facts » (vers les lignes 1565 et 1587) parlent du compte Open Food Facts, pas du prix de Vite & Calé — elles restent vraies quoi qu'il arrive.

## 4. Sur la page de présentation (`vite-et-cale/decouvrir/index.html`)

| Emplacement | Texte actuel | Ce qu'il faut faire |
|---|---|---|
| `<meta name="description">` (vers la ligne 7) | « …Gratuit, sans pub, en bêta. » | Retirer « Gratuit, » : « …Sans pub, en bêta. » |
| `<meta property="og:description">` (vers la ligne 10) | « …Gratuit, sans pub. » | Retirer « Gratuit, » : « …Sans pub. » |
| Badge d'en-tête (vers la ligne 133) | `<span class="badge">Bêta gratuite</span>` | Retirer « gratuite » : `<span class="badge">Bêta</span>` (à garder seulement si le programme bêta continue — c'est une décision séparée du passage au payant, à trancher avec le fondateur). |
| Liste à puces de l'accroche (vers la ligne 146) | `<li>Gratuit</li>` | Remplacer par le prix réel recopié depuis `WHOP.prix`, par exemple `<li>Dès 2,99 €/mois</li>` — jamais un chiffre différent de celui codé dans l'appli. |
| FAQ, première question (vers la ligne 259) | « C'est vraiment gratuit ? » / « Oui. Pas d'abonnement, pas de pub, pas de compte à créer. » | Réécrire en question honnête sur le prix, en reprenant le texte déjà validé dans `05-page-whop.md` (sections « Prix » et « Questions fréquentes »), par exemple : « Combien ça coûte ? » / « [prix exact de `WHOP.prix`], sans engagement. Pas de pub, pas de compte à créer. » |

**Ne pas toucher** : la question FAQ sur le compte Open Food Facts gratuit (vers la ligne 261) — sans rapport avec le prix de l'appli.

**À trancher séparément avec le fondateur** (ce n'est pas automatique) : la section « Deviens bêta-testeur » (vers les lignes 245-254) et la mention « version bêta » du pied de page (vers la ligne 271) — seulement si le programme bêta s'arrête au même moment que le passage au payant.

## 5. Dans les légendes et scripts vidéo (`01`, `02`, `03`, `07`)

- `01-legendes-des-16-videos.md` : le commentaire épinglé donné en consigne générale (ligne 6) « Le lien est dans ma bio. C'est gratuit, sans compte, sans pub. » devient « Le lien est dans ma bio. [prix exact de `WHOP.prix`], sans compte. » — déjà anticipé à la ligne 8 de ce même fichier.
- `02-nouveaux-scripts.md` : aucune mention de « gratuit » dans les 12 scripts au moment de l'écriture de ce fichier ; vérifier avant de tourner, au cas où un script ajouté depuis en contiendrait une.
- `03-calendrier-30-jours.md` : la section « Avant d'activer l'abonnement » (lignes 53-59) reste valable pour l'ordre général — son point 1 est maintenant détaillé par ce fichier 13 ; garder ses points 2 (prévenir les bêta-testeurs) et 3 (publier une vidéo d'annonce).
- `07-serie-ticket.md` : chaque épisode prévoit déjà la clause « ou le texte à jour si l'abonnement est activé » (lignes 14, 23, 62, 82) — appliquer le même commentaire épinglé mis à jour qu'en section 5 ci-dessus.

## 6. Dans les groupes, messages et réponses (`04`, `09`, `10`)

- `04-groupes-et-messages.md` : les publications n°1 à 4 (lignes 18, 26, 32, 40) et les messages aux associations/CROUS/presse (lignes 46, 66, 81) disent « gratuit ». Les publications déjà postées sur Facebook ne sont en général pas modifiables après coup : le changement porte sur les prochaines publications. La réponse-type « C'est payant ? » (ligne 52) doit en revanche être mise à jour dès le passage au payant, pour donner le vrai prix au lieu de « gratuit pour l'instant ».
- `09-reponses-avis.md` : la règle de fichier (ligne 10) et la réponse n°15 (ligne 45) sont à mettre à jour avec le prix réel.
- `10-relais.md` : tous les messages modèles (lignes 19-93) et les règles (lignes 11, 174) sont à mettre à jour pareil. Les messages déjà envoyés ne sont pas récupérables ; si quelqu'un répond après le changement de prix, le dire franchement dans la colonne « Réponse » du tableau de suivi plutôt que de laisser croire que c'est toujours gratuit.

## 7. Ce qui ne change jamais, payant ou pas

- Pas de chiffre inventé, dans aucun des textes ci-dessus.
- Pas de faux avis, pas de témoignage mis en scène.
- Pas de promesse d'économies.
- Rien n'est publié sans l'accord du fondateur : chaque texte ci-dessus est une proposition à relire, pas une consigne à exécuter automatiquement.

## 8. Modèle de message aux bêta-testeurs (une semaine avant)

> Bonjour [Prénom],
>
> Je te préviens à l'avance : [date], je passe Vite & Calé à [prix exact de `WHOP.prix`]. Comme tu fais partie des bêta-testeurs, tu gardes un accès gratuit : voici ton code à utiliser sur la page de paiement, [code Whop].
>
> Merci encore pour ton aide sur l'appli. Dis-moi si quelque chose coince avec ce code.

## 9. Vérification finale avant de couper l'interrupteur

Avant de passer `WHOP.actif` à `true`, relancer une recherche de « gratuit » sur tout ce qui est publié ou prêt à l'être, pour ne rien oublier (y compris un fichier marketing qui aurait été ajouté depuis l'écriture de ce document) :

```
grep -rni "gratuit" vite-et-cale/index.html vite-et-cale/decouvrir/index.html vite-et-cale/marketing/*.md
```

Chaque résultat doit correspondre à une ligne déjà traitée dans ce fichier (sections 3 à 6), ou à une mention sans rapport avec le prix de Vite & Calé (le compte Open Food Facts, par exemple) — sinon, l'ajouter à la liste avant de publier.
