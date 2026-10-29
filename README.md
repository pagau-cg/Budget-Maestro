# Outil — Estimation classe A → Gabarit budget Maestro

Outil interne Construction Gauthier. Transforme l'export CSV « Sections » de l'Estimateur Général
en gabarit d'importation budget Maestro (.xlsx), prêt à importer.

Tout s'exécute dans le navigateur : **aucune donnée n'est envoyée sur Internet ni stockée.**

## Contenu du dossier (à téléverser tel quel dans le dépôt)

- `index.html` — l'outil
- `xlsx.full.min.js` — librairie de lecture/écriture Excel (locale, aucune dépendance externe)
- `outils/` — contrôles automatiques, voir plus bas

Les deux premiers fichiers doivent rester **dans le même dossier**. Séparés, l'outil ne peut
ni lire un .xlsx ni produire le gabarit ; il le dit à l'ouverture plutôt que d'échouer plus tard.

## Déploiement sur GitHub Pages

1. Téléverser les **deux fichiers** (`index.html` et `xlsx.full.min.js`) à la racine du dépôt.
2. Dépôt → **Settings → Pages** → Source : branche `main`, dossier `/ (root)` → Save.
3. Après ~1 minute, l'URL apparaît : `https://<organisation>.github.io/<dépôt>/`

> Décision à prendre : un dépôt **public** rend l'outil ET son code visibles de tous — donc la
> table des familles et les codes d'activité du DDN. Aucune donnée de projet n'y figure, les CSV
> restent sur le poste. Pour un usage strictement interne, privilégier un dépôt **privé** avec
> Pages restreint aux membres de l'organisation (nécessite GitHub Team ou Enterprise).

## Ajouter dans Teams

Une fois l'URL obtenue : dans le canal voulu → **+ (Ajouter un onglet) → Site web** →
nom « Budget Maestro » + coller l'URL. L'équipe utilise l'outil directement dans Teams.

## Mise à jour

Remplacer `index.html` dans le dépôt — le lien (et l'onglet Teams) pointent automatiquement
vers la dernière version. La version s'affiche en pied de page de l'outil.

---

## Règles de transformation

### Structure (depuis la v1.1)

La lecture de l'export est **structurelle**, jamais devinée à partir du texte :

- changement de code dans la colonne « Section » → **en-tête de section** ;
- colonne « Desc. produit » vide → **en-tête de feuille** (nom libre, code MasterFormat optionnel) ;
- colonne « Desc. produit » remplie → **ligne de produit**.

Une feuille dont le nom ne commence pas par un code MasterFormat est un **relevé de quantités**.
Aucune ligne ne peut être absorbée en silence : tout ce qui n'entre pas dans le schéma est compté
et signalé à l'étape 4.

Une ligne de gabarit par **activité × groupe de budget** : pose → **L Salaire** (heures, unité HRE) ·
achat → **M Matériaux** · équip. → **E Équipement** · sous-traitant → **S Sous-traitants** ·
divers → **D Divers**. Unité des autres lignes non-salaire : **GLO**. Type d'activité : **Activité**.
Code de projet : saisi par l'utilisateur.

### Relevés de quantités (v1.3)

Les composants d'un assemblage de relevé sont **regroupés par famille** et posés sur l'activité du
dictionnaire des données correspondante :

| Famille | Produits reconnus | Activité de destination |
|---|---|---|
| Gypse | gypse, vis à gypse, coins à gypse | `09 21 16.01` |
| Métal | stud, lisse, résilient, sablière, fourrure | `09 22 16.01` |
| Laine | laine de roche, Rockboard, Confortbatt, AFB, Cavity Rock | `07 21 16.02` — `.01` si l'assemblage d'origine est un mur extérieur |
| Coupe-feu | ruban coupe-feu, scellant coupe-feu, CFS- | `07 84 00.03` |

**L'ordre des tests compte.** « L. Roche AFB (stud CH) » est de la laine, pas du métal ;
« ruban à joints de gypse coupe-feu » est du coupe-feu, pas du gypse. Un tri alphabétique de la
table casserait le classement — `outils/verifier.mjs` le contrôle.

L'Estimateur Général ventile déjà la plupart des composants : il les met à zéro dans la section de
l'assemblage et les réémet dans la section de destination, marqués du code d'origine
(`Stud 3-5/8 C.20 (09 21 16)`). L'outil fait deux choses de plus : il **pose ces lignes sur
l'activité du DDN** au lieu du code nu de la section, et il **déplace celles que l'EG a laissées
sur place**. Le montant déplacé par l'outil est affiché séparément — c'est un chiffre à regarder.

Une famille non reconnue **reste sur le code de sa section** et est signalée. Rien n'est perdu.

### Quantité à réaliser (v1.3)

La quantité portée est la **surface d'assemblage**, convertie en pi.ca, jamais la somme des
quantités de composants : une cloison à quatre feuilles de gypse compterait sinon quatre fois sa
propre surface. Les corps de métier d'un même assemblage reçoivent donc **le même dénominateur** —
celui que le chantier déclare sur le lot WBS.

Elle s'inscrit sur **une seule ligne non-salaire par activité**, les colonnes Qté de la ligne L
portant déjà les heures. Si une activité n'a aucune ligne non-salaire, la quantité ne peut pas être
inscrite et l'outil le dit.

### Dictionnaire des données (optionnel, v1.3)

Déposé à l'étape 2, le fichier `DDN_Gauthier_2026` sert à **nommer** les activités créées par
regroupement et à signaler celles qui **n'existent pas encore** au dictionnaire. C'est un
avertissement, jamais un blocage : Maestro crée l'activité qu'on lui donne.

---

## Ce qu'il faut savoir avant d'importer dans Maestro

**Maestro n'enlève jamais rien.** L'import remplace les couples (activité, groupe) présents dans le
fichier et laisse intactes les lignes absentes. Un budget importé deux fois par des chemins
différents ne s'écrase pas : il s'additionne. C'est l'origine de l'écart constaté sur le dossier
25-056 (7 708 110 $ importés, 9 607 199 $ affichés).

**Le sous-total de fermeture est le seul vrai garde-fou.** Il attrape les deux pannes qui comptent :
un export incomplet, et surtout un mauvais fichier ou un mauvais numéro de projet. Importer un
budget dans le mauvais projet Maestro écrase son budget existant.

---

## Contrôles automatiques

```
node outils/verifier.mjs   # invariants : aucun réseau, aucun stockage, aucune dépendance distante
node outils/essais.mjs     # non-régression du parseur sur un jeu d'essai synthétique
```

Les deux s'exécutent à chaque poussée (`.github/workflows/verif.yml`).

`outils/essais/exemple.csv` est un jeu d'essai **inventé** : montants ronds, aucune donnée de
projet. Il vérifie le regroupement par famille, le traitement d'une feuille de calcul codée, les
deux chemins de ventilation, la règle de quantité et les totaux. 28 contrôles.

Un jeu d'essai sur un dossier réel serait plus probant, mais il contiendrait les coûts de
l'estimation : à garder hors du dépôt, ou à anonymiser.
