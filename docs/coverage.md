# Coverage and verification scope

Pinned implementation: **RxJS 7.8.2**. This is a complete reference for the declared API surfaces, not every symbol in the RxJS package.[^gpt6]

- **147** total entries.
- **112** entries from the supplied list, including both partition APIs.
- **35** additional entries.
- **113** function exports from rxjs/operators covered, including legacy aliases.
- **27** core static creation exports, plus animationFrames, EMPTY, NEVER, ajax, fromFetch, and webSocket.
- The current root-exported onErrorResumeNextWith is included in addition to its legacy pipeable alias.
- **27** entries marked deprecated based on the pinned source.

| Category | Requested | Supplement | Total |
| --- | ---: | ---: | ---: |
| Creation Operators | 15 | 9 | 24 |
| Join Creation Operators | 7 | 1 | 8 |
| Transformation Operators | 28 | 1 | 29 |
| Filtering Operators | 25 | 0 | 25 |
| Join Operators | 7 | 13 | 20 |
| Multicasting Operators | 6 | 4 | 10 |
| Error Handling Operators | 3 | 2 | 5 |
| Utility Operators | 12 | 3 | 15 |
| Conditional and Boolean Operators | 5 | 2 | 7 |
| Mathematical and Aggregate Operators | 4 | 0 | 4 |

## Verification layers

1. Every card was authored and reviewed against its linked RxJS 7.8.2 implementation. Runtime implementations take precedence over an inaccurate documentation sentence.
2. The catalog check compares required IDs and frozen export lists with the installed package, verifies source files and runtime exports, and validates the card structure.
3. Strict TypeScript compilation checks the native companion and selected six motivating signatures. It does not compile the shorthand or recreate all overloads.
4. Named runtime tests exercise selected teaching boundaries: empty sources, notifier completion, scheduling, flattening policies, accumulation, and sharing. They are representative semantic checks, not exhaustive testing of every overload or every possible source.
5. A deterministic build check compares the generated Markdown, HTML, and compiled catalog with their source data. The PDF has a separate rebuild and visual review step.

## Supplemental entries

- [animationFrames](operator-reference.md#animationFrames) — Creation Operators
- [EMPTY](operator-reference.md#EMPTY) — Creation Operators
- [fromFetch](operator-reference.md#fromFetch) — Creation Operators
- [never](operator-reference.md#never) — Creation Operators
- [NEVER](operator-reference.md#NEVER) — Creation Operators
- [pairs](operator-reference.md#pairs) — Creation Operators
- [scheduled](operator-reference.md#scheduled) — Creation Operators
- [using](operator-reference.md#using) — Creation Operators
- [webSocket](operator-reference.md#webSocket) — Creation Operators
- [onErrorResumeNext](operator-reference.md#onErrorResumeNext) — Join Creation Operators
- [flatMap](operator-reference.md#flatMap) — Transformation Operators
- [combineAll](operator-reference.md#combineAll) — Join Operators
- [combineLatest (legacy pipeable form)](operator-reference.md#combineLatest-operator) — Join Operators
- [combineLatestWith](operator-reference.md#combineLatestWith) — Join Operators
- [concat (legacy pipeable form)](operator-reference.md#concat-operator) — Join Operators
- [concatWith](operator-reference.md#concatWith) — Join Operators
- [endWith](operator-reference.md#endWith) — Join Operators
- [merge (legacy pipeable form)](operator-reference.md#merge-operator) — Join Operators
- [mergeWith](operator-reference.md#mergeWith) — Join Operators
- [race (legacy pipeable form)](operator-reference.md#race-operator) — Join Operators
- [raceWith](operator-reference.md#raceWith) — Join Operators
- [zip (legacy pipeable form)](operator-reference.md#zip-operator) — Join Operators
- [zipAll](operator-reference.md#zipAll) — Join Operators
- [zipWith](operator-reference.md#zipWith) — Join Operators
- [connect](operator-reference.md#connect) — Multicasting Operators
- [connectable](operator-reference.md#connectable) — Multicasting Operators
- [refCount](operator-reference.md#refCount) — Multicasting Operators
- [shareReplay](operator-reference.md#shareReplay) — Multicasting Operators
- [onErrorResumeNext (legacy pipeable form)](operator-reference.md#onErrorResumeNext-operator) — Error Handling Operators
- [onErrorResumeNextWith](operator-reference.md#onErrorResumeNextWith) — Error Handling Operators
- [finalize](operator-reference.md#finalize) — Utility Operators
- [repeat](operator-reference.md#repeat) — Utility Operators
- [repeatWhen](operator-reference.md#repeatWhen) — Utility Operators
- [sequenceEqual](operator-reference.md#sequenceEqual) — Conditional and Boolean Operators
- [throwIfEmpty](operator-reference.md#throwIfEmpty) — Conditional and Boolean Operators

## Deliberate exclusions

- Observable and Subject classes
- Subscription and Subscriber classes
- Scheduler instances and classes
- Error classes
- firstValueFrom and lastValueFrom (Promise conversion helpers)
- pipe, identity, noop, isObservable and other general utilities
- Internal and test-only operators
- The exhaustive overload set of each public API

## Reproduce

```bash
npm ci
npm run build
npm run check
# Optional: install the PDF requirements and regenerate the handbook
python3 -m pip install -r requirements-pdf.txt
npm run pdf
```

Primary inventories: [operators exports](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/operators/index.ts) · [root exports](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/index.ts).

[^gpt6]: These definitions and teaching notes were created with the help of GPT-6 Astra, under the course direction of Hans Schenker.
