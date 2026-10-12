# RxJS Deep Dive: teaching with stream signatures

Use this guide with the [operator reference](operator-reference.md) and the [ordinary TypeScript companion](../examples/notation.ts). The reference is pinned to **RxJS 7.8.2**. Its signatures are a teaching notation that translates into TypeScript; they are not syntax accepted by the TypeScript compiler.[^GPT6Astra]

The classroom sequence is **Intuition → Specification → Verification**. First predict the shape of the values. Then identify the operator's Action Policy and execution rules. Finally check a concrete subscription, including its completion, error, or cancellation. Returning to these three steps gives students a repeatable way to read unfamiliar operators.

## 1. Intuition: read the values before reading the implementation

Start with four shapes: `A*` is a stream of `A` values, `(A[])*` is a stream of arrays, `(A*)*` is a stream of streams, and `[A, B]*` is a stream of tuples. In ordinary TypeScript, `A*` becomes `Observable<A>` and `A => B` becomes `(value: A) => B`.

The star says nothing about a clock, eventual completion, shared execution, or errors. `A?`, `A!`, and `A+` can add occurrence claims, but those claims need a stated observation period and termination assumptions. Ordinary `Observable<A>` does not enforce them. `of(null)` emits one payload; `EMPTY` emits none. Missing values and nullable values are different concepts.

