# Agent follow-up

Un outil perso qui reprend ton tracking **Suivi R1** et gère seul les relances WhatsApp : relances courtes, relances longues, rappels de R2. Il lit les réponses et te passe la main dès qu'un prospect s'engage.

Closing Copilot n'est pas touché. Suivi R1 gagne deux champs (numéro + accord WhatsApp) et envoie chaque fiche à l'agent quand tu l'enregistres.

---

## 1. L'architecture

```
 ┌──────────────┐  fiche enregistrée   ┌──────────────────────── TON VPS ────────────────────────┐
 │  Suivi R1    │ ───── POST /api/sync ─▶│  followup-agent (Node, 1 process)                       │
 │ (navigateur) │                       │                                                          │
 └──────────────┘                       │   engine.js   règles fixes : court / long / rappel R2,   │
 ┌──────────────┐  export JSON          │               dates, fenêtre d'envoi, stop               │
 │ Closing      │ ── npm run import ───▶│   sequences.js le rythme des relances (à régler)         │
 │ Copilot      │   (optionnel)         │   llm.js      Claude : rédige / lit les réponses         │
 └──────────────┘                       │   db.js       SQLite = la base follow-up                 │
                                        │   agent.js    le tour de garde, toutes les 10 min        │
                                        └───┬──────────────┬───────────────┬──────────────┬───────┘
                                            │              │               │              │
                                  miroir ⇄  │   messages ⇄ │     alertes → │   page →     │
                                     ┌──────▼────┐  ┌──────▼──────┐  ┌──────▼─────┐  ┌─────▼──────┐
                                     │  Notion   │  │  WhatsApp   │  │   ntfy     │  │  Digest    │
                                     │ (tu édites│  │ assist/cloud│  │ (ton tél.) │  │ /digest    │
                                     │  à la main)│ └─────────────┘  └────────────┘  └────────────┘
                                     └───────────┘        + export CSV pour Excel
```

**Qui décide quoi**

| Décision | Qui | Pourquoi |
|---|---|---|
| Court ou long, quand, combien de fois | `engine.js` (règles) | Gratuit, prévisible, testé. Une IA n'a rien à faire là. |
| Le texte de chaque relance | Claude | Il s'appuie sur ce que le prospect a dit pendant le call. |
| Ce que veut dire une réponse | Claude | Intéressé, question, plus tard, pas intéressé, stop. |
| Envoyer ou non | **Toi** au départ (mode `validation`) | Tu passes un prospect en `auto` quand tu fais confiance aux messages. |
| La suite après « je suis intéressé » | **Toi** | L'agent s'arrête, te prévient et te propose une réponse. Le closing reste humain. |

### Comment un call devient un follow-up

| Dans Suivi R1 | Suivi créé |
|---|---|
| **R2 calé** avec date + heure | `rappel_r2` : rappel la veille, puis 2 h avant |
| **R2 calé** sans heure | `rappel_r2` en pause, jusqu'à ce que tu ajoutes l'heure |
| **À relancer**, chaud ou tiède, date à moins de 3 semaines | `court` : 4 messages sur environ 10 jours |
| **À relancer**, froid, date lointaine, ou « pas le moment / à la rentrée / dans 3 mois » | `long` : 4 messages sur environ 5 mois |
| **Sans suite** avec une raison de calendrier (« pas le moment ») | `long`, qui démarre dans 45 jours |
| **Sans suite** pour une autre raison | rien |

Quand un `court` se termine sans réponse, il passe tout seul en `long`. Le rythme se règle dans `src/sequences.js`, le ton de chaque angle dans `src/llm.js` → `ANGLES`. **C'est ce qu'on travaille à l'étape suivante.**

### Ce qui se passe quand un prospect répond

| Ce qu'il dit | Ce que fait l'agent |
|---|---|
| intéressé / pose une question | statut `repondu`, la séquence s'arrête, **alerte prioritaire** sur ton téléphone avec une suggestion de réponse |
| « plus tard », « en janvier » | il passe en `long`, reprise à la date donnée |
| « non merci » | `perdu` |
| « arrête », « qui êtes-vous ? » | `stop` **définitif** : aucune synchro ne le réactive |

