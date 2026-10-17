1. Copiez credentials.json à la racine si vous utilisez Gmail.
2. Installez: py -m pip install -r requirements.txt
3. Lancez Lancer_Recall.bat
4. Ouvrez http://127.0.0.1:8000

V3.0 :
- Dates WhatsApp converties au même format que Gmail (tri correct, classement par mois).
- Photos/fichiers WhatsApp classés à leur date (plus de dossier Sans_date).
- Réimporter la même conversation ne crée plus de doublons.
- Vue "Personnes" : tout ce qu'on a sur un contact (mails, messages, fichiers), du plus récent au plus ancien.
- Le bouton "Synthèse IA" est prévu, il sera branché avec la clé API.

Les données restent dans storage/ (jamais envoyé sur GitHub, comme credentials.json).
