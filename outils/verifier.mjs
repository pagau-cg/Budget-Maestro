/* Vérifie les invariants de l'outil : aucun réseau, aucun stockage, aucune
   dépendance hors du dossier. Le CSV de l'estimation ne doit jamais quitter le
   poste de travail — c'est la seule promesse qui compte vraiment ici.
   Exécution : node outils/verifier.mjs                                        */
import fs from 'node:fs';

const racine = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', racine), 'utf8');
const ech = [], ok = [];
const dit = (bon, msg) => (bon ? ok : ech).push(msg);

/* 1 — le JavaScript doit s'analyser */
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) ech.push('Aucun bloc <script> trouvé.');
const js = m ? m[1] : '';
try { new Function(js); dit(true, 'Le JavaScript s\'analyse sans erreur.'); }
catch (e) { dit(false, 'Erreur de syntaxe JavaScript : ' + e.message); }

/* 2 — aucun stockage navigateur */
const stockage = ['localStorage', 'sessionStorage', 'indexedDB', 'document.cookie']
  .filter(s => html.includes(s));
dit(stockage.length === 0, stockage.length
  ? 'Stockage navigateur détecté : ' + stockage.join(', ')
  : 'Aucun stockage navigateur.');

/* 3 — aucun appel réseau : le CSV reste sur le poste */
const net = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'EventSource']
  .filter(s => js.includes(s));
dit(net.length === 0, net.length
  ? 'Appel réseau détecté : ' + net.join(', ')
  : 'Aucun appel réseau.');

/* 4 — aucune ressource distante, pas même une police */
const distantes = [...html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)["']/g)].map(x => x[1]);
dit(distantes.length === 0, distantes.length
  ? 'Ressource distante interdite : ' + distantes.join(', ')
  : 'Aucune ressource distante.');

/* 5 — deux fichiers, pas trois : la seule dépendance locale permise est la
       librairie de lecture/écriture des classeurs */
const PERMIS = ['xlsx.full.min.js'];
const locales = [...html.matchAll(/(?:src|href)=["'](?!https?:|#|data:)([^"']+)["']/g)].map(x => x[1]);
const inattendues = locales.filter(f => !PERMIS.includes(f));
dit(inattendues.length === 0, inattendues.length
  ? 'Dépendance locale inattendue : ' + inattendues.join(', ')
  : 'Dépendances locales limitées à ' + PERMIS.join(', ') + '.');
for (const f of PERMIS) {
  const la = fs.existsSync(new URL(f, racine));
  dit(la, la ? f + ' est présent dans le dépôt.' : f + ' est référencé mais absent du dépôt.');
}
dit(html.includes('typeof XLSX===\'undefined\'') || html.includes("typeof XLSX === 'undefined'"),
  'L\'absence de la librairie est signalée à l\'ouverture.');

/* 6 — toute fonction câblée sur un évènement doit exister */
const refs = [...js.matchAll(/addEventListener\('[a-z]+',\s*([A-Za-z_$][\w$]*)\s*\)/g)].map(x => x[1]);
const manquantes = [...new Set(refs)].filter(nom =>
  !new RegExp('(function|const|let|var)\\s+' + nom + '\\b').test(js));
dit(manquantes.length === 0, manquantes.length
  ? 'Fonctions câblées mais non définies : ' + manquantes.join(', ')
  : 'Les ' + new Set(refs).size + ' gestionnaires d\'évènements sont tous définis.');

/* 7 — le gabarit Maestro a exactement 30 colonnes, dans l'ordre attendu */
const h = js.match(/const HEADERS=\[([\s\S]*?)\];/);
const nCol = h ? (h[1].match(/,/g) || []).length + 1 : 0;
dit(nCol === 30, 'Gabarit Maestro : ' + nCol + ' colonnes' + (nCol === 30 ? '.' : ' — il en faut 30.'));

/* 8 — l'ordre des familles compte : « L. Roche AFB (stud CH) » est de la laine,
       pas du métal, et « ruban à joints de gypse coupe-feu » est du coupe-feu,
       pas du gypse. Un tri alphabétique de cette table casserait le classement. */
const tbl = js.slice(js.indexOf('const FAMILLES='), js.indexOf('const ORIG_EXT='));
const ordre = [...tbl.matchAll(/f:'([^']+)'/g)].map(x => x[1]);
dit(ordre.indexOf('LAINE') === 0, 'LAINE est en tête de la table des familles.');
dit(ordre.indexOf('COUPE-FEU') < ordre.indexOf('GYPSE') && ordre.indexOf('COUPE-FEU') > -1,
  '« ruban coupe-feu » est testé avant « gypse ».');
dit(ordre.lastIndexOf('COUPE-FEU') > ordre.indexOf('MÉTAL'),
  'Le coupe-feu générique est testé après le métal.');

/* 9 — les codes de destination sont des activités MasterFormat valides */
const cf = js.slice(js.indexOf('const CODE_FAMILLE='), js.indexOf('const famille='));
const cibles = [...cf.matchAll(/'(\d{2} \d{2} \d{2}\.\d+)'/g)].map(x => x[1]);
dit(cibles.length >= 4, 'Codes de destination déclarés : ' + cibles.join(', ') + '.');

/* 10 — la version affichée doit être renseignée */
const ver = html.match(/version (\d+\.\d+)/);
dit(!!ver, ver ? 'Version affichée : ' + ver[1] + '.' : 'Aucune version affichée en pied de page.');

/* 11 — taille du fichier de l'outil (hors librairie) */
const ko = Math.round(html.length / 1024);
dit(ko < 200, 'index.html : ' + ko + ' Ko' + (ko < 200 ? '.' : ' — au-delà de 200 Ko, découper.'));

console.log('\nInvariants — index.html\n');
ok.forEach(l => console.log('  ok    ' + l));
ech.forEach(l => console.log('  ÉCHEC ' + l));
console.log('\n' + ok.length + ' vérifications réussies, ' + ech.length + ' en échec.\n');
process.exit(ech.length ? 1 : 0);
