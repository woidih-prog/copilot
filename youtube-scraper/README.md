# YouTube Scraper

Outil en ligne de commande simple et rapide pour récupérer les infos de vidéos YouTube
(chaîne, playlist, vidéo unique ou recherche). Basé sur [yt-dlp](https://github.com/yt-dlp/yt-dlp) — aucune clé API nécessaire.

## Installation

```bash
pip install -r requirements.txt
```

## Utilisation

```bash
# Toutes les vidéos d'une chaîne (50 dernières par défaut)
python yt_scraper.py @MrBeast

# Recherche par mots-clés
python yt_scraper.py "recette crêpes" -n 20

# Playlist exportée en CSV (s'ouvre directement dans Excel)
python yt_scraper.py "https://www.youtube.com/playlist?list=XXXX" -o playlist.csv

# Infos complètes : vues, likes, date, tags, description
python yt_scraper.py @MrBeast -n 100 --details -o mrbeast.csv

# Une vidéo + ses 50 meilleurs commentaires, en JSON
python yt_scraper.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --comments 50 -o video.json
```

## Pour Closing Copilot : récupérer le texte des vidéos

```bash
# Le texte de TOUTES les vidéos d'une chaîne, un fichier .txt par vidéo
python yt_scraper.py @nomdelachaine -n 0 --transcripts
```

Un dossier `transcriptions-nomdelachaine` est créé. Glisse ses fichiers `.txt` dans la zone
« Dépose tes fichiers ici » de Closing Copilot. Les vidéos sans sous-titres sont signalées et ignorées.

| Option | Rôle |
|---|---|
| `-n 100` | nombre max de vidéos (défaut 50, `0` = toute la chaîne) |
| `-t` / `--transcripts` | enregistre le texte de chaque vidéo en `.txt` (dossier optionnel : `-t mon-dossier`) |
| `-d` / `--details` | infos complètes (likes, date, tags, description) — plus lent |
| `-c 50` / `--comments 50` | les N meilleurs commentaires par vidéo |
| `-o fichier.csv` / `.json` | enregistre le résultat (sinon affichage dans le terminal) |
| `-w 16` | nombre de requêtes en parallèle (défaut 8) |

**Vitesse :** sans `--details`, la liste est récupérée en mode « flat » (une seule requête par page,
quelques secondes pour des centaines de vidéos). Avec `--details`, chaque vidéo est chargée,
en parallèle sur 8 threads.

Pour une chaîne, on peut aussi cibler les Shorts ou les lives : `https://www.youtube.com/@xxx/shorts`, `.../streams`.

Astuce : si YouTube commence à échouer, mets yt-dlp à jour : `pip install -U yt-dlp`.
