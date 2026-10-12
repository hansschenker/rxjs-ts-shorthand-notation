# rxjs-ts-shorthand-notation

## RxJS Deep Dive: stream shapes and operator behavior

**147 teaching entries for RxJS 7.8.2**, each with a compact stream signature, a short behavior description, execution details, an example, and links to the corresponding API and pinned implementation.[^gpt6]

The notation is inspired by Erik Meijer's Cω type notation and adapted to familiar TypeScript payload shapes. Its purpose is to make an operator's type relationship easy to see, then explain the behavior that the type alone cannot express.

```text
map(project: A => B): A* => B*
filter(predicate: A => boolean): A* => A*
scan(reducer: (S, A) => S, seed: S): A* => S*
debounceTime(dueTime: number, scheduler?: SchedulerLike): A* => A*
combineLatest(sources: [A*, B*]): [A, B]*
switchMap(project: A => B*): A* => B*
```

`A*` means `Observable<A>`. The shorthand **translates into TypeScript**; it is not additional syntax accepted by the TypeScript compiler. The repository includes an ordinary TypeScript companion checked against the actual RxJS functions.

## Start teaching

| Artifact | Use it for |
| --- | --- |
| **[Complete operator reference](docs/operator-reference.md)** | Read every card directly on GitHub; link students to an individual operator. |
| **[Printable handbook](output/pdf/rxjs-deep-dive-handbook.pdf)** | Teach or annotate the complete reference as a PDF, including notation, category navigation, and a glossary. |
| **[Searchable reference](docs/index.html)** | Search by operator or behavior, filter by category or API status, switch to compact signatures, and print the visible selection. Download the file and open it in a browser; no server or internet connection is required for its content and controls. |
| **[Compact signature index](docs/signature-index.md)** | Compare related type shapes at a glance. |
| **[Teaching guide and exercises](docs/teaching-guide.md)** | Follow Intuition → Specification → Verification, with comparison tables and seven exercises with answers. |
| **[Notation and TypeScript translation](docs/notation.md)** | Introduce the grammar, the role of parameter names, and the boundaries of the shorthand. |
| **[Occurrence refinements](docs/cardinality.md)** | Teach `T?`, `T!`, and `T+` with explicit subscription and termination assumptions. |
| **[Native TypeScript examples](examples/notation.ts)** | Check and execute the six motivating signatures and the important payload/stream distinctions. |
| **[Coverage and verification](docs/coverage.md)** | Inspect the exact scope, supplemental entries, and validation method. |

GitHub displays the HTML file as source. To use the interactive reference, download the repository ZIP or the raw HTML file and open `docs/index.html` locally. The complete operator content is embedded in that one file. Its links to the other course files work when the repository directory is kept together.

## The card format

### map

```text
map(project: A => B): A* => B*
```

**Behavior.** Apply the value function to each source value and emit its result.

