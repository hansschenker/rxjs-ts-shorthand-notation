# Compact signature index

RxJS 7.8.2. Selected common forms; explanatory shorthand, not literal TypeScript.[^gpt6]

Use this for quick comparisons. Read the linked full card before relying on its timing, termination, or sharing policy.

## Creation Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [ajax](operator-reference.md#ajax) | `ajax(request: string \| AjaxConfig): AjaxResponse<A>*` | Start an XMLHttpRequest on subscription and emit response objects containing a payload of type A. With the default progress settings, a successful request emits its response and completes. |
| [bindCallback](operator-reference.md#bindCallback) | `bindCallback(fn: (arg: A, callback: B => void) => void): A => B*` | Turn a callback API into a function that returns a stream of its result. Calling the bound function prepares that stream; its first subscription invokes the original function. |
| [bindNodeCallback](operator-reference.md#bindNodeCallback) | `bindNodeCallback(fn: (arg: A, callback: (error: unknown, value: B) => void) => void): A => B*` | Adapt a Node-style error-first callback. A successful callback supplies the result value; an error argument terminates the stream through the error channel. |
| [defer](operator-reference.md#defer) | `defer(factory: () => Input<A>): A*` | Run the factory separately for each subscription, convert its result to an Observable, and forward that execution. |
| [empty](operator-reference.md#empty) † | `empty(scheduler?: SchedulerLike): never*` | Create a stream that completes without emitting a value. |
| [from](operator-reference.md#from) | `from(input: Input<A>): A*` | Convert an Observable-compatible input into a stream of its values. The input kind determines how those values become available. |
| [fromEvent](operator-reference.md#fromEvent) | `fromEvent(target: EventTarget, eventName: string, options?: AddEventListenerOptions): A*` | Turn events from a target into values. In the common DOM form, each event object becomes one emitted value. |
| [fromEventPattern](operator-reference.md#fromEventPattern) | `fromEventPattern(addHandler: (handler: A => void) => R, removeHandler?: (handler: A => void, token: R) => void): A*` | Adapt an event API by supplying the functions that attach and detach a handler. Every handler call supplies an emission. |
| [generate](operator-reference.md#generate) | `generate(options: { /   initialState: S, /   condition?: S => boolean, /   iterate: S => S, /   resultSelector: S => A, /   scheduler?: SchedulerLike / }): A*` | Generate a sequence by repeatedly testing a state, projecting a value, and advancing the state. Stop when the condition becomes false. |
| [interval](operator-reference.md#interval) | `interval(period?: number, scheduler?: SchedulerLike): number*` | Emit an increasing counter at a recurring interval, starting with 0 after the first period. |
| [of](operator-reference.md#of) | `of(...values: A[]): A*` | Emit the supplied argument values in order, then complete. Each argument stays a single value. |
| [range](operator-reference.md#range) | `range(start: number, count: number): number*` | Emit count numbers, starting at start and increasing by 1, then complete. |
| [throwError](operator-reference.md#throwError) | `throwError(errorFactory: () => unknown): never*` | Create a stream that reports an error as soon as it is subscribed. |
| [timer](operator-reference.md#timer) | `timer(due: number \| Date, scheduler?: SchedulerLike): number*` | Wait until the due time, emit 0, and complete. A separate repeating form continues with an increasing counter. |
| [iif](operator-reference.md#iif) | `iif(condition: () => boolean, whenTrue: Input<A>, whenFalse: Input<B>): (A \| B)*` | Choose one of two inputs at subscription time and forward that chosen execution. |
| [animationFrames](operator-reference.md#animationFrames) ‡ | `animationFrames(timestampProvider?: TimestampProvider): ({ timestamp: number, elapsed: number })*` | Emit a timing record on each animation frame. elapsed measures the time since this subscription began. |
| [EMPTY](operator-reference.md#EMPTY) ‡ | `EMPTY: never*` | An Observable constant that completes immediately without emitting a value. |
| [fromFetch](operator-reference.md#fromFetch) ‡ | `fromFetch(input: string \| Request, init?: RequestInit): Response*` | Start a fetch request per subscription. In the default form, emit the Response when it is available and then complete; reading its body is a separate step. |
| [never](operator-reference.md#never) † ‡ | `never(): never*` | Return NEVER: a stream that sends no notifications and has no natural termination. |
| [NEVER](operator-reference.md#NEVER) ‡ | `NEVER: never*` | An Observable constant that sends no next, error, or complete notifications. |
| [pairs](operator-reference.md#pairs) † ‡ | `pairs(object: Record<string, A>, scheduler?: SchedulerLike): [string, A]*` | Emit the own enumerable string-keyed entries of an object as key-value tuples, then complete. |
| [scheduled](operator-reference.md#scheduled) ‡ | `scheduled(input: Input<A>, scheduler: SchedulerLike): A*` | Convert an input into an Observable while using the supplied scheduler to control its consumption and delivery. |
| [using](operator-reference.md#using) ‡ | `using(resourceFactory: () => (Unsubscribable \| void), observableFactory: (Unsubscribable \| void) => (Input<A> \| void)): A*` | Create a resource for a subscription and pass it to a factory that supplies that subscription's values. Dispose the resource when the established execution is torn down. |
| [webSocket](operator-reference.md#webSocket) ‡ | `webSocket(urlOrConfig: string \| WebSocketSubjectConfig<A>): WebSocketSubject<A>` | Create a duplex WebSocket endpoint: subscribing receives A values, while calling next sends A values to the server. |

## Join Creation Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [combineLatest](operator-reference.md#combineLatest) | `combineLatest(sources: [A*, B*]): [A, B]*` | After every source has supplied its first value, emit a tuple of the latest values whenever any source supplies another value. |
| [concat](operator-reference.md#concat) | `concat(first: A*, second: B*): (A \| B)*` | Subscribe to the sources in sequence. Forward all values from the current source and move to the next only after it completes. |
| [forkJoin](operator-reference.md#forkJoin) | `forkJoin(sources: [A*, B*]): [A, B]*` | Wait for all sources to complete, then emit one tuple containing each source's last value and complete. Every source must have supplied a value. |
| [merge](operator-reference.md#merge) | `merge(first: A*, second: B*, concurrent?: number): (A \| B)*` | Forward values from active sources as they arrive. Several sources may be subscribed at the same time. |
| [partition](operator-reference.md#partition) | `partition(source: A*, predicate: A => boolean): [A*, A*]` | Return two streams: one passes values for which the predicate is true, and the other passes values for which it is false. |
| [race](operator-reference.md#race) | `race(sources: [A*, B*]): (A \| B)*` | The first next value selects the source whose subsequent values are forwarded. A completion or error before any next ends the result immediately. |
| [zip](operator-reference.md#zip) | `zip(sources: [A*, B*]): [A, B]*` | Match values by position: first with first, second with second, and so on. Emit a tuple only when every input has supplied its next unmatched value. |
| [onErrorResumeNext](operator-reference.md#onErrorResumeNext) ‡ | `onErrorResumeNext(sources: [A*, B*]): (A \| B)*` | Run sources one after another, moving to the next after either completion or error. Values pass through; source errors do not. |

## Transformation Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [buffer](operator-reference.md#buffer) | `buffer(closingNotifier: unknown*): A* => (A[])*` | Collect source values into an array. Each closing notification emits the current array and starts an empty replacement. |
| [bufferCount](operator-reference.md#bufferCount) | `bufferCount(bufferSize: number, startBufferEvery?: number): A* => (A[])*` | Collect values into arrays and emit each array when it reaches the chosen size. |
| [bufferTime](operator-reference.md#bufferTime) | `bufferTime(timeSpan: number, scheduler?: SchedulerLike): A* => (A[])*` | Collect values during each time span and emit the resulting array when that span ends. |
| [bufferToggle](operator-reference.md#bufferToggle) | `bufferToggle(openings: O*, closingSelector: O => unknown*): A* => (A[])*` | Each opening value starts a buffer and selects its closing notifier. That notifier's first next emits the buffer. |
| [bufferWhen](operator-reference.md#bufferWhen) | `bufferWhen(closingSelector: () => unknown*): A* => (A[])*` | Open one buffer immediately. Each selected closing next emits that buffer, opens its replacement, and calls the selector again. |
| [concatMap](operator-reference.md#concatMap) | `concatMap(project: A => B*): A* => B*` | Process source values in order, one inner subscription at a time. Wait for the current inner to complete before starting the next. |
| [concatMapTo](operator-reference.md#concatMapTo) † | `concatMapTo(inner: B*): A* => B*` | For each source value, subscribe to the same supplied inner Observable, waiting for each subscription to complete before starting the next. |
| [exhaust](operator-reference.md#exhaust) † | `exhaust(): (A*)* => A*` | Subscribe to an arriving inner only while idle. Ignore arriving inners until the current one completes. |
| [exhaustMap](operator-reference.md#exhaustMap) | `exhaustMap(project: A => B*): A* => B*` | While idle, project a source value and subscribe to its inner. Ignore further source values until that inner completes. |
| [expand](operator-reference.md#expand) | `expand(project: A => A*, concurrent?: number): A* => A*` | Emit each source value and recursively project every value reached. Values produced by inner streams become further inputs to the same projection. |
| [groupBy](operator-reference.md#groupBy) | `groupBy(key: A => K): A* => (A* & { readonly key: K })*` | Route each value into the stream for its key. Emit a new keyed stream when that key first appears, then send matching values through that stream. |
| [map](operator-reference.md#map) | `map(project: A => B): A* => B*` | Apply the projection to each source value and emit its returned value. |
| [mapTo](operator-reference.md#mapTo) † | `mapTo(value: B): A* => B*` | Replace every source value with the same supplied value. |
| [mergeMap](operator-reference.md#mergeMap) | `mergeMap(project: A => B*, concurrent?: number): A* => B*` | Project source values into inner streams and forward their values as they arrive. Several inner subscriptions may be active together. |
| [mergeMapTo](operator-reference.md#mergeMapTo) † | `mergeMapTo(inner: B*, concurrent?: number): A* => B*` | For each source value, subscribe to the same supplied inner and merge the values from those subscriptions. |
| [mergeScan](operator-reference.md#mergeScan) | `mergeScan(accumulator: (S, A) => S*, seed: S, concurrent?: number): A* => S*` | Use the current state and an input to start an inner stream of states. Merge all active inners, remembering each emitted state for the next accumulator call. |
| [pairwise](operator-reference.md#pairwise) | `pairwise(): A* => [A, A]*` | Starting with the second source value, emit the previous and current values as a tuple. |
| [partition (pipeable)](operator-reference.md#partition-operator) † | `partition(predicate: A => boolean): A* => [A*, A*]` | Return two streams: values that pass the predicate and values that fail it. |
| [pluck](operator-reference.md#pluck) † | `pluck(key: K): A* => (A[K])*` | Read a property from every source value and emit the selected property value. |
| [scan](operator-reference.md#scan) | `scan(reducer: (S, A) => S, seed: S): A* => S*` | Update the current state with each source value and emit that updated state. |
| [switchScan](operator-reference.md#switchScan) | `switchScan(accumulator: (S, A) => S*, seed: S): A* => S*` | Use the current state and each input to select an inner stream of states. Replace the previous inner, forwarding and remembering values only from the active one. |
| [switchMap](operator-reference.md#switchMap) | `switchMap(project: A => B*): A* => B*` | For each input, replace the current inner subscription with the projected inner. Forward values from the active inner only. |
| [switchMapTo](operator-reference.md#switchMapTo) † | `switchMapTo(inner: B*): A* => B*` | Each source value cancels the current inner subscription and starts another subscription to the same supplied inner. |
| [window](operator-reference.md#window) | `window(boundaries: unknown*): A* => (A*)*` | Emit a live window stream immediately. Each boundary next completes that window and emits a new one. |
| [windowCount](operator-reference.md#windowCount) | `windowCount(windowSize: number, startWindowEvery?: number): A* => (A*)*` | Divide source values into live window streams, completing each window after its chosen number of values. |
| [windowTime](operator-reference.md#windowTime) | `windowTime(timeSpan: number, scheduler?: SchedulerLike): A* => (A*)*` | Emit a live window for each time span. In the displayed form, completing one timed window immediately opens the next. |
| [windowToggle](operator-reference.md#windowToggle) | `windowToggle(openings: O*, closingSelector: O => unknown*): A* => (A*)*` | Each opening value creates and emits a live window. Its selected closing notifier completes that window on the first next. |
| [windowWhen](operator-reference.md#windowWhen) | `windowWhen(closingSelector: () => unknown*): A* => (A*)*` | Open and emit a window immediately. A selected closing next or completion closes it, opens a replacement, and calls the selector again. |
| [flatMap](operator-reference.md#flatMap) † ‡ | `flatMap(project: A => B*, concurrent?: number): A* => B*` | Project values to inner streams and merge their emissions. This is the deprecated alias of mergeMap. |

## Filtering Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [audit](operator-reference.md#audit) | `audit(durationSelector: A => unknown*): A* => A*` | The first value starts a duration. While that duration is active, remember the latest source value; emit it when the duration sends a next notification. |
| [auditTime](operator-reference.md#auditTime) | `auditTime(duration: number, scheduler?: SchedulerLike): A* => A*` | The first value opens a timed interval. Emit the latest value at the end of that interval, then wait for another source value to open the next interval. |
| [debounce](operator-reference.md#debounce) | `debounce(durationSelector: A => unknown*): A* => A*` | Each source value replaces the pending value and starts a new duration. Emit that value if its duration sends a next notification before another source value arrives. |
| [debounceTime](operator-reference.md#debounceTime) | `debounceTime(dueTime: number, scheduler?: SchedulerLike): A* => A*` | Wait for a quiet period after a source value, then emit the latest pending value. Each new value moves the deadline. |
| [distinct](operator-reference.md#distinct) | `distinct(keySelector?: A => K, flushes?: unknown*): A* => A*` | Emit a source value only when its selected key has not been seen in this subscription since the last flush. |
| [distinctUntilChanged](operator-reference.md#distinctUntilChanged) | `distinctUntilChanged(compare?: (A, A) => boolean): A* => A*` | Emit the first value, then emit a later value only when the comparator says it differs from the last emitted value. |
| [distinctUntilKeyChanged](operator-reference.md#distinctUntilKeyChanged) | `distinctUntilKeyChanged(key: K, compare?: (A[K], A[K]) => boolean): A* => A*` | Emit the first object, then suppress objects whose chosen property compares equal to that property on the last emitted object. |
| [elementAt](operator-reference.md#elementAt) | `elementAt(index: number): A* => A*` | Emit the value at a zero-based position, then complete and unsubscribe from the source. |
| [filter](operator-reference.md#filter) | `filter(predicate: A => boolean): A* => A*` | Keep each source value whose predicate returns true. Other values contribute no output. |
| [first](operator-reference.md#first) | `first(predicate?: A => boolean): A* => A*` | Emit the first matching value and complete immediately. Without a predicate, the first source value matches. |
| [ignoreElements](operator-reference.md#ignoreElements) | `ignoreElements(): A* => never*` | Suppress every next value while preserving the source's completion or error notification. |
| [last](operator-reference.md#last) | `last(predicate?: A => boolean): A* => A*` | Remember the latest matching value and emit it when the source completes. Without a predicate, every source value matches. |
| [sample](operator-reference.md#sample) | `sample(notifier: unknown*): A* => A*` | On each notifier next, emit the latest source value received since the previous sample. If no new source value arrived, emit nothing. |
| [sampleTime](operator-reference.md#sampleTime) | `sampleTime(period: number, scheduler?: SchedulerLike): A* => A*` | At regular clock ticks, emit the latest source value received since the previous tick. A tick with no new value produces no output. |
| [single](operator-reference.md#single) | `single(predicate?: A => boolean): A* => A*` | Require exactly one matching value across the source. Emit that value only after source completion proves there was no second match. |
| [skip](operator-reference.md#skip) | `skip(count: number): A* => A*` | Discard the first count source values, then forward later values. |
| [skipLast](operator-reference.md#skipLast) | `skipLast(count: number): A* => A*` | Hold back the latest count values. Each later arrival releases the oldest held value; the final held values are discarded when the source ends. |
| [skipUntil](operator-reference.md#skipUntil) | `skipUntil(notifier: unknown*): A* => A*` | Discard source values until the notifier sends its first next notification. Forward later source values from then on. |
| [skipWhile](operator-reference.md#skipWhile) | `skipWhile(predicate: A => boolean): A* => A*` | Discard the initial run of values for which the predicate is true. Emit the first value for which it is false and every later value. |
| [take](operator-reference.md#take) | `take(count: number): A* => A*` | Forward up to count source values, then complete and unsubscribe from the source. |
| [takeLast](operator-reference.md#takeLast) | `takeLast(count: number): A* => A*` | Remember up to count recent values and emit them in their original order when the source completes. |
| [takeUntil](operator-reference.md#takeUntil) | `takeUntil(notifier: unknown*): A* => A*` | Forward source values until the notifier sends a next notification. That notification completes the result and tears down both subscriptions. |
| [takeWhile](operator-reference.md#takeWhile) | `takeWhile(predicate: A => boolean, inclusive?: boolean): A* => A*` | Forward the initial run of values that satisfy the predicate. Complete at the first false result, optionally including that boundary value. |
| [throttle](operator-reference.md#throttle) | `throttle(durationSelector: A => unknown*, config?: ThrottleConfig): A* => A*` | Use a duration to limit which values pass during a burst. By default, emit a leading value immediately and suppress further values while its duration is active. |
| [throttleTime](operator-reference.md#throttleTime) | `throttleTime(duration: number, scheduler?: SchedulerLike, config?: ThrottleConfig): A* => A*` | By default, emit a value immediately and suppress new values for a fixed duration. Leading and trailing options choose which ends of each interval may emit. |

## Join Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [combineLatestAll](operator-reference.md#combineLatestAll) | `combineLatestAll(): (A*)* => (A[])*` | Collect the inner sources until the outer source completes, then combine those sources by their latest values. |
| [concatAll](operator-reference.md#concatAll) | `concatAll(): (A*)* => A*` | Subscribe to one inner source at a time. Queue later inner sources and start the next only when the current inner completes. |
| [exhaustAll](operator-reference.md#exhaustAll) | `exhaustAll(): (A*)* => A*` | Subscribe to an inner source only when no inner is active. Ignore new inner sources while the current one is running. |
| [mergeAll](operator-reference.md#mergeAll) | `mergeAll(concurrent?: number): (A*)* => A*` | Subscribe to inner sources as they arrive, up to the concurrency limit, and forward values from all active inners. |
| [switchAll](operator-reference.md#switchAll) | `switchAll(): (A*)* => A*` | Follow only the latest inner source. Each new inner replaces the previous inner subscription immediately. |
| [startWith](operator-reference.md#startWith) | `startWith(...values: B[]): A* => (A \| B)*` | On subscription, emit the supplied values in order, then subscribe to the source and forward its values. |
| [withLatestFrom](operator-reference.md#withLatestFrom) | `withLatestFrom(other: B*): A* => [A, B]*` | When the primary source emits A, pair it with the latest B from the companion. Companion values update the remembered B without triggering output. |
| [combineAll](operator-reference.md#combineAll) † ‡ | `combineAll(): (A*)* => (A[])*` | Collect inner sources until outer completion, then emit arrays of their latest values. This is the older name for combineLatestAll. |
| [combineLatest (pipeable)](operator-reference.md#combineLatest-operator) † ‡ | `combineLatest(other: B*): A* => [A, B]*` | Combine the primary source with companions so every input update emits their latest-value tuple once all inputs have emitted. |
| [combineLatestWith](operator-reference.md#combineLatestWith) ‡ | `combineLatestWith(other: B*): A* => [A, B]*` | After both inputs have supplied a value, any new value from either input emits a tuple containing their latest values. |
| [concat (pipeable)](operator-reference.md#concat-operator) † ‡ | `concat(other: B*): A* => (A \| B)*` | Forward the primary source, then subscribe to each supplied companion in order after the previous source completes. |
| [concatWith](operator-reference.md#concatWith) ‡ | `concatWith(other: B*): A* => (A \| B)*` | Forward the primary source, then subscribe to the companion after the primary completes and forward the companion. |
| [endWith](operator-reference.md#endWith) ‡ | `endWith(...values: B[]): A* => (A \| B)*` | Forward the source, then emit the supplied values in order after normal source completion and complete the result. |
| [merge (pipeable)](operator-reference.md#merge-operator) † ‡ | `merge(other: B*): A* => (A \| B)*` | Subscribe to the primary and companion sources and interleave their arriving values into one result. |
| [mergeWith](operator-reference.md#mergeWith) ‡ | `mergeWith(other: B*): A* => (A \| B)*` | Subscribe to the primary and companion sources and forward each input's values as they arrive. |
| [race (pipeable)](operator-reference.md#race-operator) † ‡ | `race(other: B*): A* => (A \| B)*` | Race the primary and companion sources: the first next chooses a source to follow, while a first complete or error ends the result immediately. |
| [raceWith](operator-reference.md#raceWith) ‡ | `raceWith(other: B*): A* => (A \| B)*` | Let the first input notification decide the result. A first next selects that source for the remaining output; a first complete or error ends the result immediately. |
| [zip (pipeable)](operator-reference.md#zip-operator) † ‡ | `zip(other: B*): A* => [A, B]*` | Combine equally numbered values from the primary and companion sources into tuples, waiting until every input has its next unpaired value. |
| [zipAll](operator-reference.md#zipAll) ‡ | `zipAll(): (A*)* => (A[])*` | Collect inner sources until the outer completes, then combine their first values, second values, and later matching positions into arrays. |
| [zipWith](operator-reference.md#zipWith) ‡ | `zipWith(other: B*): A* => [A, B]*` | Pair the first value from each input, then the second from each, and so on. Emit a tuple whenever every input has its next unpaired value available. |

## Multicasting Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [multicast](operator-reference.md#multicast) † | `multicast(connector: () => Subject<A>): A* => ConnectableObservable<A>` | Routes one connected source execution through a Subject chosen by the caller. The returned legacy connectable exposes explicit connection control. |
| [publish](operator-reference.md#publish) † | `publish(): A* => ConnectableObservable<A>` | Creates a legacy connectable backed by one plain Subject, sharing live values without replay. |
| [publishBehavior](operator-reference.md#publishBehavior) † | `publishBehavior(seed: A): A* => ConnectableObservable<A>` | Creates a legacy connectable backed by a BehaviorSubject. While the subject is active, a listener immediately receives its current value, initially the seed. |
| [publishLast](operator-reference.md#publishLast) † | `publishLast(): A* => ConnectableObservable<A>` | Creates a legacy connectable backed by an AsyncSubject. It remembers the latest source value and publishes that value only when the source completes normally. |
| [publishReplay](operator-reference.md#publishReplay) † | `publishReplay(bufferSize?: number, windowTime?: number): A* => ConnectableObservable<A>` | Creates a legacy connectable backed by one ReplaySubject. New listeners first receive eligible cached values, then live values. |
| [share](operator-reference.md#share) | `share(config?: ShareConfig<A>): A* => A*` | Shares a source connection among listeners attached to the same shared Observable instance. The default connector is a plain Subject, so it forwards live values without replay. |
| [connect](operator-reference.md#connect) ‡ | `connect(selector: A* => B*, config?: ConnectConfig<A>): A* => B*` | Gives a selector a shared view of the source, then connects the source after the selected result has been subscribed. This lets several branches observe one source execution within that result subscription. |
| [connectable](operator-reference.md#connectable) ‡ | `connectable(source: A*, config?: ConnectableConfig<A>): Connectable<A>` | Create a shared stream with an explicit connection switch. Subscribers attach to the shared subject; connect() starts the source subscription. |
| [refCount](operator-reference.md#refCount) † ‡ | `refCount(): ConnectableObservable<A> => A*` | Adds listener-count control to a legacy ConnectableObservable: connect for the first listener and disconnect an active shared connection after the last listener leaves. |
| [shareReplay](operator-reference.md#shareReplay) ‡ | `shareReplay(config: ShareReplayConfig): A* => A*` | Shares through a ReplaySubject so late listeners receive eligible cached values before live values. |

## Error Handling Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [catchError](operator-reference.md#catchError) | `catchError(recover: unknown => B*): A* => (A \| B)*` | Forwards source values until an error, then replaces the failed subscription with the Observable returned by recover. |
| [retry](operator-reference.md#retry) | `retry(config?: number \| RetryConfig): A* => A*` | On source error, subscribes to the source again, up to the retry policy. Every attempt can contribute values to the same output. |
| [retryWhen](operator-reference.md#retryWhen) † | `retryWhen(notifier: unknown* => unknown*): A* => A*` | Feeds source errors into a notifier factory. Notifier next values request new subscriptions to the source. |
| [onErrorResumeNext (pipeable)](operator-reference.md#onErrorResumeNext-operator) † ‡ | `onErrorResumeNext(next: B*): A* => (A \| B)*` | The legacy pipeable name for onErrorResumeNextWith. It advances to the next input when the current input completes or errors. |
| [onErrorResumeNextWith](operator-reference.md#onErrorResumeNextWith) ‡ | `onErrorResumeNextWith(next: B*): A* => (A \| B)*` | Concatenates subscriptions, advancing to the next input after either normal completion or error. Errors from the constituent inputs are swallowed. |

## Utility Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [tap](operator-reference.md#tap) | `tap(effect: A => void): A* => A*` | Runs an effect for each source value and forwards that same value. The callback return value is ignored. |
| [delay](operator-reference.md#delay) | `delay(due: number \| Date, scheduler?: SchedulerLike): A* => A*` | Holds source values until their scheduled release time. A numeric due delays each value by that duration; a Date is an absolute release time. |
| [delayWhen](operator-reference.md#delayWhen) | `delayWhen(release: A => unknown*): A* => A*` | Creates a release Observable for each source value. The first next from that Observable releases that value. |
| [dematerialize](operator-reference.md#dematerialize) | `dematerialize(): Notice<A>* => A*` | Interprets notification objects as real next, error, and complete notifications. |
| [materialize](operator-reference.md#materialize) | `materialize(): A* => Notice<A>*` | Turns next, error, and complete notifications into ordinary next values describing those notifications. |
| [observeOn](operator-reference.md#observeOn) | `observeOn(scheduler: SchedulerLike, delay?: number): A* => A*` | Schedules delivery of next, error, and complete notifications to the downstream listener. |
| [subscribeOn](operator-reference.md#subscribeOn) | `subscribeOn(scheduler: SchedulerLike, delay?: number): A* => A*` | Schedules the act of subscribing to the source, including the work performed as that subscription starts. |
| [timeInterval](operator-reference.md#timeInterval) | `timeInterval(scheduler?: SchedulerLike): A* => { value: A; interval: number }*` | Pairs each source value with the elapsed clock time since the preceding source value, or since subscription for the first value. |
| [timestamp](operator-reference.md#timestamp) | `timestamp(clock?: TimestampProvider): A* => { value: A; timestamp: number }*` | Pairs each source value with the current clock reading at the point this operator receives it. |
| [timeout](operator-reference.md#timeout) | `timeout(due: number \| Date, scheduler?: SchedulerLike): A* => A* / timeout(config: TimeoutConfig<A, B*> & { with: TimeoutInfo<A> => B* }): A* => (A \| B)*` | Enforces a deadline for receiving a source value. On expiry it unsubscribes the source and either errors or switches to a configured fallback. |
| [timeoutWith](operator-reference.md#timeoutWith) † | `timeoutWith(due: number \| Date, fallback: B*, scheduler?: SchedulerLike): A* => (A \| B)*` | The older timeout form that switches to a supplied fallback when a source-value deadline expires. |
| [toArray](operator-reference.md#toArray) | `toArray(): A* => (A[])*` | Collects source values into one array and emits that array when the source completes normally. |
| [finalize](operator-reference.md#finalize) ‡ | `finalize(cleanup: () => void): A* => A*` | Registers cleanup for the subscription. It runs when that subscription ends through completion, error, or unsubscription. |
| [repeat](operator-reference.md#repeat) ‡ | `repeat(config?: number \| RepeatConfig): A* => A*` | On normal source completion, subscribes again according to the repeat policy. Source errors still terminate the result. |
| [repeatWhen](operator-reference.md#repeatWhen) † ‡ | `repeatWhen(notifier: void* => unknown*): A* => A*` | Feeds source completion signals into a notifier factory. Each notifier next requests another source subscription. |

## Conditional and Boolean Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [defaultIfEmpty](operator-reference.md#defaultIfEmpty) | `defaultIfEmpty(fallback: B): A* => (A \| B)*` | Forwards source values. If the source completes normally without any value, it emits the fallback before completing. |
| [every](operator-reference.md#every) | `every(predicate: A => boolean): A* => boolean*` | Emits false and completes at the first value that fails the predicate. If all received values pass and the source completes, it emits true. |
| [find](operator-reference.md#find) | `find(predicate: A => boolean): A* => (A \| undefined)*` | Emits the first matching value and completes. If the source completes without a match, it emits undefined and completes. |
| [findIndex](operator-reference.md#findIndex) | `findIndex(predicate: A => boolean): A* => number*` | Emits the zero-based index of the first matching source value and completes. If the source completes with no match, it emits -1. |
| [isEmpty](operator-reference.md#isEmpty) | `isEmpty(): A* => boolean*` | Emits false and completes as soon as a source value arrives. Emits true only when the source completes without a value. |
| [sequenceEqual](operator-reference.md#sequenceEqual) ‡ | `sequenceEqual(other: A*, equal?: (A, A) => boolean): A* => boolean*` | Compares the two sequences by value position, ignoring differences in their emission times. It emits one boolean once equality or inequality can be decided. |
| [throwIfEmpty](operator-reference.md#throwIfEmpty) ‡ | `throwIfEmpty(errorFactory?: () => unknown): A* => A*` | Passes source values through, but replaces an empty normal completion with an error. |

## Mathematical and Aggregate Operators

| API | Shorthand | Behavior |
| --- | --- | --- |
| [count](operator-reference.md#count) | `count(predicate?: A => boolean): A* => number*` | Counts received source values, or only the values satisfying a predicate, and emits the total on normal completion. |
| [max](operator-reference.md#max) | `max(compare?: (A, A) => number): A* => A*` | Remembers the greatest source value and emits it on normal completion. |
| [min](operator-reference.md#min) | `min(compare?: (A, A) => number): A* => A*` | Remembers the least source value and emits it on normal completion. |
| [reduce](operator-reference.md#reduce) | `reduce(reducer: (S, A) => S, seed: S): A* => S*` | Updates accumulated state for each source value, then emits only the final state on normal completion. |

† Deprecated API in the pinned version. ‡ Supplement to the supplied operator list. An operator with only deprecated overloads is not marked deprecated.

[^gpt6]: These definitions and teaching notes were created with the help of GPT-6 Astra, under the course direction of Hans Schenker.
