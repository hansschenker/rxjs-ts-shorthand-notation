# Notation and TypeScript translation

**RxJS Deep Dive · RxJS 7.8.2**

The notation makes the relationship between **configuration, payload types, and stream shapes** visible in a small space. Read it together with an operator's short behavior description and execution notes.[^gpt6]

```text
map(project: A => B): A* => B*
```

Read this as: “Give `map` a function from an `A` value to a `B` value. It returns a transformation from a stream of `A` values to a stream of `B` values.” `map(project)` is the configured operator; applying it to a source produces the result Observable. Subscription determines when that result is executed.

This is **Cω-inspired shorthand that translates into TypeScript**, not syntax the TypeScript compiler accepts. The repository supplies ordinary TypeScript beside the notation; it does not extend the compiler or implement replacement operators.

## 1. The small core

| Shorthand | Reading | Ordinary TypeScript shape |
| --- | --- | --- |
| `A*` | Stream of `A` values | `Observable<A>` |
| `A => B` | Value function | `(value: A) => B` |
| `A* => B*` | Stream transformation | `(source: Observable<A>) => Observable<B>` |
| `(S, A) => S` | State update | `(state: S, value: A) => S` |
| `() => A*` | Factory returning a stream | `() => Observable<A>` |
| `A[]` | One array value | `A[]` |
| `(A[])*` | Stream whose values are arrays | `Observable<A[]>` |
| `(A*)*` | Stream whose values are streams | `Observable<Observable<A>>` |
| `[A*, B*]` | Tuple of two sources | `[Observable<A>, Observable<B>]` |
| `[A, B]*` | Stream of two-value tuples | `Observable<[A, B]>` |
| `(A \| B)*` | Stream of union payloads | `Observable<A \| B>` |
| `A & B` | Both structural requirements | `A & B` |
| `Input<A>` | An input RxJS can convert | `ObservableInput<A>` |