### Les statuts

`actif` · `en_pause` · `repondu` · `gagne` · `perdu` · `stop` · `termine`

L'agent n'écrit qu'aux suivis `actif`, uniquement pendant la fenêtre d'envoi (par défaut du lundi au samedi, 9h30–19h30, heure de Paris), et au maximum 15 par tour. Sans numéro ou sans accord WhatsApp, le suivi passe en pause. Il repart tout seul dès que la fiche est complétée.

---

## 2. Deux façons d'envoyer

| | **assist** (par défaut) | **cloud** |
|---|---|---|
| Comment | L'agent rédige. Dans le digest, tu appuies sur « Ouvrir WhatsApp » : le message s'ouvre déjà écrit dans **ton** WhatsApp, tu l'envoies. | API WhatsApp Cloud officielle (Meta). L'envoi et la lecture des réponses sont automatiques. |
| Numéro vu par le prospect | Ton numéro habituel | Un numéro déclaré chez Meta |
| Réponses | Tu les colles dans le digest, l'agent les lit | Elles arrivent toutes seules (webhook) |
| Coût WhatsApp | **0 €** | Payant au message hors fenêtre de 24 h (voir plus bas) |
| Risque | Aucun | Il faut des modèles de message validés par Meta |

Pour du **100 % automatique**, c'est le mode **cloud** : la mise en place est détaillée plus bas (« Passer en 100 % automatique »). Le mode **assist** sert en attendant que ton compte Meta soit prêt.

> Je n'ai pas branché de bibliothèque WhatsApp non officielle (du genre WhatsApp Web automatisé). C'est gratuit, mais c'est contraire aux conditions de WhatsApp, et ton numéro perso peut être banni.

---

## 3. Ce que ça coûte

| Poste | Coût |
|---|---|
| Serveur | **0 €** : il tourne sur ton VPS actuel, à côté du copilote |
| Base de données | **0 €** : SQLite, un fichier sur le VPS |
| Notion | **0 €** : plan gratuit, API gratuite |
| Alertes ntfy | **0 €** |
| Claude, `claude-opus-5-5` (par défaut) | ≈ 1 centime par message rédigé ou lu → ≈ 2 à 3 € pour 200 messages par mois |
| Claude, `claude-haiku-5-5` | ≈ 40 fois moins cher (quelques centimes par mois). À tester sur tes vrais messages avant de changer `CLAUDE_MODEL`. |
| WhatsApp en `assist` | **0 €** |
| WhatsApp en `cloud` | Les réponses envoyées dans les 24 h qui suivent un message du prospect sont gratuites. En dehors, Meta facture chaque modèle envoyé : une relance compte en catégorie « marketing » (de l'ordre de 0,07 à 0,09 € en France), un rappel de R2 en « utility » (de l'ordre de 0,03 €). **Ce sont des ordres de grandeur, à vérifier sur la grille tarifaire de Meta.** |

**Total de départ : 2 à 3 € par mois** (Claude seulement). Moins de 1 € si Haiku suffit.

---

## 4. Installation sur le VPS

```bash
cd ~ && git clone <ce dépôt> && cd copilot/followup-agent
```

```bash
npm install
```

```bash
cp .env.example .env
```

Dans `.env`, mets au minimum `ACCESS_CODE` et `ANTHROPIC_API_KEY`. Node 22.13 ou plus récent est nécessaire (pour SQLite intégré).

```bash
npm test
```

```bash
npm start
```

Exposer l'agent en HTTPS, au même endroit que le copilote :

```bash
tailscale funnel --bg --set-path /followup http://127.0.0.1:8787
```

Pour le garder allumé, crée `/etc/systemd/system/followup.service` :

