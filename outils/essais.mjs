/* Non-régression du parseur, sur un jeu d'essai synthétique.
   Aucune donnée de projet réelle : les montants sont inventés et ronds, choisis
   pour que chaque règle se vérifie de tête.
   Exécution : node outils/essais.mjs                                          */
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js   = html.match(/<script>([\s\S]*)<\/script>/)[1];
const core = js.slice(0, js.indexOf('// ===== UI ====='));
const { parseCSV, transform } = new Function(core + '\nreturn {parseCSV,transform};')();

const csv = fs.readFileSync(new URL('./essais/exemple.csv', import.meta.url));
const d   = transform(parseCSV(new TextDecoder('windows-1252').decode(csv), ';'));

const ech = [], ok = [];
const eq = (nom, obtenu, attendu) => {
  const bon = typeof attendu === 'number'
    ? Math.abs(obtenu - attendu) < 0.005
    : obtenu === attendu;
  (bon ? ok : ech).push(nom + ' : ' + obtenu + (bon ? '' : '  ≠ attendu ' + attendu));
};

/* --- montants par activité et par groupe --- */
const par = {};
for (const l of d.lines) (par[l.code] ||= {})[l.grp] = l.i0;
const q = {};
for (const l of d.lines) if (l.q) q[l.code] = l.q;

/* 1 — le gypse, les vis et les coins se regroupent sur 09 21 16.01 */
eq('09 21 16.01 L', par['09 21 16.01']?.L, 1000);
eq('09 21 16.01 M', par['09 21 16.01']?.M, 550);

/* 2 — une feuille de calcul codée n'est jamais reclassée */
eq('09 21 16.02 L', par['09 21 16.02']?.L, 200);
eq('09 21 16.02 M', par['09 21 16.02']?.M, 100);

/* 3 — les montants métalliques réémis par l'EG vont sur l'activité du DDN,
       pas sur le code nu de la section */
eq('09 22 16.01 L', par['09 22 16.01']?.L, 300);
eq('09 22 16.01 M', par['09 22 16.01']?.M, 200);
eq('09 22 16 (code nu) absent', par['09 22 16'] === undefined, true);

/* 4 — la laine réémise par l'EG (80/400) ET celle qu'il a laissée dans
       l'assemblage (60/140) arrivent toutes deux sur 07 21 16.02 */
eq('07 21 16.02 L', par['07 21 16.02']?.L, 140);
eq('07 21 16.02 M', par['07 21 16.02']?.M, 540);

/* 5 — « ruban … coupe-feu » est du coupe-feu, pas du gypse : l'ordre des
       familles compte */
eq('07 84 00.03 L', par['07 84 00.03']?.L, 20);
eq('07 84 00.03 M', par['07 84 00.03']?.M, 30);

/* 6 — rien ne se perd : le total reste celui de la ligne « Total » du CSV */
eq('total calculé', d.calc.total, 3080);
eq('total déclaré par le CSV', d.synth.total, 3080);
eq('heures', d.calc.temps, 83);

/* 7 — la quantité portée est la SURFACE D'ASSEMBLAGE (1 000 pi.ca), pas la
       somme des quantités de composants (qui ferait 4 300) */
eq('qté 09 21 16.01', q['09 21 16.01'], 1000);
eq('qté 09 22 16.01', q['09 22 16.01'], 1000);
eq('qté 07 21 16.02', q['07 21 16.02'], 1000);
eq('qté 07 84 00.03', q['07 84 00.03'], 1000);
eq('aucune qté sur une feuille de calcul', q['09 21 16.02'] === undefined, true);

/* 8 — la quantité ne se pose jamais sur une ligne L : ses colonnes Qté
       portent déjà les heures */
eq('aucune qté sur une ligne L', d.lines.every(l => !(l.grp === 'L' && l.q)), true);
eq('une seule ligne porteuse par activité',
  Object.keys(q).every(c => d.lines.filter(l => l.code === c && l.q).length === 1), true);
eq('unité des lignes porteuses', [...new Set(d.lines.filter(l => l.q).map(l => l.k))].join(','), 'pi.ca');

/* 9 — contrôle de ventilation, comparable à l'écran de l'Estimateur Général */
const sec = Object.fromEntries(d.sections.map(s => [s.code, s]));
eq('09 21 16 relevés', sec['09 21 16']?.rel, 1750);
eq('09 21 16 feuilles de calcul', sec['09 21 16']?.fdc, 300);
eq('09 21 16 total de la section', sec['09 21 16']?.montant, 2050);

/* 10 — le seul montant que l'outil déplace lui-même d'une section à l'autre
        est la laine que l'EG avait laissée sur place */
eq('montant déplacé par l\'outil', d.flux.reduce((a, x) => a + x.mtDepl, 0), 200);

/* 11 — synthèse non importée, lue mais tenue à part */
eq('administration', d.synth.admin, 100);
eq('taxes', d.synth.taxes, 200);

console.log('\nJeu d\'essai synthétique — outils/essais/exemple.csv\n');
ok.forEach(l => console.log('  ok    ' + l));
ech.forEach(l => console.log('  ÉCHEC ' + l));
console.log('\n' + ok.length + ' contrôles réussis, ' + ech.length + ' en échec.\n');
process.exit(ech.length ? 1 : 0);
