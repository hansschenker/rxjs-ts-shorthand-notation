import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { cards, metadata, scope, stats, root, title, categoryId, readJson } from './catalog.mjs';

const check = process.argv.includes('--check');
const generated = [];
function output(path, content) {
  const file = resolve(root, path);
  if (check) {
    let actual;
    try { actual = readFileSync(file, 'utf8'); } catch { throw new Error(`Missing generated file: ${path}; run npm run build`); }
    if (actual !== content) throw new Error(`Generated file is stale: ${path}; run npm run build`);
  } else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  generated.push(path);
}
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
const shortTitle = card => card.id.endsWith('-operator') ? `${card.name} (pipeable)` : card.name;
const status = card => `${card.status === 'deprecated' ? 'Deprecated in 7.8.2' : 'Current API'} · ${card.requested ? 'Requested list' : 'Supplement'}`;
const note = `[^gpt6]: ${metadata.attribution}`;
const counts = scope.categories.map(category => ({
  category,
  all: cards.filter(c => c.category === category).length,
  requested: cards.filter(c => c.category === category && c.requested).length,
}));
const codeBlock = (code, lang = 'text') => '```' + lang + '\n' + code + '\n```';
const legend = '| Notation | Meaning |\n| --- | --- |\n' + metadata.legend.map(([symbol, meaning]) => `| ${cell('`' + symbol + '`')} | ${cell(meaning)} |`).join('\n');
function cardMarkdown(card) {
  const related = card.related.map(id => `[${shortTitle(cards.find(c => c.id === id))}](#${id})`).join(' · ');
  const lines = [
    `<a id="${card.id}"></a>`, `### ${title(card)}`, '',
    `${status(card)} · Import: \`${card.import}\` · API role: ${card.kind}`, '',
    codeBlock(card.signature), '', `**Behavior.** ${card.behavior}`, '', '**Execution details.**', '',
    ...card.details.map(text => `- ${text}`), '',
    '**Example.**', '',
    ['sample', 'sampleTime'].includes(card.id) ? card.example : codeBlock(card.example, 'ts'), '',
  ];
  if (card.overloads) lines.push(`**Scope and overloads.** ${card.overloads}`, '');
  if (card.replacement) lines.push(`**Modern alternative.** ${card.replacement}`, '');
  lines.push(`**References.** [API](${card.doc}) · [RxJS ${scope.rxjsVersion} source](${card.sourceUrl})`, '', `**Compare.** ${related}`, '', '---', '');
  return lines.join('\n');
}
let reference = [
  '# ' + metadata.title, '',
  `**RxJS ${scope.rxjsVersion} · Edition ${metadata.edition} · ${stats.entries} API entries**`, '',
  'A signature shows the shape. The short description supplies the behavior policy. The execution notes explain the boundary cases that matter.[^gpt6]', '',
  metadata.notationSummary, '',
  '**Start here:** [Notation and TypeScript translation](notation.md) · [Teaching guide and exercises](teaching-guide.md) · [Compact signature index](signature-index.md) · [Occurrence refinements](cardinality.md) · [Searchable reference](index.html)', '',
  '## Reading the notation', '', legend, '',
  ...metadata.globalNotes.map(text => '- ' + text), '',
  '## Contents', '',
  ...counts.map(({category, all, requested}) => `- [${category}](#${categoryId(category)}) — ${all} entries (${requested} requested, ${all - requested} supplemental)`), '',
  `Coverage includes every function exported by rxjs/operators in ${scope.rxjsVersion}, all core static creation exports, and the listed related creation APIs. [Exact scope and exclusions](coverage.md).`, '',
].join('\n');
for (const category of scope.categories) {
  reference += `\n<a id="${categoryId(category)}"></a>\n## ${category}\n\n${metadata.categoryIntros[category]}\n\n`;
  reference += cards.filter(c => c.category === category).map(cardMarkdown).join('\n');
}
reference += '\n' + note + '\n';
output('docs/operator-reference.md', reference);