Keep parentheses around arrays, nested streams, indexed access, and unions when that helps show what the suffix belongs to. The brackets in `[A, B]*` describe one emitted tuple, not two separately emitted values. These TypeScript array, tuple, union, and intersection constructions are standard language features. [TypeScript object types](https://www.typescriptlang.org/docs/handbook/2/objects.html) · [Everyday types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

The notation uses type parameters locally: `A` and `B` are input and output payloads, `S` is state, `K` is a key, `O` is an opening-signal payload, `R` is a registration token, and `D` is a default-value type. Reusing a letter within one signature states a type relationship. It does not imply that different operators all work on one global `A` type.

TypeScript requires parameter names in function-type expressions. Write `(value: A) => B`, not `A => B`, in a `.ts` file. Similarly, `A*` becomes a generic Observable type. [TypeScript function types](https://www.typescriptlang.org/docs/handbook/2/functions.html)

## 2. Preserve the API's call shape

Most pipeable operator factories have this form:

```text
operator(configuration): sourceType => resultType
```

For example:

```text
scan(reducer: (S, A) => S, seed: S): A* => S*
```

Creation functions take their inputs directly:

```text
of(...values: A[]): A*
combineLatest(sources: [A*, B*]): [A, B]*
```

Some APIs return another kind of value. Keep that difference visible:

```text
bindCallback(fn: (arg: A, callback: B => void) => void): A => B*
partition(source: A*, predicate: A => boolean): [A*, A*]
connectable(source: A*, config?: ConnectableConfig<A>): Connectable<A>
```

The legacy pipeable `partition` instead returns a function whose result is the pair of streams. It has its own entry and import path. A pair of Observables is not itself an Observable you can continue piping. [Partition creation source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/partition.ts) · [Legacy pipeable source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/partition.ts)

Configuration parameters keep useful names such as `project`, `predicate`, `seed`, `dueTime`, and `scheduler`. The names explain an argument's role. They need not match every spelling used in the official overload declarations.

## 3. Occurrences describe values, not termination

| Suffix | Count of delivered next values |
| --- | --- |
| `T?` | Zero or one |
| `T!` | Exactly one |
| `T+` | One or more |
| `T*` | Zero or more, with no upper bound expressed |

The operator cards use `*` as the conservative, familiar Observable shape. Stronger occurrence contracts belong in a stated context. For example, a finite, normally completing seeded `reduce` produces one result, while `take(1)` can complete without a value. Cancellation, exceptions, and nontermination must not disappear inside a stronger-looking suffix. [Occurrence refinements and assumptions](cardinality.md)

**`T?` does not mean `T | undefined`.** `of(undefined)` emits one value. `EMPTY` emits no next values. A question mark in `scheduler?: SchedulerLike` is ordinary optional-parameter notation, not a stream occurrence. [of source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/of.ts) · [EMPTY source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/empty.ts)

The payload type `never` has a separate role:

```text
EMPTY: never*
NEVER: never*
throwError(errorFactory: () => unknown): never*
```

All three have no next values. `EMPTY` completes, `NEVER` stays open, and `throwError` errors. The type shape does not distinguish their termination policies. A live subscription can also end through unsubscription, which does not send a complete notification to its observer. [Never source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/never.ts) · [throwError source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/throwError.ts) · [Subscription source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/Subscription.ts)

## 4. Add policy beside shape

```text
mergeMap(project: A => B*): A* => B*
switchMap(project: A => B*): A* => B*
```

The relationship between payload and stream types is the same. Their **Action Policies** differ: `mergeMap` forwards active inners concurrently by default; `switchMap` replaces the previous inner subscription when a new outer value arrives. The type alone cannot express that choice. [mergeMap source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeMap.ts) · [switchMap source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/switchMap.ts)

The same discipline applies to timing, readiness, error handling, completion, and sharing. Use the adjacent execution notes to ask:

- What triggers an output value?
- Which subscriptions start, overlap, wait, or get cancelled?
- What happens on source completion, notifier completion, error, and unsubscribe?
- Is state local to each subscription, or is a source connection shared?

These questions describe behavior; they do not add more symbols to a beginner's first signature.

## 5. The native TypeScript companion

```ts
import type { Observable, ObservableInput } from 'rxjs';

type Stream<A> = Observable<A>;
type Input<A> = ObservableInput<A>;
type StreamOperator<A, B> = (source: Stream<A>) => Stream<B>;

type MapSignature = <A, B>(
  project: (value: A, index: number) => B,
) => StreamOperator<A, B>;
```

[examples/notation.ts](../examples/notation.ts) contains the six motivating signatures as ordinary TypeScript and assigns the real RxJS functions to them. It also demonstrates arrays, tuple sources, tuple results, inner streams, type-guard filtering, and null/undefined payloads. Run `npm run typecheck` to check it against the pinned declarations, or `npm run examples` to compile and execute it.

This checks a selection of signatures. It does not claim a lossless transcription of the full overload sets. The cards deliberately select readable common forms: seeded `scan`, common Observable inputs, two-source joins, and named configuration parameters. Callback indices and important alternatives appear in the scope notes. When the API accepts `ObservableInput`, an Observable-only shorthand is an explicit specialization. [RxJS input types](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/types.ts)

## 6. Specialized names

The complete shared glossary is available in the searchable reference and printable handbook. The common groups are:

| Names | Role |
| --- | --- |
| `SchedulerLike`, `TimestampProvider`, `Date` | Scheduling, clock reading, and absolute time |
| `ThrottleConfig`, `RetryConfig`, `RepeatConfig` | Suppression, retry, and repetition policies |
| `ShareConfig<A>`, `ShareReplayConfig` | Shared connection and replay policies |
| `ConnectConfig<A>`, `ConnectableConfig<A>` | Selector-local sharing and explicit connections |
| `Connectable<A>`, `ConnectableObservable<A>` | Modern connection interface and legacy connectable shape |
| `Subject<A>`, `SubjectLike<A>`, `Observer<A>` | Receiving notifications and exposing subscriptions |
| `Subscription`, `Unsubscribable` | Teardown handles |
| `GroupedObservable<K, A>` | A stream carrying a key property |
| `TimeoutConfig<A, B*>`, `TimeoutInfo<A>` | Deadline policy and fallback information |
| `AjaxConfig`, `AjaxResponse<A>` | Request options and response wrappers |
| `WebSocketSubjectConfig<A>`, `WebSocketSubject<A>` | Socket configuration and duplex interface |
| `EventTarget`, `AddEventListenerOptions` | The selected DOM event source form |
| `Request`, `RequestInit`, `Response` | Platform fetch types |

These are named API or platform shapes, not additional stream suffixes. Some implementation-level configuration types, including `ConnectableConfig`, are not re-exported from the root `rxjs` package in 7.8.2. The teaching name identifies the shape; follow the actual API declaration when choosing imports. [Root exports](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/index.ts) · [Connectable configuration](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/connectable.ts)

`Notice<A>` is the local abbreviation for the structural notification union:

```ts
type Notice<A> =
  | { kind: 'N'; value: A }
  | { kind: 'E'; error: unknown }
  | { kind: 'C' };
```

`materialize` produces notification instances compatible with this union; `dematerialize` turns these data descriptions back into actual notifications. The union's error field describes an error *as data*. It does not add a second error type parameter to Observable. [Notification types](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/types.ts) · [materialize source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/materialize.ts)

## 7. Origin and adaptation

The visual inspiration is Erik Meijer's presentation of Cω type-system extensions, including occurrence suffixes, tuples/rows, functions, unions, and intersections. See the [video supplied for this project, around 14:46](https://www.youtube.com/watch?v=HRCEcTeStvQ&t=886s), and Meijer, Schulte, and Bierman's [Unifying Tables, Objects and Documents](https://csaws.cs.technion.ac.il/~oshmu/seminar2005/c-omega%20UnifyingTablesObjectsAndDocuments(DPCOOL2003).pdf).

This reference adapts that compact visual vocabulary to RxJS subscriptions and familiar TypeScript payload shapes. It does not claim to reproduce Cω's original type algebra or its treatment of null and empty sequences. The timing and cancellation policies come from RxJS 7.8.2, not from the suffixes.

[^gpt6]: These definitions and teaching notes were created with the help of GPT-6 Astra, under the course direction of Hans Schenker.
