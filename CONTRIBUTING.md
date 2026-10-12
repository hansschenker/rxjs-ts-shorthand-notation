# Maintaining the teaching reference

The reference targets **RxJS 7.8.2**. Changes should keep its signatures small, its prose concrete, and its behavior claims traceable to that implementation.

## Edit the source catalog

Change the relevant card in one of these files:

- `catalog/creation.json`
- `catalog/transformation.json`
- `catalog/filtering-join.json`
- `catalog/support.json`

Use `catalog/metadata.json` for the shared legend, glossary, attribution, and category introductions. Use `catalog/scope.json` only when deliberately changing the declared coverage. Preserve a card's stable ID so existing classroom links keep working. The supplied list and supplemental coverage are tracked separately.

Every card needs a named signature, one or two short behavior sentences, two to four execution notes, an example, relevant overload scope, related card IDs, the import path, and the primary implementation path. An API marked deprecated needs a useful migration note. A deprecated overload alone does not make the entire operator deprecated.

## Check meaning before expanding notation

Keep the distinction between a value function and a stream transformation. Pipeable factories usually read `name(configuration): A* => B*`; creation functions take their sources directly. Preserve array, tuple, union, keyed-stream, and nested-stream shapes. The different creation and pipeable APIs with the same name must remain separate.

Describe the common form accurately before adding overloads. A short selector name is useful; several new symbolic rules usually are not. The source links remain the expanded reference for complete declarations.

Check the relevant execution boundaries: readiness, scheduling, source and notifier completion, error, cancellation, sharing, and seed or cache lifetime. Never infer these policies from `A*` alone. A stronger occurrence suffix needs the assumptions listed in [the occurrence guide](docs/cardinality.md).

Follow implementation delegates when needed. For example, scan and reduce share internal machinery, while several join or legacy APIs delegate to another implementation. An API documentation sentence can be inaccurate for the pinned release; record the actual version-specific behavior and add a focused semantic test if it matters for teaching.

## Rebuild and verify

```bash
npm ci
npm run build
npm run check
npm run examples
python3 -m pip install -r requirements-pdf.txt
npm run pdf
```

The catalog/export check catches missing entries and invalid source paths. TypeScript compilation checks the native companion. The semantic tests verify selected behavior contracts with deterministic input sequences and virtual clocks. Add a test when a change resolves a concrete ambiguity or regression; avoid tests that only restate implementation details.

Generated outputs are `docs/operator-reference.md`, `docs/signature-index.md`, `docs/coverage.md`, `docs/catalog.json`, and `docs/index.html`. Rebuild them from the catalog. Rebuild and visually review the PDF after a release change; its script uses the same card data.

For substantive corrections, explain the learner-facing problem, the resulting behavior description, the primary source, and the relevant verification. Keep project credits accurate and preserve the requested attribution footnote.