let index = '# Compact signature index\n\nRxJS ' + scope.rxjsVersion + '. Selected common forms; explanatory shorthand, not literal TypeScript.[^gpt6]\n\n';
index += 'Use this for quick comparisons. Read the linked full card before relying on its timing, termination, or sharing policy.\n\n';
for (const category of scope.categories) {
  index += `## ${category}\n\n| API | Shorthand | Behavior |\n| --- | --- | --- |\n`;
  index += cards.filter(c => c.category === category).map(card => `| [${shortTitle(card)}](operator-reference.md#${card.id})${card.status === 'deprecated' ? ' †' : ''}${card.requested ? '' : ' ‡'} | ${cell('`' + card.signature.replaceAll('\n', ' / ') + '`')} | ${cell(card.behavior)} |`).join('\n') + '\n\n';
}
index += '† Deprecated API in the pinned version. ‡ Supplement to the supplied operator list. An operator with only deprecated overloads is not marked deprecated.\n\n' + note + '\n';
output('docs/signature-index.md', index);

// Extract the stored signatures without copying behavior or example prose.
const patternGroups = readJson('catalog/type-patterns.json').groups;
const formsById = new Map(cards.map(card => [card.id, card.signature.split(new RegExp('\\n(?=' + card.name + '\\()'))]));
const expectedForms = new Set([...formsById].flatMap(([id, forms]) => forms.map((_, form) => `${id}:${form}`)));
const seenForms = new Set();
const seenApis = new Set();
const groupIds = new Set();
const patterns = patternGroups.map(group => {
  if (!group.id || groupIds.has(group.id)) throw new Error(`Invalid or duplicate type pattern group: ${group.id}`);
  groupIds.add(group.id);
  const subgroups = group.subgroups.map(subgroup => ({
    ...subgroup,
    signatures: subgroup.members.map(member => {
      const { id, form = 0 } = typeof member === 'string' ? { id: member } : member;
      const key = `${id}:${form}`;
      if (!expectedForms.has(key) || seenForms.has(key)) throw new Error(`Invalid or repeated type pattern signature: ${key}`);
      seenForms.add(key);
      seenApis.add(id);
      return formsById.get(id)[form];
    }),
  }));
  return { ...group, subgroups, count: subgroups.reduce((total, subgroup) => total + subgroup.signatures.length, 0) };
});
const missingForms = [...expectedForms].filter(key => !seenForms.has(key));
if (missingForms.length) throw new Error(`Signatures missing from type patterns: ${missingForms.join(', ')}`);
let typePatterns = [
  '# Cω shorthand grouped by type pattern', '',
  `**RxJS ${scope.rxjsVersion} · ${seenApis.size} API entries · ${seenForms.size} selected signatures · ${patterns.length} pattern families**`, '',
  'The Cω-inspired signatures from the [complete operator reference](operator-reference.md), grouped by input/output shape and the type of the supplied function.[^gpt6]', '',
  '`A*` means `Observable<A>`. `A[]` is one array value, `(A[])*` is a stream of arrays, `[A*, B*]` is a tuple of streams, and `(A*)*` is a stream of streams. [Full notation](notation.md).', '',
  'The signatures are copied verbatim from the catalog. Family patterns summarize their structure. Matching type patterns do not imply matching timing, cancellation, sharing, or termination. The selected `*` suffixes are retained.', '',
  '`timeout` has two selected forms, placed under their respective result shapes. Creation and legacy pipeable APIs with the same name remain separate. Legacy aliases are retained; API status, import paths, and overload scope are in the full reference.', '',
  '## Pattern overview', '',
  '| Family | Main shape | Signatures |',
  '| --- | --- | ---: |',
  ...patterns.map((group, i) => `| [${i + 1}. ${group.title}](#${group.id}) | ${cell('`' + group.pattern + '`')} | ${group.count} |`), '',
].join('\n');
for (const [i, group] of patterns.entries()) {
  typePatterns += `\n<a id="${group.id}"></a>\n## ${i + 1}. ${group.title}\n\n`;
  for (const subgroup of group.subgroups) {
    typePatterns += `### ${subgroup.title}\n\n${codeBlock(subgroup.pattern)}\n\n${codeBlock(subgroup.signatures.join('\n'))}\n\n`;
  }
}
typePatterns += note + '\n';
output('docs/type-patterns.md', typePatterns);