**Execution detail.** `map` adds no scheduling or flattening policy. If the value function returns a stream, that stream becomes an emitted value: the result has shape `(B*)*`. [Full map card](docs/operator-reference.md#map)

### scan

```text
scan(reducer: (S, A) => S, seed: S): A* => S*
```

**Behavior.** Update the current state with each input and emit each updated state.

**Execution detail.** The seed initializes the state but is not emitted. An empty source produces no state values; a supplied object seed is not cloned. [Full scan card](docs/operator-reference.md#scan)

### combineLatest

```text
combineLatest(sources: [A*, B*]): [A, B]*
```

**Behavior.** Once both sources have supplied a value, every new value from either source produces a tuple of their latest values.

**Execution detail.** The tuple of sources on the left is different from the stream of tuples on the right. Readiness and completion remain part of the behavior description. [Full combineLatest card](docs/operator-reference.md#combineLatest)

### switchMap

```text
switchMap(project: A => B*): A* => B*
```

**Behavior.** Each new outer value replaces the current inner subscription with the stream selected by the value function.

**Execution detail.** The previous inner is unsubscribed. Whether that also aborts underlying external work depends on the inner's teardown; outer completion waits for the current inner. [Full switchMap card](docs/operator-reference.md#switchMap)

All 147 entries follow this format, adding examples, relevant overload scope, import paths, and migration notes where appropriate. Deprecated aliases remain available for understanding existing RxJS 7 code.

## What “all operators” means here

The supplied list contains **112 API entries**, counting creation `partition` and legacy pipeable `partition` separately. All are included, in the supplied categories. An additional **35 entries** cover omissions and relevant creation APIs.

The coverage check accounts for every one of the **113 function exports in `rxjs/operators` in 7.8.2**, all **27 core static creation exports**, `animationFrames`, `EMPTY`, `NEVER`, `ajax`, `fromFetch`, `webSocket`, and the current root-exported `onErrorResumeNextWith` name. Same-named creation and legacy pipeable APIs have separate IDs, signatures, and import paths. [Exact coverage](docs/coverage.md) · [Pinned operator inventory](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/operators/index.ts) · [Pinned root inventory](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/index.ts)

The scope is operator and creation behavior. It does not attempt to turn Subject classes, schedulers, error constructors, Promise-conversion helpers, or every utility symbol into operator cards. The reference selects common overloads and identifies important alternatives; it does not reproduce the exhaustive declaration set.

## Teaching principles

**Make shape visible.** Keep `A[]`, `(A[])*`, `[A*, B*]`, `[A, B]*`, and `(A*)*` distinct. The same letters show a relationship between input and output types.

**Keep policy beside the signature.** `mergeMap`, `concatMap`, `switchMap`, and `exhaustMap` share a broad type shape and choose different Action Policies. Similarly, `filter`, `debounceTime`, and `sample` can all have `A* => A*` without having the same behavior.

**Name the boundary conditions.** A notifier's next and complete notifications can have different effects. An empty source, a never-completing source, an error, and downstream cancellation are different cases. Sharing and replay require an explicit connection policy.

**Separate value functions from execution policy.** Domain functions express the transformation or decision. Operators arrange subscription, selection, accumulation, timing, and combination around those functions. Moving a projector into a separate `map` can change when or whether it runs, so matching type shapes are not a proof of behavioral equivalence. [Teaching guide](docs/teaching-guide.md)

## Verify and regenerate

Requirements for the main checks: **Node.js 20 or later** and npm. RxJS and TypeScript versions are pinned in the lockfile.

```bash
npm ci
npm run build
npm run check
npm run examples
```

`npm run check` runs catalog/export verification, strict TypeScript compilation, **45 named semantic tests**, and a deterministic generated-file check. Timed behavior tests use the RxJS TestScheduler; they do not depend on wall-clock sleeps, external requests, or a browser.

The tests target teaching boundaries such as seeded accumulation, notifier completion, empty joins, inner cancellation, projection timing, sharing resets, and retained replay caches. They provide repeatable evidence for those cases. They are not exhaustive testing of all 147 APIs, all overloads, or every possible Observable execution.

To regenerate the printable handbook, use Python 3.10 or later and its listed dependencies:

```bash
python3 -m pip install -r requirements-pdf.txt
npm run pdf
```

The PDF requires DejaVu Sans and Sans Mono fonts and embeds them in the result. On Debian/Ubuntu, install fonts-dejavu-core; elsewhere, set RXJS_PDF_FONT_DIR to a directory containing the required font files. The handbook includes category bookmarks, a linked contents list, API/source links, a glossary, and an alphabetical index. Generated Markdown, HTML, and the compiled catalog are committed so learners can read the course material without installing dependencies.

## Edit the reference

The source of truth is the four JSON card files in `catalog/`. Each card contains the signature, short behavior description, execution notes, example, overload scope, related operators, and its primary source path. Shared teaching conventions and glossary text live in `catalog/metadata.json`; the scope checklist lives in `catalog/scope.json`.

Edit a source card, regenerate the reference, run the checks, and rebuild the PDF when publishing an updated edition. Do not edit generated cards directly in Markdown or HTML. [Contribution guide](CONTRIBUTING.md)

## Attribution

**The main contributor to this project is GPT-6 Astra.** GPT-6 Astra provided AI-assisted drafting, notation development, implementation-source analysis, teaching explanations, and validation code. **Hans Schenker** provides course direction and owns the project for **RxJS Deep Dive**. See [the contributor list](CONTRIBUTORS.md).

The original visual inspiration belongs to **Erik Meijer and the Cω work**. See the [supplied presentation around 14:46](https://www.youtube.com/watch?v=HRCEcTeStvQ&t=886s) and [Unifying Tables, Objects and Documents](https://csaws.cs.technion.ac.il/~oshmu/seminar2005/c-omega%20UnifyingTablesObjectsAndDocuments(DPCOOL2003).pdf). The implementation behavior and public API belong to the **RxJS project and its contributors**; every card links to their corresponding 7.8.2 source.

The commit history records AI assistance with a `Co-authored-by` trailer naming GPT-6 Astra. This is an attribution statement, not a claim that a model has a separate verified GitHub account. GitHub's automatic contributor display depends on account/email association. [GitHub co-author documentation](https://docs.github.com/en/pull-requests/how-tos/commit-changes/creating-a-commit-with-multiple-authors)

[^gpt6]: These definitions and teaching notes were created with the help of GPT-6 Astra, under the course direction of Hans Schenker.
