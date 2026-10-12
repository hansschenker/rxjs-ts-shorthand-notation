import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { cards, metadata, scope, stats } from './catalog.mjs';

const require = createRequire(import.meta.url);
const rxjsPath = dirname(require.resolve('rxjs/package.json'));
const version = JSON.parse(readFileSync(resolve(rxjsPath, 'package.json'), 'utf8')).version;
assert.equal(version, scope.rxjsVersion, 'The installed RxJS version must match the catalog');
assert.equal(metadata.rxjsVersion, scope.rxjsVersion);
const ids = new Set(cards.map(card => card.id));
assert.equal(ids.size, cards.length, 'Duplicate card IDs');
const modules = new Map();
for (const card of cards) {
  for (const field of ['id', 'name', 'category', 'kind', 'status', 'signature', 'behavior', 'source', 'doc', 'import']) {
    assert.equal(typeof card[field], 'string', `${card.id}: missing ${field}`);
    assert.ok(card[field].trim(), `${card.id}: empty ${field}`);
  }
  assert.ok(scope.categories.includes(card.category), `${card.id}: unknown category`);
  assert.ok(['current', 'deprecated'].includes(card.status), `${card.id}: unknown status`);
  assert.ok(['creation', 'join-creation', 'pipeable', 'partition', 'connectable', 'constant'].includes(card.kind), `${card.id}: unknown kind`);
  assert.ok(card.details.length >= 2 && card.details.length <= 4, `${card.id}: expected 2-4 execution notes`);
  assert.ok(card.example.length > 0, `${card.id}: example missing`);
  assert.ok(existsSync(resolve(rxjsPath, 'src', card.source)), `${card.id}: source does not exist in installed package`);
  if (card.status === 'deprecated') assert.ok(card.replacement, `${card.id}: migration note missing`);
  for (const id of card.related) assert.ok(ids.has(id), `${card.id}: missing related card ${id}`);
  if (card.kind === 'pipeable') assert.match(card.signature, /\):[\s\S]*=>/, `${card.id}: missing source-to-result arrow`);
  assert.match(card.doc, /^https:\/\/rxjs\.dev\//);
  if (!modules.has(card.import)) modules.set(card.import, await import(card.import));
  assert.ok(card.name in modules.get(card.import), `${card.id}: absent runtime export ${card.import}/${card.name}`);
}

for (const [category, names] of Object.entries(scope.requested)) {
  for (const id of names) {
    const card = cards.find(c => c.id === id);
    assert.ok(card, `Requested card missing: ${id}`);
    assert.equal(card.category, category, `Requested category changed: ${id}`);
  }
}
const operators = await import('rxjs/operators');
const publicOperators = Object.keys(operators).filter(key => typeof operators[key] === 'function').sort();
assert.deepEqual(publicOperators, [...scope.operatorExports].sort(), 'RxJS operator export inventory changed');
for (const name of publicOperators) {
  const collision = ['combineLatest', 'concat', 'merge', 'onErrorResumeNext', 'partition', 'race', 'zip'].includes(name);
  assert.ok(ids.has(collision ? `${name}-operator` : name), `Operator export missing: ${name}`);
}
for (const name of [...scope.creationExports, ...scope.relatedCreationExports, 'onErrorResumeNextWith']) {
  assert.ok(ids.has(name), `Public creation or additional operator API missing: ${name}`);
}
const expectedIds = new Set([
  ...publicOperators.map(name => ['combineLatest', 'concat', 'merge', 'onErrorResumeNext', 'partition', 'race', 'zip'].includes(name) ? `${name}-operator` : name),
  ...scope.creationExports, ...scope.relatedCreationExports, 'onErrorResumeNextWith',
]);
assert.deepEqual([...ids].sort(), [...expectedIds].sort(), 'Catalog and documented public API scope differ');
console.log(`RxJS ${version}: ${stats.entries} entries verified; ${stats.requested} requested + ${stats.supplemental} supplemental; all ${stats.operatorExports} rxjs/operators function exports covered.`);