An operator factory such as `map(project)` constructs a transformation. Applying it produces a stream description; subscribing connects the execution. Argument expressions may already have run: `from(makePromise())` receives a promise created before subscription. [Creation details](operator-reference.md#from) belong beside the type shape.

### Mapping values, describing inner work, and subscribing to it

| Operation | Signature | What the learner should notice |
| --- | --- | --- |
| Map a value | `map(project: A => B): A* => B*` | The domain function supplies the next payload. |
| Map to a stream value | `map(project: A => B*): A* => (B*)*` | An inner stream is the payload; `map` does not subscribe to it. |
| Project and switch | `switchMap(project: A => B*): A* => B*` | The operator subscribes to inners and applies a replacement policy. |

Ask students to name the domain function separately from the operator. A price calculation knows the business rule; `map` knows how to apply a projection. A lookup description says what work to request; `switchMap` decides which inner subscription remains active. The companion file keeps these responsibilities separate with pure functions and actual RxJS operators. Sources: [map](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/map.ts), [switchMap](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/switchMap.ts).

## 2. Specification: add the policy that the shape cannot express

For every card, ask: **What triggers output? What state is retained? What ends the subscription?** These questions expose meaningful differences between operators with identical signatures. A familiar output shape is the start of the explanation, not a complete behavioral contract.

### Higher-order Action Policies

All four families below use `project: A => B*` and produce `A* => B*`.

| Operator | Action Policy while inner work is active | When projection runs |
| --- | --- | --- |
| `concatMap(project)` | Queue inputs; process one inner at a time. | When an input reaches the front of the queue. |
| `mergeMap(project, concurrent?)` | Start overlapping inners up to the limit; queue excess inputs. | When a subscription slot is available. |
| `switchMap(project)` | Unsubscribe the current inner and replace it. | For each new input, after unsubscribing the old inner. |
| `exhaustMap(project)` | Ignore inputs while busy. | Only for an accepted input. |

Normal outer completion waits for active inner work; `concatMap` and `mergeMap` also drain queued inputs. Their concurrency limits bound active subscriptions, not queue size. With inner streams already supplied, the corresponding operators are `concatAll`, `mergeAll`, `switchAll`, and `exhaustAll`, each with shape `(B*)* => B*`. [Compare the cards](operator-reference.md#concatMap).

Do not teach an unconditional equality between `concatMap(project)` and `map(project)` followed by `concatAll()`. The latter calls the projector immediately and queues its returned streams. `concatMap` queues inputs and projects later. A projector might throw, read a changing value, create a promise, or perform another effect. Similarly, `map(project)` calls the projector even for values that `exhaustMap` would ignore. A useful structural correspondence does not establish identical execution. Sources: [mergeInternals](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeInternals.ts), [exhaustMap](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/exhaustMap.ts).

### Tuples of sources and streams of tuples

`[A*, B*]` contains two stream descriptions. `[A, B]*` emits paired values. A join needs both a readiness rule and an output trigger.

| Join | Selected shape | Readiness and output trigger |
| --- | --- | --- |
| `combineLatest` | `[A*, B*] => [A, B]*` | Every input has emitted; thereafter any input next triggers a tuple. |
| `withLatestFrom(other: B*)` | `A* => [A, B]*` | The companion has emitted; only a primary-source next triggers a tuple. |
| `zip` | `[A*, B*] => [A, B]*` | Every input has another unpaired value; consume those values as a tuple. |
| `forkJoin` | `[A*, B*] => [A, B]*` | Each input has a value and all complete; emit their final-value tuple once. |
| `combineLatestAll()` | `(A*)* => (A[])*` | First collect inners until outer completion; then apply latest-value readiness and triggers. |

Have students identify the subscription order before predicting synchronous examples. `withLatestFrom` subscribes companions first; `combineLatest` subscribes in supplied order. The same `of(...)` inputs can therefore expose different remembered values. A completed input is also different from an empty input: read each join's completion rule, especially the pinned 7.8.2 `combineLatest` empty-input detail. Sources: [withLatestFrom](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/withLatestFrom.ts), [combineLatest](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/combineLatest.ts), [forkJoin](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/forkJoin.ts).

### State during execution and state at completion

| Selected seeded form | Normal output | Empty source that completes |
| --- | --- | --- |
| `scan(reducer: (S, A) => S, seed: S): A* => S*` | Each updated state, as inputs arrive. | No next values; complete. |
| `reduce(reducer: (S, A) => S, seed: S): A* => S*` | The final accumulated state, after completion. | Emit the seed; complete. |

Neither form emits the seed immediately on subscription. With `scan`, add an explicit starting-value policy when the interface needs an initial state. State variables are local to subscriptions, but an object seed is not cloned. Pure reducers make that distinction easier to reason about. A source error does not cause either operator to emit an extra final aggregate. Sources: [scanInternals](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/scanInternals.ts), [reduce](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/reduce.ts).

### Buffers and windows

| Question | Buffer family | Window family |
| --- | --- | --- |
| Output shape | `A* => (A[])*` | `A* => (A*)*` |
| One emitted value | An array containing a completed batch. | A live stream carrying one window's values. |
| When it appears | When the batch closes or is flushed. | When the window opens. |
| How contents are observed | Read the array after it is emitted. | Subscribe promptly; default windows do not replay past values. |
| Retention | Values accumulate in arrays. | The window itself does not accumulate an array; downstream processing chooses retention. |

Pair `buffer` with `window`, then compare the `Count`, `Time`, `Toggle`, and `When` variants. Avoid declaring them universally interchangeable through `toArray()`: `windowCount(2)` eagerly opens an extra empty window after an exact count boundary, while `bufferCount(2)` does not open an extra buffer. A closer completing without next advances `windowWhen` but does not advance `bufferWhen`. Sources: [windowCount](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/windowCount.ts), [bufferCount](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/bufferCount.ts), [windowWhen](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/windowWhen.ts), [bufferWhen](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/bufferWhen.ts).

### Predicate and time-filter misconceptions

Each operator below can have shape `A* => A*`. That shared shape does not mean the same values survive.

| Operator | Decision rule | Common misconception to challenge |
| --- | --- | --- |
| `filter` | Test each value independently. | One rejection does not stop later testing. |
| `takeWhile` | Stop at the first failing value. | Later matching values are never reached. |
| `skipWhile` | Skip the initial passing run, then accept all. | The predicate is not called forever. |
| `debounceTime` | Move the deadline on every arrival. | Normal completion flushes a pending value immediately. |
| `auditTime` | Keep a fixed deadline for the active interval. | Normal completion can wait for that interval. |
| `sampleTime` | Inspect the latest fresh value at clock ticks. | Completion does not flush an unsampled value. |
| `throttleTime` | Choose leading/trailing emissions around fixed durations. | Its default is leading only; trailing output requires configuration. |

Ask for an output prediction that includes completion, then change one event into an error or unsubscription. The timing-filter cards document why those endings can discard pending values instead. Sources: [debounceTime](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/debounceTime.ts), [audit](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/audit.ts), [sample](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/sample.ts), [throttle](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/throttle.ts).

## 3. Verification: turn predictions into observations

Use short finite sources for payload questions and virtual time for timing questions. Record next values and terminal notifications separately. Where an operator replaces, queues, or ignores inner work, also record subscription and unsubscription events: matching output values alone can hide different executions.

The repository provides executable checks and a strict TypeScript companion. From its root, run:

```sh
npm ci
npm run typecheck
npm run check
```

The companion assigns the six selected signatures to actual RxJS functions. That checks compatibility with the pinned library; it does not recreate every overload or statically prove cardinality. The complete check also validates the catalog, behavioral tests, and generated reference consistency. Treat observed tests as evidence for the tested cases, not a universal proof of operator equivalence.

## Classroom exercises with answers

1. **Which payload is emitted?** Compare `from([1, 2])`, `of([1, 2])`, and `of(of(1, 2))`. **Answer:** respectively, two numbers; one array; one inner stream. All outer subscriptions complete. The third does not subscribe to its inner. [from](operator-reference.md#from), [of](operator-reference.md#of).

2. **When is a queued input projected?** A `concatMap` inner is still active when a second source value arrives. **Answer:** the second input waits; its projector call occurs after the first inner completes. Moving projection into an earlier `map` changes that timing. [concatMap](operator-reference.md#concatMap).

3. **Which join triggers?** A companion changes from `'a'` to `'b'` while the primary is silent. **Answer:** a ready `combineLatestWith` emits a new tuple; `withLatestFrom` only updates its remembered companion value. [combineLatestWith](operator-reference.md#combineLatestWith), [withLatestFrom](operator-reference.md#withLatestFrom).

4. **Does the seed appear?** Compare `EMPTY.pipe(scan(sum, 0))` and `EMPTY.pipe(reduce(sum, 0))`. **Answer:** `scan` completes without next; `reduce` emits `0` then completes. Neither emits on subscription before learning what the source does. [scan](operator-reference.md#scan), [reduce](operator-reference.md#reduce).

5. **How many collected batches?** Process `of(1, 2, 3, 4)` with `bufferCount(2)`, then with `windowCount(2)` and immediate `toArray()` on every window. **Answer:** two arrays versus three; the third window is empty. [bufferCount](operator-reference.md#bufferCount), [windowCount](operator-reference.md#windowCount).

6. **Does an empty stop signal stop?** Predict `of(1, 2).pipe(takeUntil(EMPTY))`. **Answer:** `1`, `2`, complete. A notifier next stops the source; notifier completion alone does not. [takeUntil](operator-reference.md#takeUntil).

7. **Must debounce wait?** Predict `of(1, 2, 3).pipe(debounceTime(100))`. **Answer:** emit `3` immediately when the synchronous source completes, then complete. Replace completion with an error and the pending value is discarded. [debounceTime](operator-reference.md#debounceTime).

[^GPT6Astra]: These definitions and teaching notes were created with the help of GPT-6 Astra, under the course direction of Hans Schenker.