let coverage = `# Coverage and verification scope\n\nPinned implementation: **RxJS ${scope.rxjsVersion}**. This is a complete reference for the declared API surfaces, not every symbol in the RxJS package.[^gpt6]\n\n`;
coverage += `- **${stats.entries}** total entries.\n- **${stats.requested}** entries from the supplied list, including both partition APIs.\n- **${stats.supplemental}** additional entries.\n- **${stats.operatorExports}** function exports from rxjs/operators covered, including legacy aliases.\n- **${stats.creationExports}** core static creation exports, plus animationFrames, EMPTY, NEVER, ajax, fromFetch, and webSocket.\n- The current root-exported onErrorResumeNextWith is included in addition to its legacy pipeable alias.\n- **${stats.deprecated}** entries marked deprecated based on the pinned source.\n\n`;
coverage += '| Category | Requested | Supplement | Total |\n| --- | ---: | ---: | ---: |\n' + counts.map(c => `| ${c.category} | ${c.requested} | ${c.all - c.requested} | ${c.all} |`).join('\n') + '\n\n';
coverage += '## Verification layers\n\n1. Every card was authored and reviewed against its linked RxJS 7.8.2 implementation. Runtime implementations take precedence over an inaccurate documentation sentence.\n2. The catalog check compares required IDs and frozen export lists with the installed package, verifies source files and runtime exports, and validates the card structure.\n3. Strict TypeScript compilation checks the native companion and selected six motivating signatures. It does not compile the shorthand or recreate all overloads.\n4. Named runtime tests exercise selected teaching boundaries: empty sources, notifier completion, scheduling, flattening policies, accumulation, and sharing. They are representative semantic checks, not exhaustive testing of every overload or every possible source.\n5. A deterministic build check compares the generated Markdown, HTML, and compiled catalog with their source data. The PDF has a separate rebuild and visual review step.\n\n';
coverage += '## Supplemental entries\n\n' + cards.filter(c => !c.requested).map(c => `- [${title(c)}](operator-reference.md#${c.id}) — ${c.category}`).join('\n') + '\n\n';
coverage += '## Deliberate exclusions\n\n' + scope.exclusions.map(text => '- ' + text).join('\n') + '\n\n';
coverage += '## Reproduce\n\n' + codeBlock('npm ci\nnpm run build\nnpm run check\n# Optional: install the PDF requirements and regenerate the handbook\npython3 -m pip install -r requirements-pdf.txt\nnpm run pdf', 'bash') + '\n\n';
coverage += `Primary inventories: [operators exports](https://github.com/ReactiveX/rxjs/blob/${scope.rxjsVersion}/src/operators/index.ts) · [root exports](https://github.com/ReactiveX/rxjs/blob/${scope.rxjsVersion}/src/index.ts).\n\n` + note + '\n';
output('docs/coverage.md', coverage);
output('docs/catalog.json', JSON.stringify({ metadata, stats, categories: scope.categories, operators: cards }, null, 2) + '\n');

