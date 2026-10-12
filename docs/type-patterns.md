# Cω shorthand grouped by type pattern

**RxJS 7.8.2 · 147 API entries · 148 selected signatures · 14 pattern families**

The Cω-inspired signatures from the [complete operator reference](operator-reference.md), grouped by input/output shape and the type of the supplied function.[^gpt6]

`A*` means `Observable<A>`. `A[]` is one array value, `(A[])*` is a stream of arrays, `[A*, B*]` is a tuple of streams, and `(A*)*` is a stream of streams. [Full notation](notation.md).

The signatures are copied verbatim from the catalog. Family patterns summarize their structure. Matching type patterns do not imply matching timing, cancellation, sharing, or termination. The selected `*` suffixes are retained.

`timeout` has two selected forms, placed under their respective result shapes. Creation and legacy pipeable APIs with the same name remain separate. Legacy aliases are retained; API status, import paths, and overload scope are in the full reference.

## Pattern overview

| Family | Main shape | Signatures |
| --- | --- | ---: |
| [1. Same payload type](#same-payload) | `A* => A*` | 40 |
| [2. Other payload shapes](#payload-shapes) | `A* => B*; Notice<A>* => A*` | 14 |
| [3. State results](#state-results) | `A* => S*` | 4 |
| [4. Selecting or supplying inner streams](#inner-selection) | `(A => B*) => (A* => B*); B* => (A* => B*)` | 9 |
| [5. Arrays and same type tuples](#arrays-tuples) | `A* => (A[])*; A* => [A, A]*` | 7 |
| [6. Nested stream results](#nested-results) | `A* => (A*)*` | 6 |
| [7. Nested stream inputs](#flattening) | `(A*)* => A*` | 5 |
| [8. Tuple and array joins](#product-joins) | `[A*, B*] => [A, B]*; (A*)* => (A[])*` | 11 |
| [9. Union payload results](#union-results) | `(A \| B)*` | 18 |
| [10. A tuple of result streams](#partition) | `A* => [A*, A*]` | 2 |
| [11. A function on whole streams](#whole-stream) | `(A* => B*) => (A* => B*)` | 1 |
| [12. Stream objects with additional capabilities](#capabilities) | `Connectable<A>; ConnectableObservable<A>; WebSocketSubject<A>` | 8 |
| [13. Direct stream creation](#creation) | `(...): A*` | 21 |
| [14. Functions that return streams](#callback-functions) | `(...): A => B*` | 2 |

<a id="same-payload"></a>
## 1. Same payload type

### Value predicates

```text
A => boolean
```

```text
filter(predicate: A => boolean): A* => A*
first(predicate?: A => boolean): A* => A*
last(predicate?: A => boolean): A* => A*
single(predicate?: A => boolean): A* => A*
skipWhile(predicate: A => boolean): A* => A*
takeWhile(predicate: A => boolean, inclusive?: boolean): A* => A*
```

### Keys and comparisons

```text
A => K; (A, A) => boolean; (A, A) => number
```

```text
distinct(keySelector?: A => K, flushes?: unknown*): A* => A*
distinctUntilChanged(compare?: (A, A) => boolean): A* => A*
distinctUntilKeyChanged(key: K, compare?: (A[K], A[K]) => boolean): A* => A*
min(compare?: (A, A) => number): A* => A*
max(compare?: (A, A) => number): A* => A*
```

### Control streams

```text
unknown*; A => unknown*
```

```text
audit(durationSelector: A => unknown*): A* => A*
debounce(durationSelector: A => unknown*): A* => A*
throttle(durationSelector: A => unknown*, config?: ThrottleConfig): A* => A*
delayWhen(release: A => unknown*): A* => A*
sample(notifier: unknown*): A* => A*
skipUntil(notifier: unknown*): A* => A*
takeUntil(notifier: unknown*): A* => A*
```

### Control stream transformations

```text
unknown* => unknown*; void* => unknown*
```

```text
retryWhen(notifier: unknown* => unknown*): A* => A*
repeatWhen(notifier: void* => unknown*): A* => A*
```

### Effects and cleanup

```text
A => void; () => void
```

```text
tap(effect: A => void): A* => A*
finalize(cleanup: () => void): A* => A*
```

### Positions, counts, time, and configuration

```text
A* => A*
```

```text
elementAt(index: number): A* => A*
skip(count: number): A* => A*
skipLast(count: number): A* => A*
take(count: number): A* => A*
takeLast(count: number): A* => A*
auditTime(duration: number, scheduler?: SchedulerLike): A* => A*
debounceTime(dueTime: number, scheduler?: SchedulerLike): A* => A*
sampleTime(period: number, scheduler?: SchedulerLike): A* => A*
throttleTime(duration: number, scheduler?: SchedulerLike, config?: ThrottleConfig): A* => A*
delay(due: number | Date, scheduler?: SchedulerLike): A* => A*
observeOn(scheduler: SchedulerLike, delay?: number): A* => A*
subscribeOn(scheduler: SchedulerLike, delay?: number): A* => A*
share(config?: ShareConfig<A>): A* => A*
shareReplay(config: ShareReplayConfig): A* => A*
retry(config?: number | RetryConfig): A* => A*
repeat(config?: number | RepeatConfig): A* => A*
throwIfEmpty(errorFactory?: () => unknown): A* => A*
timeout(due: number | Date, scheduler?: SchedulerLike): A* => A*
```


<a id="payload-shapes"></a>
## 2. Other payload shapes

### Value and constant results

```text
A* => B*
```

```text
map(project: A => B): A* => B*
mapTo(value: B): A* => B*
```

### Property results

```text
A* => (A[K])*
```

```text
pluck(key: K): A* => (A[K])*
```

### Record results

```text
A* => { value: A; ... }*
```

```text
timeInterval(scheduler?: SchedulerLike): A* => { value: A; interval: number }*
timestamp(clock?: TimestampProvider): A* => { value: A; timestamp: number }*
```

### Notification values

```text
A* => Notice<A>*; Notice<A>* => A*
```

```text
materialize(): A* => Notice<A>*
dematerialize(): Notice<A>* => A*
```

### Boolean results

```text
A* => boolean*
```

```text
every(predicate: A => boolean): A* => boolean*
isEmpty(): A* => boolean*
sequenceEqual(other: A*, equal?: (A, A) => boolean): A* => boolean*
```

### Number results

```text
A* => number*
```

```text
count(predicate?: A => boolean): A* => number*
findIndex(predicate: A => boolean): A* => number*
```

### An explicit undefined alternative

```text
A* => (A | undefined)*
```

```text
find(predicate: A => boolean): A* => (A | undefined)*
```

### No next payload

```text
A* => never*
```

```text
ignoreElements(): A* => never*
```


<a id="state-results"></a>
## 3. State results

### A function returning a state value

```text
(S, A) => S
```

```text
scan(reducer: (S, A) => S, seed: S): A* => S*
reduce(reducer: (S, A) => S, seed: S): A* => S*
```

### A function returning a stream of state values

```text
(S, A) => S*
```

```text
mergeScan(accumulator: (S, A) => S*, seed: S, concurrent?: number): A* => S*
switchScan(accumulator: (S, A) => S*, seed: S): A* => S*
```


<a id="inner-selection"></a>
## 4. Selecting or supplying inner streams

### A value selects a stream

```text
A => B*
```

```text
mergeMap(project: A => B*, concurrent?: number): A* => B*
concatMap(project: A => B*): A* => B*
switchMap(project: A => B*): A* => B*
exhaustMap(project: A => B*): A* => B*
flatMap(project: A => B*, concurrent?: number): A* => B*
```

### A stream is supplied directly

```text
B*
```

```text
mergeMapTo(inner: B*, concurrent?: number): A* => B*
concatMapTo(inner: B*): A* => B*
switchMapTo(inner: B*): A* => B*
```

### The selected stream has the input payload type

```text
A => A*
```

```text
expand(project: A => A*, concurrent?: number): A* => A*
```


<a id="arrays-tuples"></a>
## 5. Arrays and same type tuples

### Array results

```text
A* => (A[])*
```

```text
buffer(closingNotifier: unknown*): A* => (A[])*
bufferCount(bufferSize: number, startBufferEvery?: number): A* => (A[])*
bufferTime(timeSpan: number, scheduler?: SchedulerLike): A* => (A[])*
bufferToggle(openings: O*, closingSelector: O => unknown*): A* => (A[])*
bufferWhen(closingSelector: () => unknown*): A* => (A[])*
toArray(): A* => (A[])*
```

### A tuple with two values of the input type

```text
A* => [A, A]*
```

```text
pairwise(): A* => [A, A]*
```


<a id="nested-results"></a>
## 6. Nested stream results

### Streams as payloads

```text
A* => (A*)*
```

```text
window(boundaries: unknown*): A* => (A*)*
windowCount(windowSize: number, startWindowEvery?: number): A* => (A*)*
windowTime(timeSpan: number, scheduler?: SchedulerLike): A* => (A*)*
windowToggle(openings: O*, closingSelector: O => unknown*): A* => (A*)*
windowWhen(closingSelector: () => unknown*): A* => (A*)*
```

### Streams with a key property as payloads

```text
A* => (A* & { readonly key: K })*
```

```text
groupBy(key: A => K): A* => (A* & { readonly key: K })*
```


<a id="flattening"></a>
## 7. Nested stream inputs

### A stream of streams becomes a stream of values

```text
(A*)* => A*
```

```text
mergeAll(concurrent?: number): (A*)* => A*
concatAll(): (A*)* => A*
switchAll(): (A*)* => A*
exhaustAll(): (A*)* => A*
exhaust(): (A*)* => A*
```


<a id="product-joins"></a>
## 8. Tuple and array joins

### Creation forms with a tuple of sources

```text
[A*, B*] => [A, B]*
```

```text
combineLatest(sources: [A*, B*]): [A, B]*
zip(sources: [A*, B*]): [A, B]*
forkJoin(sources: [A*, B*]): [A, B]*
```

### Pipeable forms with another source

```text
A* => [A, B]*
```

```text
withLatestFrom(other: B*): A* => [A, B]*
combineLatestWith(other: B*): A* => [A, B]*
zipWith(other: B*): A* => [A, B]*
```

### Legacy pipeable forms with another source

```text
A* => [A, B]*
```

```text
combineLatest(other: B*): A* => [A, B]*
zip(other: B*): A* => [A, B]*
```

### Nested sources with array results

```text
(A*)* => (A[])*
```

```text
combineLatestAll(): (A*)* => (A[])*
zipAll(): (A*)* => (A[])*
combineAll(): (A*)* => (A[])*
```


<a id="union-results"></a>
## 9. Union payload results

### Creation forms with several sources

```text
[A*, B*] => (A | B)*
(A*, B*) => (A | B)*
```

```text
concat(first: A*, second: B*): (A | B)*
merge(first: A*, second: B*, concurrent?: number): (A | B)*
race(sources: [A*, B*]): (A | B)*
onErrorResumeNext(sources: [A*, B*]): (A | B)*
```

### Pipeable forms with another source

```text
A* => (A | B)*
```

```text
concatWith(other: B*): A* => (A | B)*
mergeWith(other: B*): A* => (A | B)*
raceWith(other: B*): A* => (A | B)*
onErrorResumeNextWith(next: B*): A* => (A | B)*
```

### Legacy pipeable forms with another source

```text
A* => (A | B)*
```

```text
concat(other: B*): A* => (A | B)*
merge(other: B*): A* => (A | B)*
race(other: B*): A* => (A | B)*
onErrorResumeNext(next: B*): A* => (A | B)*
```

### Additional values

```text
A* => (A | B)*
```

```text
startWith(...values: B[]): A* => (A | B)*
endWith(...values: B[]): A* => (A | B)*
defaultIfEmpty(fallback: B): A* => (A | B)*
```

### Recovery and fallback streams

```text
A* => (A | B)*
```

```text
catchError(recover: unknown => B*): A* => (A | B)*
timeout(config: TimeoutConfig<A, B*> & { with: TimeoutInfo<A> => B* }): A* => (A | B)*
timeoutWith(due: number | Date, fallback: B*, scheduler?: SchedulerLike): A* => (A | B)*
```


<a id="partition"></a>
## 10. A tuple of result streams

### Creation form

```text
[A*, A*]
```

```text
partition(source: A*, predicate: A => boolean): [A*, A*]
```

### Legacy pipeable form

```text
A* => [A*, A*]
```

```text
partition(predicate: A => boolean): A* => [A*, A*]
```


<a id="whole-stream"></a>
## 11. A function on whole streams

### A whole stream selector

```text
A* => B*
```

```text
connect(selector: A* => B*, config?: ConnectConfig<A>): A* => B*
```


<a id="capabilities"></a>
## 12. Stream objects with additional capabilities

### Connectable creation form

```text
Connectable<A>
```

```text
connectable(source: A*, config?: ConnectableConfig<A>): Connectable<A>
```

### Legacy connectable results

```text
A* => ConnectableObservable<A>
```

```text
multicast(connector: () => Subject<A>): A* => ConnectableObservable<A>
publish(): A* => ConnectableObservable<A>
publishBehavior(seed: A): A* => ConnectableObservable<A>
publishLast(): A* => ConnectableObservable<A>
publishReplay(bufferSize?: number, windowTime?: number): A* => ConnectableObservable<A>
```

### A connectable object as input

```text
ConnectableObservable<A> => A*
```

```text
refCount(): ConnectableObservable<A> => A*
```

### A duplex stream object

```text
WebSocketSubject<A>
```

```text
webSocket(urlOrConfig: string | WebSocketSubjectConfig<A>): WebSocketSubject<A>
```


<a id="creation"></a>
## 13. Direct stream creation

### General payloads

```text
A*
```

```text
of(...values: A[]): A*
from(input: Input<A>): A*
scheduled(input: Input<A>, scheduler: SchedulerLike): A*
defer(factory: () => Input<A>): A*
fromEvent(target: EventTarget, eventName: string, options?: AddEventListenerOptions): A*
fromEventPattern(addHandler: (handler: A => void) => R, removeHandler?: (handler: A => void, token: R) => void): A*
generate(options: {
  initialState: S,
  condition?: S => boolean,
  iterate: S => S,
  resultSelector: S => A,
  scheduler?: SchedulerLike
}): A*
using(resourceFactory: () => (Unsubscribable | void), observableFactory: (Unsubscribable | void) => (Input<A> | void)): A*
```

### Number payloads

```text
number*
```

```text
interval(period?: number, scheduler?: SchedulerLike): number*
timer(due: number | Date, scheduler?: SchedulerLike): number*
range(start: number, count: number): number*
```

### No next payload

```text
never*
```

```text
empty(scheduler?: SchedulerLike): never*
EMPTY: never*
never(): never*
NEVER: never*
throwError(errorFactory: () => unknown): never*
```

### Named and structured payloads

```text
AjaxResponse<A>*; Response*; { ... }*; [string, A]*
```

```text
ajax(request: string | AjaxConfig): AjaxResponse<A>*
fromFetch(input: string | Request, init?: RequestInit): Response*
animationFrames(timestampProvider?: TimestampProvider): ({ timestamp: number, elapsed: number })*
pairs(object: Record<string, A>, scheduler?: SchedulerLike): [string, A]*
```

### A conditional union payload

```text
(A | B)*
```

```text
iif(condition: () => boolean, whenTrue: Input<A>, whenFalse: Input<B>): (A | B)*
```


<a id="callback-functions"></a>
## 14. Functions that return streams

### Callback function adapters

```text
A => B*
```

```text
bindCallback(fn: (arg: A, callback: B => void) => void): A => B*
bindNodeCallback(fn: (arg: A, callback: (error: unknown, value: B) => void) => void): A => B*
```

[^gpt6]: These definitions and teaching notes were created with the help of GPT-6 Astra, under the course direction of Hans Schenker.
