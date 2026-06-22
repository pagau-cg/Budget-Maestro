# Outil — Estimation classe A → Gabarit budget Maestro

Outil interne Construction Gauthier. Transforme l'export CSV « Sections » de l'Estimateur Général
en gabarit d'importation budget Maestro (.xlsx), prêt à importer.

Tout s'exécute dans le navigateur : **aucune donnée n'est envoyée sur Internet ni stockée.**

## Contenu du dossier (à téléverser tel quel dans le dépôt)

- `index.html` — l'outil
- `xlsx.full.min.js` — librairie de génération Excel (embarquée, aucune dépendance externe)

## Déploiement sur GitHub Pages

1. Créer un dépôt (ou utiliser un dépôt existant).
2. Téléverser les **deux fichiers** (`index.html` et `xlsx.full.min.js`) à la racine du dépôt.
3. Dépôt → **Settings → Pages** → Source : branche `main`, dossier `/ (root)` → Save.
4. Après ~1 minute, l'URL apparaît : `https://<organisation>.github.io/<dépôt>/`

> Décision à prendre : un dépôt **public** rend l'outil ET son code visibles de tous.
> Pour un usage interne, privilégier un dépôt **privé** avec Pages restreint aux membres
> de l'organisation (nécessite GitHub Team ou Enterprise).

## Ajouter dans Teams

Une fois l'URL obtenue : dans le canal voulu → **+ (Ajouter un onglet) → Site web** →
nom « Budget Maestro » + coller l'URL. L'équipe utilise l'outil directement dans Teams.

## Mise à jour

Le fichier maître est conservé dans le dossier de travail. Pour publier une nouvelle version,
remplacer `index.html` dans le dépôt — le lien (et l'onglet Teams) pointent automatiquement
vers la dernière version.

## Règles de transformation appliquées

- Une ligne de gabarit par **activité × groupe de budget**.
- pose → **L Salaire** (avec heures, unité HRE) · achat → **M Matériaux** · équip. → **E Équipement** ·
  sous-traitant → **S Sous-traitants** · divers → **D Divers**.
- Unité des lignes non-salaire : **GLO**. Type d'activité : **Activité**.
- Code de projet : saisi par l'utilisateur.