function htmlCard(card) {
  const information = card.details.map(t => `<li>${esc(t)}</li>`).join('');
  const example = ['sample', 'sampleTime'].includes(card.id) ? `<p class="example-prose">${esc(card.example)}</p>` : `<pre class="example"><code>${esc(card.example)}</code></pre>`;
  return `<article id="${card.id}" class="card" data-category="${esc(card.category)}" data-status="${card.status}" data-scope="${card.requested ? 'requested' : 'supplement'}">
  <header class="card-header"><h3><a href="#${card.id}">${esc(title(card))}</a></h3><span class="tag ${card.status}">${card.status === 'deprecated' ? 'Legacy API' : esc(card.kind)}</span>${card.requested ? '' : '<span class="tag supplement">Supplement</span>'}</header>
  <pre class="signature"><code>${esc(card.signature)}</code></pre>
  <p class="behavior">${esc(card.behavior)}</p>
  <details class="execution" open><summary>Execution details &amp; example</summary><ul>${information}</ul>${example}
  ${card.overloads ? `<p class="scope-note"><strong>Scope &amp; overloads.</strong> ${esc(card.overloads)}</p>` : ''}
  ${card.replacement ? `<p class="replacement"><strong>Modern alternative.</strong> ${esc(card.replacement)}</p>` : ''}</details>
  <footer class="card-footer"><span>Import <code>${esc(card.import)}</code></span><span><a href="${card.doc}">API</a> · <a href="${card.sourceUrl}">Source · 7.8.2</a></span></footer>
  <p class="related">Compare ${card.related.map(id => `<a href="#${id}">${esc(shortTitle(cards.find(c => c.id === id)))}</a>`).join(' · ')}</p>
  </article>`;
}
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(metadata.title)}</title>
<meta name="description" content="147 concise RxJS 7.8.2 operator signatures with behavior notes for RxJS Deep Dive. Self-contained and usable offline.">
<style>
:root{--ink:#17273f;--muted:#596579;--line:#d9dfe7;--paper:#f5f6fa;--white:#fff;--accent:#a72265;--accent-soft:#faedf4;--blue:#163d64;--code:#eef3f9;--gold:#78571b;--gold-soft:#fbf1dc}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:160px}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--accent);text-underline-offset:3px}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #397eae;outline-offset:4px}.skip{position:absolute;top:-80px;left:10px;background:white;padding:10px;z-index:30}.skip:focus{top:10px}.masthead{padding:42px max(24px,calc((100vw - 1480px)/2));background:var(--ink);color:white}.eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#efaacb;font-weight:750}.masthead h1{margin:8px 0 12px;font-size:clamp(30px,4vw,48px);line-height:1.16;font-weight:750;max-width:900px}.masthead p{max-width:870px;margin:0;color:#d8e1ef;font-size:18px}.masthead a{color:#fff}.metrics{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.metric{padding:7px 12px;background:#ffffff10;border:1px solid #ffffff26;border-radius:6px;font-size:13px}.toolbar{position:sticky;top:0;z-index:10;background:#fffffff5;border-bottom:1px solid var(--line);backdrop-filter:blur(10px);padding:14px 24px}.controls{max-width:1432px;margin:auto;display:grid;grid-template-columns:minmax(220px,1fr) 210px 170px auto;gap:12px;align-items:end}.controls>label{min-width:0}.controls input,.controls select{width:100%;min-width:0}label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:750;letter-spacing:.07em;text-transform:uppercase}input,select,button{font:inherit;border:1px solid #bcc5d2;border-radius:6px;background:white;color:var(--ink);padding:10px 12px;min-height:44px}input,select{font-size:14px;letter-spacing:0;text-transform:none}button{cursor:pointer;font-size:13px;font-weight:650}button:hover{background:var(--code)}.results-line{max-width:1432px;margin:9px auto 0;display:flex;gap:16px;flex-wrap:wrap;justify-content:space-between;color:var(--muted);font-size:12px}.layout{max-width:1480px;margin:auto;display:grid;grid-template-columns:235px minmax(0,1fr);gap:34px;padding:30px 24px 70px}.sidebar{position:sticky;top:155px;align-self:start;max-height:calc(100vh - 180px);overflow:auto}.sidebar h2{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:0 0 12px}.sidebar a{display:flex;justify-content:space-between;gap:7px;padding:8px 10px;margin:3px 0;text-decoration:none;font-size:13px;color:var(--ink);border-radius:5px}.sidebar a:hover{background:var(--accent-soft);color:var(--accent)}.sidebar .count{color:var(--muted);font-size:11px}.sidebar hr{border:0;border-top:1px solid var(--line);margin:16px 0}.sidebar .resource{font-weight:600;color:var(--accent)}.intro{border:1px solid var(--line);border-radius:10px;background:white;padding:23px 26px;margin-bottom:30px}.intro h2{font-size:20px;margin:0 0 10px}.intro p{margin:8px 0 14px}.intro details{margin:12px 0 0}summary{cursor:pointer;font-weight:650}.legend{width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px;margin-top:16px}.legend td,.legend th{overflow-wrap:anywhere;padding:10px 12px;vertical-align:top;border-bottom:1px solid var(--line);text-align:left}.legend th{font-weight:650;background:var(--code)}.legend th:first-child,.legend td:first-child{width:190px}code{font-family:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;font-size:.92em}h2.category-title{font-size:27px;margin:34px 0 4px;letter-spacing:-.025em}.category-intro{margin:0 0 18px;color:var(--muted);max-width:850px}.card{background:white;border:1px solid var(--line);border-radius:10px;padding:24px 28px;margin:0 0 20px;box-shadow:0 2px 3px #17273f03;scroll-margin-top:155px}.card-header{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:13px}.card h3{margin:0 auto 0 0;font-size:22px;line-height:1.2}.card h3 a{text-decoration:none;color:var(--ink)}.tag{display:inline-block;border-radius:4px;padding:3px 7px;font-size:10px;font-weight:700;letter-spacing:.04em;background:var(--code);color:var(--blue);text-transform:uppercase}.tag.deprecated{background:var(--gold-soft);color:var(--gold)}.tag.supplement{background:var(--accent-soft);color:var(--accent)}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0;tab-size:2}.signature{padding:14px 16px;border-left:3px solid var(--accent);background:var(--code);color:var(--blue);font-size:15px;line-height:1.6;border-radius:0 5px 5px 0}.behavior{font-size:16px;margin:14px 0 16px;max-width:970px}.execution{font-size:14px}.execution summary{font-size:12px;color:var(--muted);padding-bottom:4px}.execution ul{padding-left:20px}.execution li{padding-left:3px;margin:7px 0}.example{font-size:13px;background:#f6f7fa;border:1px solid #e3e6ed;border-radius:5px;padding:13px 15px;color:#2e435a}.example-prose{background:#f6f7fa;padding:13px 15px;border-left:2px solid var(--line)}.scope-note{font-size:12px;color:var(--muted)}.replacement{font-size:13px;background:var(--gold-soft);padding:10px 13px;border-radius:5px}.card-footer{font-size:11px;color:var(--muted);display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;border-top:1px solid #e7ebf1;padding-top:12px;margin-top:15px}.related{font-size:11px;color:var(--muted);margin:8px 0 0}.credits{margin-top:35px;padding:20px 0;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}#no-results{padding:40px;text-align:center;background:white;border-radius:10px;border:1px solid var(--line)}[hidden]{display:none!important}.print-note{display:none}
@media(max-width:1000px){.layout{grid-template-columns:185px minmax(0,1fr);gap:20px}.controls{grid-template-columns:1fr 180px 150px}.controls button{grid-column:1/-1}.sidebar{top:205px}.card{padding:20px}.masthead{padding:30px 24px}.card h3{font-size:20px}html{scroll-padding-top:205px}}
@media(max-width:720px){.layout{display:block;padding:20px 14px}.sidebar{position:static;max-height:none;margin-bottom:25px;display:none}.controls{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.controls label:first-child{grid-column:1/-1}.toolbar{position:static;padding:12px 14px}.controls button{grid-column:auto}.controls label{font-size:10px}.card{padding:18px}.signature{font-size:13px}.masthead{padding:30px 20px}.masthead p{font-size:16px}.intro{padding:20px}.legend{font-size:12px}.legend td{padding:8px 5px}.legend th:first-child,.legend td:first-child{width:130px}.card{scroll-margin-top:15px}html{scroll-padding-top:20px}}
@media print{body{background:white;font-size:10pt}.skip,.toolbar,.sidebar,.resource-links{display:none!important}.masthead{background:white;color:#17273f;padding:0 0 18px;border-bottom:2px solid #a72265}.masthead p,.eyebrow{color:#17273f}.masthead h1{font-size:26pt}.metrics{margin-top:10px;gap:8px}.metric{padding:0;border:0;font-size:9pt}.layout{display:block;padding:16px 0;max-width:none}.intro{padding:15px;border-radius:0;margin-bottom:20px}.card{break-inside:avoid;box-shadow:none;padding:14px 16px;margin-bottom:14px;border-radius:0}.card h3{font-size:15pt}.signature{font-size:10pt;background:#f3f5f9;padding:10px}.behavior{font-size:10pt}.execution{font-size:9pt}.execution summary{display:none}.example{font-size:8pt}.scope-note,.card-footer,.related{font-size:8pt}.category-title{break-after:avoid}.category-intro{break-after:avoid}.credits{font-size:8pt}.print-note{display:block;font-size:9pt}.card-footer a{color:#17273f}a{color:#17273f}.tag{font-size:7pt}@page{size:A4;margin:16mm}}
</style></head><body>
<a class="skip" href="#reference">Skip to operator reference</a>
<header class="masthead"><div class="eyebrow">RxJS Deep Dive / Edition ${esc(metadata.edition)}</div><h1>Stream shapes.<br>Operator behavior.</h1><p>A compact type signature, a short explanation, and the execution details that make the difference.</p><div class="metrics"><span class="metric">RxJS ${scope.rxjsVersion}</span><span class="metric">${stats.entries} entries</span><span class="metric">${stats.requested} requested + ${stats.supplemental} supplemental</span><span class="metric">Cω-inspired · TypeScript-translatable</span></div><p class="print-note">${esc(metadata.notationSummary)}</p></header>
<div class="toolbar"><div class="controls"><label>Find an operator or behavior<input id="search" type="search" placeholder="Try switchMap, completion, or replay" autocomplete="off"></label><label>Category<select id="category"><option value="">All categories</option>${scope.categories.map(c => `<option>${esc(c)}</option>`).join('')}</select></label><label>Show<select id="scope"><option value="all">All entries</option><option value="requested">Requested list</option><option value="supplement">Supplement</option><option value="current">Current APIs</option><option value="deprecated">Legacy APIs</option></select></label><button id="toggle-details" type="button" aria-pressed="false">Compact view</button></div><div class="results-line"><span id="result-count" aria-live="polite">${stats.entries} entries</span><span><button id="reset" type="button">Reset filters</button> <button id="print" type="button">Print visible entries</button></span></div></div>
<div class="layout"><aside class="sidebar"><h2>Operator families</h2>${counts.map(c => `<a href="#${categoryId(c.category)}">${esc(c.category.replace(' Operators', ''))}<span class="count">${c.all}</span></a>`).join('')}<hr><a class="resource" href="operator-reference.md">Full Markdown reference</a><a class="resource" href="teaching-guide.md">Teaching guide</a><a class="resource" href="../output/pdf/rxjs-deep-dive-handbook.pdf">Printable handbook</a><a class="resource" href="${metadata.repository}">GitHub repository</a></aside>
<main id="reference"><section class="intro"><h2>Read the shape, then the policy.</h2><p><code>A*</code> means <code>Observable&lt;A&gt;</code>. A signature such as <code>map(project: A =&gt; B): A* =&gt; B*</code> makes the value function and the stream transformation visible together.</p><p>${esc(metadata.notationSummary)} The core signatures use <code>*</code> conservatively; <code>!</code>, <code>?</code>, and <code>+</code> are optional, qualified occurrence refinements.</p><details id="notation"><summary>Notation legend and shared assumptions</summary><table class="legend"><thead><tr><th>Symbol</th><th>Meaning</th></tr></thead><tbody>${metadata.legend.map(([s,m]) => `<tr><td><code>${esc(s)}</code></td><td>${esc(m)}</td></tr>`).join('')}</tbody></table><ul>${metadata.globalNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ul><h3>Configuration and result types</h3><table class="legend"><tbody>${metadata.glossary.map(([term, meaning]) => `<tr><td><code>${esc(term)}</code></td><td>${esc(meaning)}</td></tr>`).join('')}</tbody></table><p>The <a href="notation.md">full notation guide</a> explains the TypeScript translation. Full overloads remain in each entry's linked API and source.</p></details></section>
<div id="no-results" hidden>No entries match these filters. Try another term or reset the filters.</div>
${scope.categories.map(category => `<section class="category-section" id="${categoryId(category)}"><h2 class="category-title">${esc(category)}</h2><p class="category-intro">${esc(metadata.categoryIntros[category])}</p>${cards.filter(c => c.category === category).map(htmlCard).join('\n')}</section>`).join('\n')}
<footer class="credits"><p><sup>1</sup> ${esc(metadata.attribution)}</p><p>Original inspiration: Erik Meijer's Cω notation. RxJS behavior is grounded in the linked RxJS 7.8.2 implementations. This reference does not change or implement RxJS.</p><p><a href="${metadata.repository}">rxjs-ts-shorthand-notation</a> · <a href="coverage.md">Coverage and verification</a> · <a href="notation.md">Notation conventions</a></p></footer></main></div>
<script>
const entries = [...document.querySelectorAll('.card')];
const sections = [...document.querySelectorAll('.category-section')];
const search = document.querySelector('#search');
const category = document.querySelector('#category');
const scope = document.querySelector('#scope');
const count = document.querySelector('#result-count');
let compact = false;
const searchable = new Map(entries.map(entry => [entry, entry.textContent.toLowerCase()]));
function filter() {
  const terms = search.value.trim().toLowerCase().split(/\\s+/).filter(Boolean);
  let visible = 0;
  for (const entry of entries) {
    const matchesCategory = !category.value || entry.dataset.category === category.value;
    const matchesScope = scope.value === 'all' || entry.dataset.scope === scope.value || entry.dataset.status === scope.value;
    const matchesText = terms.every(term => searchable.get(entry).includes(term));
    entry.hidden = !(matchesCategory && matchesScope && matchesText);
    if (!entry.hidden) visible++;
  }
  for (const section of sections) section.hidden = ![...section.querySelectorAll('.card')].some(entry => !entry.hidden);
  count.textContent = visible + ' of ' + entries.length + ' entries';
  document.querySelector('#no-results').hidden = visible !== 0;
}
function resetFilters() { search.value = ''; category.value = ''; scope.value = 'all'; filter(); }
search.addEventListener('input', filter);
category.addEventListener('change', filter);
scope.addEventListener('change', filter);
document.querySelector('#reset').addEventListener('click', resetFilters);
document.querySelector('#toggle-details').addEventListener('click', function() {
  compact = !compact;
  document.querySelectorAll('.execution').forEach(detail => detail.open = !compact);
  this.textContent = compact ? 'Show execution details' : 'Compact view';
  this.setAttribute('aria-pressed', String(compact));
});
let printState = null;
window.addEventListener('beforeprint', () => {
  if (printState) return;
  printState = [...document.querySelectorAll('.execution')].map(detail => [detail, detail.open]);
  printState.forEach(([detail]) => detail.open = true);
});
window.addEventListener('afterprint', () => { if (printState) printState.forEach(([detail, open]) => detail.open = open); printState = null; });
document.querySelector('#print').addEventListener('click', () => window.print());
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
});
function revealHash() {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!target || (!target.classList.contains('card') && !target.classList.contains('category-section'))) return;
  if (target.hidden || target.closest('[hidden]')) resetFilters();
  requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
window.addEventListener('hashchange', revealHash);
revealHash();
</script></body></html>\n`;
output('docs/index.html', html.replace(/^[\t ]+$/gm, ''));
console.log(`${check ? 'Verified' : 'Built'} ${generated.length} generated files for ${stats.entries} entries.`);