```ini
[Unit]
Description=Agent follow-up
After=network.target

[Service]
WorkingDirectory=/root/copilot/followup-agent
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now followup
```

### Brancher Suivi R1

Dans Suivi R1, va dans **Réglages → Agent follow-up**, colle l'adresse (`https://…ts.net/followup`) et le code, puis appuie sur **Enregistrer et tester**. Ensuite, **Envoyer tout le pipeline** une fois. Après ça, chaque fiche enregistrée part toute seule.

Tu peux aussi importer un export à la main :

```bash
npm run import -- ~/pipeline-r1-2026-10-31.json
```

### Le digest (ta page quotidienne)

`https://…ts.net/followup/digest?code=TONCODE` : à mettre en favori sur ton téléphone. Tu y trouves les messages à valider, les réponses à traiter, les suivis en pause et les prochaines relances, plus l'export CSV pour Excel.

### Notion (facultatif)

1. Crée une intégration sur notion.so/my-integrations et copie le jeton dans `NOTION_TOKEN`.
2. Crée une base avec ces colonnes (noms exacts) : `Nom` (titre), `Téléphone` (téléphone), `Type` (select), `Statut` (select), `Étape` (nombre), `Prochaine relance` (date), `Mode` (select), `Consentement WhatsApp` (case), `Objectif`, `Prétexte`, `Dernier échange`, `Notes` (texte), `ID agent` (nombre).
3. Partage la base avec l'intégration et copie son id dans `NOTION_DATABASE_ID`.

L'agent recopie tout dans Notion à chaque tour. Tu peux modifier à la main **Statut, Prochaine relance, Type, Mode, Consentement WhatsApp, Notes** : l'agent reprend tes changements au tour suivant (ta modification gagne). Ne touche pas aux autres colonnes, l'agent les réécrit.

### Alertes sur ton téléphone (facultatif)

Installe l'app **ntfy**, abonne-toi à un sujet au nom impossible à deviner, et mets `NTFY_URL=https://ntfy.sh/ton-sujet-secret`.

### Passer en 100 % automatique (mode cloud)

C'est le mode où tu n'as plus rien à faire : l'agent écrit, envoie, lit les réponses et te prévient.

**0. Le numéro.** L'API officielle ne peut pas utiliser un numéro qui tourne déjà dans l'app WhatsApp classique. Deux choix :
- **un numéro dédié au suivi** : une carte SIM prépayée suffit, elle sert juste à recevoir le code SMS une fois. C'est la voie la plus simple ;
- **garder ton numéro actuel** grâce à la « coexistence » de Meta : ton numéro passe sur l'app *WhatsApp Business* et l'API l'utilise en même temps. Tu continues à voir et écrire tes messages sur ton téléphone. Pour l'instant, cette option passe par un prestataire agréé par Meta, et sa disponibilité en France est à vérifier au moment de l'inscription.

**1. Le compte Meta** (environ 30 min)
1. Va sur business.facebook.com et crée un portefeuille business, si tu n'en as pas déjà un.
2. Sur developers.facebook.com, crée une app de type « Business » et ajoute le produit **WhatsApp**.
3. Dans WhatsApp → Configuration de l'API, ajoute ton numéro et valide-le par SMS. Note le **Phone number ID** → `WA_PHONE_NUMBER_ID`.
4. Dans Paramètres business → Utilisateurs système, crée un utilisateur système **admin**. Donne-lui l'app et le compte WhatsApp, puis génère un jeton **permanent** avec les droits `whatsapp_business_messaging` et `whatsapp_business_management` → `WA_TOKEN`.
5. Dans l'app → Paramètres → Général, récupère la **clé secrète de l'app** → `WA_APP_SECRET`.
6. Ajoute un moyen de paiement dans le compte WhatsApp. Sans ça, les modèles ne partent pas.

**2. Le webhook** (pour recevoir les réponses)
- URL de rappel : `https://…ts.net/followup/webhook/whatsapp`
- Jeton de vérification : invente-le, et mets le même dans `WA_VERIFY_TOKEN`.
- Abonne-toi au champ **messages**.

