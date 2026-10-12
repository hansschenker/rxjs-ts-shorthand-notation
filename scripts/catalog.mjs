import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const readJson = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
export const scope = readJson('catalog/scope.json');
export const metadata = readJson('catalog/metadata.json');
export const catalogFiles = ['creation', 'transformation', 'filtering-join', 'support'];
const requested = new Set(Object.values(scope.requested).flat());
export const cards = catalogFiles.flatMap(name => readJson(`catalog/${name}.json`)).map(card => ({
  ...card,
  requested: requested.has(card.id),
  sourceUrl: `https://github.com/ReactiveX/rxjs/blob/${scope.rxjsVersion}/src/${card.source}`,
})).sort((a, b) => {
  const categoryDifference = scope.categories.indexOf(a.category) - scope.categories.indexOf(b.category);
  if (categoryDifference) return categoryDifference;
  const order = scope.requested[a.category];
  const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
  return (ai < 0 ? 1000 : ai) - (bi < 0 ? 1000 : bi) || a.id.localeCompare(b.id, 'en');
});

export const stats = {
  entries: cards.length,
  requested: cards.filter(card => card.requested).length,
  supplemental: cards.filter(card => !card.requested).length,
  deprecated: cards.filter(card => card.status === 'deprecated').length,
  operatorExports: scope.operatorExports.length,
  creationExports: scope.creationExports.length,
};
export const categoryId = title => title.toLowerCase().replaceAll(' ', '-');
export const title = card => card.id.endsWith('-operator') ? `${card.name} (legacy pipeable form)` : card.name;