**3. Les deux modèles** (WhatsApp Manager → Modèles de message), en langue **Français** (`fr`). Meta refuse un modèle qui commence ou finit par une variable, d'où le texte fixe autour :

| Nom | Catégorie | Texte |
|---|---|---|
| `relance_suivi` | Marketing | `Bonjour {{1}}, {{2}}` puis, sur une nouvelle ligne : `Réponds STOP si tu ne veux plus de messages de ma part.` |
| `rappel_rdv` | Utility | `Bonjour {{1}}, petit rappel : notre rendez-vous est prévu {{2}}. Tu me confirmes que c'est toujours bon pour toi ?` |

`{{1}}` reçoit le prénom, `{{2}}` le message rédigé par l'IA (ou la date du rendez-vous). Exemples à donner à Meta : `Paul` / `j'ai retrouvé le cas client dont je t'ai parlé, je te l'envoie ?` et `Paul` / `mardi 3 novembre à 14h00`. La validation prend en général de quelques minutes à 24 h.

**4. Les réglages** dans `.env` :

```ini
TRANSPORT=cloud
DEFAULT_SEND_MODE=auto
```

Puis redémarre l'agent :

```bash
systemctl restart followup
```

**5. Le test.** Crée dans Suivi R1 une fiche à ton nom, avec **ton propre numéro**, « À relancer » pour aujourd'hui et la case WhatsApp cochée. Le message doit arriver dans les 10 minutes, pendant la fenêtre d'envoi. Réponds-lui « ok intéressé » : tu dois recevoir l'alerte.

**Comment l'agent choisit le format**
- Le prospect t'a écrit il y a moins de 24 h → message libre, gratuit.
- Sinon → modèle `relance_suivi` : l'IA écrit sans « Bonjour », puisque le modèle le met déjà.
- Rappel de R2 → modèle `rappel_rdv`, rempli avec la date. Pas d'IA, donc pas de coût Claude.

Tu peux garder certains prospects en validation (colonne **Mode** dans Notion) et laisser tous les autres en automatique.

---

## 5. Les règles qui protègent

- **Accord d'abord.** Personne ne reçoit de message sans la case « Il est d'accord pour que je lui écrive sur WhatsApp » cochée. Demande-le pendant le call, en une phrase. C'est aussi ce que prévoit la règle française sur la prospection par message.
- **Un stop est définitif.** Une demande d'arrêt coupe tout, pour toujours.
- **Les heures d'un humain.** Rien n'est envoyé la nuit ni le dimanche.
- **Pas de rafale.** 15 messages au maximum par tour.
- **Les données du prospect restent des données.** Si un prospect écrit « ignore tes consignes… », c'est traité comme du texte à classer, jamais comme un ordre.
- **Pas de transcription envoyée.** Suivi R1 transmet la fiche, sans le texte brut du call.

---

## 6. Les fichiers

| Fichier | Rôle |
|---|---|
| `src/engine.js` | Les règles : classement, dates, fenêtre d'envoi, réactions aux réponses |
| `src/sequences.js` | **Le rythme des relances : c'est là qu'on règle tout** |
| `src/llm.js` | Les deux consignes données à Claude : rédiger, lire |
| `src/agent.js` | Le tour de garde, la validation, la réception des réponses |
| `src/db.js` | La base SQLite (`followups`, `messages`) |
| `src/whatsapp.js` | Liens wa.me (assist), API Cloud, webhook signé |
| `src/notion.js` | Le miroir Notion, dans les deux sens |
| `src/digest.js` | La page de validation pour ton téléphone |
| `src/server.js` | Les routes HTTP et la boucle des 10 minutes |
| `scripts/import.js` | Importer un export JSON |
| `scripts/tick.js` | Lancer un seul tour (pour un cron, au lieu du serveur) |
| `test/engine.test.js` | Les tests du moteur et un parcours complet de bout en bout |
