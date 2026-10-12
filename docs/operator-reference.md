# RxJS Deep Dive: Stream Signature Reference

**RxJS 7.8.2 · Edition 1.0 · 147 API entries**

A signature shows the shape. The short description supplies the behavior policy. The execution notes explain the boundary cases that matter.[^gpt6]

Cω-inspired stream shorthand that translates into ordinary TypeScript types. It is explanatory notation, not syntax accepted by the TypeScript compiler.

**Start here:** [Notation and TypeScript translation](notation.md) · [Teaching guide and exercises](teaching-guide.md) · [Compact signature index](signature-index.md) · [Occurrence refinements](cardinality.md) · [Searchable reference](index.html)

## Reading the notation

| Notation | Meaning |
| --- | --- |
| `A, B` | Input and output payload types. S is accumulated state; K is a key; O is an opening-signal payload; R is a registration token; D is a default-value type. |
| `A*` | Observable<A>: a stream with zero or more next values per subscription. The type does not promise values, completion, a clock, or shared execution. |
| `A? / A! / A+` | Optional occurrence refinements: zero or one / exactly one / one or more next values. State the lifetime and termination assumptions. Ordinary Observable<A> does not enforce these bounds. |
| `A[] / (A[])*` | An array value / an Observable whose next values are arrays. |
| `[A*, B*] / [A, B]*` | A tuple of two sources / a stream of two-value tuples. |
| `(A*)*` | An outer stream whose next values are inner streams. |
| `A => B` | A value function; in TypeScript write (value: A) => B. |
| `A* => B*` | A source-to-result transformation; in TypeScript write (source: Observable<A>) => Observable<B>. |
| `Input<A>` | ObservableInput<A>: Observable, promise-like, iterable, async iterable, array-like, interoperable Observable, or readable-stream-like input. |
| `(A \| B)*` | A stream whose next values can belong to either payload type. |
| `A & B` | A value satisfying both structural requirements; used for a group stream with a key property. |
| `never*` | No next payload values. Completion, error, or remaining open must be described separately. |
| `Notice<A>` | ObservableNotification<A>: { kind: "N"; value: A } \| { kind: "E"; error: unknown } \| { kind: "C" }. |
| `param?: Type` | An optional configuration parameter. This question mark is parameter syntax, not the stream-cardinality suffix. |

- The cards show selected common forms. Callback indices, some optional parameters, and the exhaustive overload sets live in the linked API and pinned source.
- Creation functions return Observables directly. Most pipeable functions return transformations used by pipe; partition and connectable forms have explicitly different result shapes.
- Unless a card says otherwise, next, error, complete, and unsubscription are separate concerns. Unsubscription is not a complete notification.
- Examples omit imports and generally show Observable expressions, not subscribe calls. Their next/complete comments describe a subscription allowed to finish; external-request outcomes remain conditional.
- Durations normally use milliseconds with asyncScheduler. A supplied scheduler can provide a different or virtual clock. Integer counts and positive concurrency limits are the teaching defaults.
- null and undefined are ordinary emitted values. of(undefined) emits once; EMPTY emits no next values.
- An operator factory builds a description. Work starts through subscription, although argument expressions and eager input creation may already have run.
- Shorthand describes type shape. Read the adjacent behavior policy and execution details before claiming two operators are equivalent.

## Contents

- [Creation Operators](#creation-operators) — 24 entries (15 requested, 9 supplemental)
- [Join Creation Operators](#join-creation-operators) — 8 entries (7 requested, 1 supplemental)
- [Transformation Operators](#transformation-operators) — 29 entries (28 requested, 1 supplemental)
- [Filtering Operators](#filtering-operators) — 25 entries (25 requested, 0 supplemental)
- [Join Operators](#join-operators) — 20 entries (7 requested, 13 supplemental)
- [Multicasting Operators](#multicasting-operators) — 10 entries (6 requested, 4 supplemental)
- [Error Handling Operators](#error-handling-operators) — 5 entries (3 requested, 2 supplemental)
- [Utility Operators](#utility-operators) — 15 entries (12 requested, 3 supplemental)
- [Conditional and Boolean Operators](#conditional-and-boolean-operators) — 7 entries (5 requested, 2 supplemental)
- [Mathematical and Aggregate Operators](#mathematical-and-aggregate-operators) — 4 entries (4 requested, 0 supplemental)

Coverage includes every function exported by rxjs/operators in 7.8.2, all core static creation exports, and the listed related creation APIs. [Exact scope and exclusions](coverage.md).

<a id="creation-operators"></a>
## Creation Operators

Start from values, callbacks, events, requests, or a clock. Read when work begins and how the subscription ends.

<a id="ajax"></a>
### ajax

Current API · Requested list · Import: `rxjs/ajax` · API role: creation

```text
ajax(request: string | AjaxConfig): AjaxResponse<A>*
```

**Behavior.** Start an XMLHttpRequest on subscription and emit response objects containing a payload of type A. With the default progress settings, a successful request emits its response and completes.

**Execution details.**

- Each subscription creates a request. Defaults include GET, asynchronous operation, and JSON response decoding.
- Network errors, timeouts, and HTTP statuses of 400 or above use the error channel.
- Unsubscribing aborts an unfinished request.
- Enabling upload or download progress adds response-shaped progress emissions; ajax is therefore not universally a one-value stream.

**Example.**

```ts
ajax<{ name: string }>('/api/profile')
// On a successful default request: next an AjaxResponse whose response is the profile; complete.
```

**Scope and overloads.** A names the decoded response payload, not the entire response wrapper; the type argument performs no runtime validation. ajax.getJSON<A>(url): A* selects only the response body. GET/POST/PUT/PATCH/DELETE helpers and AjaxConfig provide request options.

**References.** [API](https://rxjs.dev/api/ajax/ajax) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/ajax/ajax.ts)

**Compare.** [fromFetch](#fromFetch) · [defer](#defer)

---

<a id="bindCallback"></a>
### bindCallback

Current API · Requested list · Import: `rxjs` · API role: creation

```text
bindCallback(fn: (arg: A, callback: B => void) => void): A => B*
```

**Behavior.** Turn a callback API into a function that returns a stream of its result. Calling the bound function prepares that stream; its first subscription invokes the original function.

**Execution details.**

- For a normal single-result callback, emit its result and complete when the callback resolves.
- Subscribers to the same returned Observable share one invocation and receive its cached result, including late subscribers. Calling the bound function again creates a separate result stream.
- Unsubscribing removes this observer; it does not supply a cancellation mechanism to the callback API.

**Example.**

```ts
const double = (n: number, done: (result: number) => void) => done(n * 2);
bindCallback(double)(3) // next: 6; complete synchronously
```

**Scope and overloads.** Shown for one input argument and one callback result. Real signatures preserve arbitrary argument tuples; several result arguments become one tuple, while no result arguments produce one undefined value. An optional scheduler controls invocation and delivery; a result-selector form also exists.

**References.** [API](https://rxjs.dev/api/index/function/bindCallback) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/bindCallback.ts)

**Compare.** [bindNodeCallback](#bindNodeCallback) · [fromEventPattern](#fromEventPattern)

---

<a id="bindNodeCallback"></a>
### bindNodeCallback

Current API · Requested list · Import: `rxjs` · API role: creation

```text
bindNodeCallback(fn: (arg: A, callback: (error: unknown, value: B) => void) => void): A => B*
```

**Behavior.** Adapt a Node-style error-first callback. A successful callback supplies the result value; an error argument terminates the stream through the error channel.

**Execution details.**

- Only null or undefined in the error slot means success; other values count as errors.
- The original function runs on the first subscription to each returned Observable. That Observable shares and caches its callback result for later subscribers.
- This adapter does not automatically cancel the underlying operation when a subscriber unsubscribes.

**Example.**

```ts
const lengthOf = (s: string, done: (err: Error | null, n: number) => void) => done(null, s.length);
bindNodeCallback(lengthOf)('RxJS') // next: 4; complete synchronously
```

**Scope and overloads.** Shown for one input and one success result. Real signatures preserve argument tuples; multiple success results become one tuple, and no success result produces undefined. Optional scheduler and result-selector forms are available.

**References.** [API](https://rxjs.dev/api/index/function/bindNodeCallback) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/bindNodeCallback.ts)

**Compare.** [bindCallback](#bindCallback) · [from](#from)

---

<a id="defer"></a>
### defer

Current API · Requested list · Import: `rxjs` · API role: creation

```text
defer(factory: () => Input<A>): A*
```

**Behavior.** Run the factory separately for each subscription, convert its result to an Observable, and forward that execution.

**Execution details.**

- The factory runs when subscribed, not when defer is called.
- A thrown factory error becomes an error notification.
- A promise created inside the factory starts at subscription time. Returning an already-created promise does not restart its work.

**Example.**

```ts
const value$ = defer(() => of(Math.random()));
// Each subscription draws a new number, emits it, and completes.
```

**Scope and overloads.** The factory can return any ObservableInput, including an Observable, promise, array, or iterable.

**References.** [API](https://rxjs.dev/api/index/function/defer) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/defer.ts)

**Compare.** [from](#from) · [iif](#iif) · [using](#using)

---

<a id="empty"></a>
### empty

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: creation

```text
empty(scheduler?: SchedulerLike): never*
```

**Behavior.** Create a stream that completes without emitting a value.

**Execution details.**

- Without a scheduler, this returns EMPTY and completes synchronously on subscription.
- With a scheduler, schedule the completion notification; unsubscribing first cancels that scheduled completion.

**Example.**

```ts
empty() // no next values; complete synchronously
```

**Scope and overloads.** This function is deprecated in RxJS 7.8.2. EMPTY expresses the usual immediate form.

**Modern alternative.** EMPTY; for scheduled completion, scheduled([], scheduler).

**References.** [API](https://rxjs.dev/api/index/function/empty) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/empty.ts)

**Compare.** [EMPTY](#EMPTY) · [NEVER](#NEVER) · [throwError](#throwError)

---

<a id="from"></a>
### from

Current API · Requested list · Import: `rxjs` · API role: creation

```text
from(input: Input<A>): A*
```

**Behavior.** Convert an Observable-compatible input into a stream of its values. The input kind determines how those values become available.

**Execution details.**

- Arrays and synchronous iterables emit their items synchronously by default, then complete when exhausted.
- A promise emits its resolved value and completes, or reports its rejection as an error. Its underlying work may already have started.
- An existing Observable retains its execution behavior. Unsubscribing from a promise conversion stops delivery but does not cancel the promise itself.

**Example.**

```ts
from([1, 2, 3]) // next: 1, 2, 3; complete synchronously
```

**Scope and overloads.** Input<A> includes Observable, interoperable Observable, promise-like, array-like, iterable, async iterable, and readable-stream-like inputs. The scheduler-argument overload is deprecated; use scheduled(input, scheduler).

**References.** [API](https://rxjs.dev/api/index/function/from) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/from.ts)

**Compare.** [of](#of) · [scheduled](#scheduled) · [defer](#defer)

---

<a id="fromEvent"></a>
### fromEvent

Current API · Requested list · Import: `rxjs` · API role: creation

```text
fromEvent(target: EventTarget, eventName: string, options?: AddEventListenerOptions): A*
```

**Behavior.** Turn events from a target into values. In the common DOM form, each event object becomes one emitted value.

**Execution details.**

- Each subscription installs its own listener; unsubscription removes that listener.
- An event source does not complete merely because no more events arrive.
- DOM options such as once affect the listener; once does not send an RxJS complete notification.

**Example.**

```ts
fromEvent<MouseEvent>(document, 'click')
// next: each click event; unsubscribe removes this listener
```

**Scope and overloads.** Shown for a DOM EventTarget with an explicitly selected event type A. Node-style and jQuery-style emitters and collections of targets are also supported. Multiple event-handler arguments are emitted as one array; result-selector forms can project them.

**References.** [API](https://rxjs.dev/api/index/function/fromEvent) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/fromEvent.ts)

**Compare.** [fromEventPattern](#fromEventPattern) · [takeUntil](#takeUntil)

---

<a id="fromEventPattern"></a>
### fromEventPattern

Current API · Requested list · Import: `rxjs` · API role: creation

```text
fromEventPattern(addHandler: (handler: A => void) => R, removeHandler?: (handler: A => void, token: R) => void): A*
```

**Behavior.** Adapt an event API by supplying the functions that attach and detach a handler. Every handler call supplies an emission.

**Execution details.**

- addHandler runs for each subscription. Its return value is a registration token, passed to removeHandler together with the same handler during teardown.
- If removeHandler is omitted, this adapter cannot detach the registration for you.
- Events continue until the subscription ends; the adapter has no automatic completion signal.

**Example.**

```ts
fromEventPattern<Event>(
  handler => document.addEventListener('visibilitychange', handler),
  handler => document.removeEventListener('visibilitychange', handler)
) // next: visibility events; unsubscribe detaches the handler
```

**Scope and overloads.** Shown for a handler receiving one A and a registration token R, which may be void. Several handler arguments become one array, while zero handler arguments become an empty array. An optional result selector can map the handler arguments.

**References.** [API](https://rxjs.dev/api/index/function/fromEventPattern) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/fromEventPattern.ts)

**Compare.** [fromEvent](#fromEvent) · [bindCallback](#bindCallback)

---

<a id="generate"></a>
### generate

Current API · Requested list · Import: `rxjs` · API role: creation

```text
generate(options: {
  initialState: S,
  condition?: S => boolean,
  iterate: S => S,
  resultSelector: S => A,
  scheduler?: SchedulerLike
}): A*
```

**Behavior.** Generate a sequence by repeatedly testing a state, projecting a value, and advancing the state. Stop when the condition becomes false.

**Execution details.**

- The condition is checked before emitting from the initial state and before every later state.
- Without a scheduler, the loop runs synchronously; an unbounded loop can occupy the current call stack until unsubscribed or interrupted by an error.
- A supplied scheduler schedules iteration. Each subscription starts again from initialState.

**Example.**

```ts
generate({ initialState: 1, condition: n => n <= 3, iterate: n => n + 1, resultSelector: n => n * n })
// next: 1, 4, 9; complete synchronously
```

**Scope and overloads.** Without resultSelector, emit the state itself: S*. Omitting condition generates without a condition-based stopping point. The older positional-argument overloads are deprecated; the options-object form is current.

**References.** [API](https://rxjs.dev/api/index/function/generate) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/generate.ts)

**Compare.** [range](#range) · [expand](#expand) · [scan](#scan)

---

<a id="interval"></a>
### interval

Current API · Requested list · Import: `rxjs` · API role: creation

```text
interval(period?: number, scheduler?: SchedulerLike): number*
```

**Behavior.** Emit an increasing counter at a recurring interval, starting with 0 after the first period.

**Execution details.**

- Defaults are period = 0 and asyncScheduler; a negative period is treated as 0.
- Each subscription starts its own counter and scheduled work.
- It has no natural completion. Unsubscribing cancels its scheduled work.

**Example.**

```ts
interval(1000).pipe(take(3))
// next: 0, 1, 2 on successive one-second periods; then complete
```

**Scope and overloads.** Periods use milliseconds with the default scheduler; actual delivery follows the selected scheduler and host timing.

**References.** [API](https://rxjs.dev/api/index/function/interval) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/interval.ts)

**Compare.** [timer](#timer) · [animationFrames](#animationFrames)

---

<a id="of"></a>
### of

Current API · Requested list · Import: `rxjs` · API role: creation

```text
of(...values: A[]): A*
```

**Behavior.** Emit the supplied argument values in order, then complete. Each argument stays a single value.

**Execution details.**

- By default, emission and completion happen synchronously during subscription.
- Arrays, promises, null, and undefined are emitted as values; of does not unpack them.
- With no arguments, complete without a next value.

**Example.**

```ts
of([1, 2], [3]) // next: [1, 2], [3]; complete synchronously
```

**Scope and overloads.** For heterogeneous arguments, A is their union. Scheduler-argument overloads are deprecated; use scheduled(values, scheduler) when scheduling these values is intended.

**References.** [API](https://rxjs.dev/api/index/function/of) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/of.ts)

**Compare.** [from](#from) · [EMPTY](#EMPTY)

---

<a id="range"></a>
### range

Current API · Requested list · Import: `rxjs` · API role: creation

```text
range(start: number, count: number): number*
```

**Behavior.** Emit count numbers, starting at start and increasing by 1, then complete.

**Execution details.**

- The common form emits synchronously during subscription.
- A count of zero or less produces an empty completion; use nonnegative integer counts for the intended counting contract.
- Downstream unsubscription stops the loop before later values are emitted.

**Example.**

```ts
range(3, 3) // next: 3, 4, 5; complete synchronously
```

**Scope and overloads.** The single argument is the count: range(3) starts at 0 and emits 0, 1, 2. The scheduler-argument overload is deprecated; scheduled(range(start, count), scheduler) schedules observable subscription and delivery.

**References.** [API](https://rxjs.dev/api/index/function/range) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/range.ts)

**Compare.** [generate](#generate) · [of](#of) · [scheduled](#scheduled)

---

<a id="throwError"></a>
### throwError

Current API · Requested list · Import: `rxjs` · API role: creation

```text
throwError(errorFactory: () => unknown): never*
```

**Behavior.** Create a stream that reports an error as soon as it is subscribed.

**Execution details.**

- The factory runs for each subscription, so an error object can be created at the point of execution.
- The result emits no next values and terminates with error, rather than complete.

**Example.**

```ts
throwError(() => new Error('Failed')) // no next values; error: Failed
```

**Scope and overloads.** The overload accepting an error value directly and the scheduler-argument overload are deprecated. The error factory form is current.

**References.** [API](https://rxjs.dev/api/index/function/throwError) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/throwError.ts)

**Compare.** [EMPTY](#EMPTY) · [NEVER](#NEVER) · [catchError](#catchError)

---

<a id="timer"></a>
### timer

Current API · Requested list · Import: `rxjs` · API role: creation

```text
timer(due: number | Date, scheduler?: SchedulerLike): number*
```

**Behavior.** Wait until the due time, emit 0, and complete. A separate repeating form continues with an increasing counter.

**Execution details.**

- A numeric due time is relative to subscription; a Date is interpreted against scheduler.now(). Past due times are treated as zero delay.
- The default scheduler is asyncScheduler, so timer(0) schedules its emission rather than behaving like synchronous of(0).
- timer(startDue, period, scheduler?) emits 0 at the start time and then 1, 2, ... at that period; a nonnegative period makes it recurring.
- Unsubscribing cancels the scheduled work. The repeating form has no natural completion.

**Example.**

```ts
timer(1000) // after the scheduled delay: next 0; complete
```

**Scope and overloads.** Shown for the one-shot overload, whose runtime value is 0; the public TypeScript payload type is number. The repeating overload also returns number*. A negative interval duration is treated as a one-shot timer in 7.8.2.

**References.** [API](https://rxjs.dev/api/index/function/timer) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/timer.ts)

**Compare.** [interval](#interval) · [delay](#delay) · [takeUntil](#takeUntil)

---

<a id="iif"></a>
### iif

Current API · Requested list · Import: `rxjs` · API role: creation

```text
iif(condition: () => boolean, whenTrue: Input<A>, whenFalse: Input<B>): (A | B)*
```

**Behavior.** Choose one of two inputs at subscription time and forward that chosen execution.

**Execution details.**

- Evaluate condition for every subscription and subscribe only to the selected input.
- Constructing the branch arguments still follows normal JavaScript evaluation. Wrap branch work in defer when its creation must also wait.
- A thrown condition error goes to the error channel.

**Example.**

```ts
iif(() => true, of('yes'), of('no')) // next: 'yes'; complete
```

**Scope and overloads.** Both branches accept ObservableInput. The result payload is the union of their value types.

**References.** [API](https://rxjs.dev/api/index/function/iif) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/iif.ts)

**Compare.** [defer](#defer) · [EMPTY](#EMPTY)

---

<a id="animationFrames"></a>
### animationFrames

Current API · Supplement · Import: `rxjs` · API role: creation

```text
animationFrames(timestampProvider?: TimestampProvider): ({ timestamp: number, elapsed: number })*
```

**Behavior.** Emit a timing record on each animation frame. elapsed measures the time since this subscription began.

**Execution details.**

- Uses requestAnimationFrame; each subscription has its own frame loop and starting time.
- Without a custom provider, timestamp comes from the animation-frame callback and elapsed uses performance timing.
- A custom TimestampProvider supplies the current time used for both fields. Unsubscription cancels the pending frame request.

**Example.**

```ts
animationFrames().pipe(take(2))
// next: timing records for two animation frames; then complete
```

**Scope and overloads.** Requires an environment with animation-frame support. It does not complete by itself.

**References.** [API](https://rxjs.dev/api/index/function/animationFrames) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/dom/animationFrames.ts)

**Compare.** [interval](#interval) · [timestamp](#timestamp)

---

<a id="EMPTY"></a>
### EMPTY

Current API · Supplement · Import: `rxjs` · API role: constant

```text
EMPTY: never*
```

**Behavior.** An Observable constant that completes immediately without emitting a value.

**Execution details.**

- Each subscription receives a synchronous complete notification.
- It differs from of(undefined), which emits one undefined value before completing.

**Example.**

```ts
EMPTY // when subscribed: no next values; complete synchronously
```

**Scope and overloads.** Use this constant for immediate empty completion; scheduled([], scheduler) makes completion scheduled.

**References.** [API](https://rxjs.dev/api/index/const/EMPTY) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/empty.ts)

**Compare.** [empty](#empty) · [NEVER](#NEVER) · [throwError](#throwError)

---

<a id="fromFetch"></a>
### fromFetch

Current API · Supplement · Import: `rxjs/fetch` · API role: creation

```text
fromFetch(input: string | Request, init?: RequestInit): Response*
```

**Behavior.** Start a fetch request per subscription. In the default form, emit the Response when it is available and then complete; reading its body is a separate step.

**Execution details.**

- HTTP error status codes still produce Response values; inspect response.ok or response.status when deciding whether to treat them as errors.
- Network failures and abort failures use the error channel.
- Unsubscribing while the fetch is pending aborts it. In the default form, automatic abort stops once the Response has been delivered.
- The selector form keeps the request abortable while the selected input, such as response.json(), is being consumed.

**Example.**

```ts
fromFetch('/api/profile', { selector: response => response.json() })
// On successful JSON decoding: next the decoded body; complete
```

**Scope and overloads.** With init.selector: Response => Input<A>, the result is A*. Use that form to include body consumption in the subscription's lifetime; the return type of response.json() itself does not validate a domain schema.

**References.** [API](https://rxjs.dev/api/fetch/fromFetch) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/dom/fetch.ts)

**Compare.** [ajax](#ajax) · [switchMap](#switchMap) · [catchError](#catchError)

---

<a id="never"></a>
### never

Deprecated in 7.8.2 · Supplement · Import: `rxjs` · API role: creation

```text
never(): never*
```

**Behavior.** Return NEVER: a stream that sends no notifications and has no natural termination.

**Execution details.**

- The returned subscription stays open until it is unsubscribed or another operator ends it.
- This legacy function and the NEVER constant describe the same behavior.

**Example.**

```ts
never() // when subscribed: no next, no error, no complete
```

**Scope and overloads.** The function is deprecated in RxJS 7.8.2.

**Modern alternative.** NEVER

**References.** [API](https://rxjs.dev/api/index/function/never) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/never.ts)

**Compare.** [NEVER](#NEVER) · [EMPTY](#EMPTY)

---

<a id="NEVER"></a>
### NEVER

Current API · Supplement · Import: `rxjs` · API role: constant

```text
NEVER: never*
```

**Behavior.** An Observable constant that sends no next, error, or complete notifications.

**Execution details.**

- A subscription remains open until explicitly unsubscribed or ended by another operator.
- The type never* says only that there are no next values; the absence of completion is this constant's behavior.

**Example.**

```ts
NEVER.pipe(takeUntil(timer(1000)))
// no next values; complete when the timer emits
```

**References.** [API](https://rxjs.dev/api/index/const/NEVER) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/never.ts)

**Compare.** [EMPTY](#EMPTY) · [never](#never) · [takeUntil](#takeUntil)

---

<a id="pairs"></a>
### pairs

Deprecated in 7.8.2 · Supplement · Import: `rxjs` · API role: creation

```text
pairs(object: Record<string, A>, scheduler?: SchedulerLike): [string, A]*
```

**Behavior.** Emit the own enumerable string-keyed entries of an object as key-value tuples, then complete.

**Execution details.**

- The implementation calls Object.entries when pairs is called, so the entry array is captured before subscription.
- Without a scheduler, emit the entries synchronously on subscription. Symbol keys and inherited properties are not included.
- The tuples hold the original property values; referenced objects are not deeply copied.

**Example.**

```ts
pairs({ a: 1, b: 2 }) // next: ['a', 1], ['b', 2]; complete
```

**Scope and overloads.** Shown for a homogeneous string-keyed record. The legacy API has additional input overloads and an optional scheduler. Its implementation uses Object.entries rather than consuming an iterable protocol.

**Modern alternative.** from(Object.entries(object)); use scheduled(Object.entries(object), scheduler) for scheduled delivery.

**References.** [API](https://rxjs.dev/api/index/function/pairs) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/pairs.ts)

**Compare.** [from](#from) · [scheduled](#scheduled)

---

<a id="scheduled"></a>
### scheduled

Current API · Supplement · Import: `rxjs` · API role: creation

```text
scheduled(input: Input<A>, scheduler: SchedulerLike): A*
```

**Behavior.** Convert an input into an Observable while using the supplied scheduler to control its consumption and delivery.

**Execution details.**

- For Observable inputs, subscription and notifications are scheduled. For arrays and synchronous iterables, element production is scheduled.
- The scheduler determines timing; queueScheduler can run work synchronously, while other schedulers defer it.
- Scheduling a promise conversion does not defer the work that created the already-existing promise, and unsubscription does not cancel that promise.

**Example.**

```ts
scheduled([1, 2], asyncScheduler)
// scheduled next: 1, 2; then scheduled complete
```

**Scope and overloads.** Accepts ObservableInput, including async iterables and readable streams. This replaces many deprecated scheduler-argument overloads on creation functions.

**References.** [API](https://rxjs.dev/api/index/function/scheduled) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/scheduled/scheduled.ts)

**Compare.** [from](#from) · [observeOn](#observeOn) · [subscribeOn](#subscribeOn)

---

<a id="using"></a>
### using

Current API · Supplement · Import: `rxjs` · API role: creation

```text
using(resourceFactory: () => (Unsubscribable | void), observableFactory: (Unsubscribable | void) => (Input<A> | void)): A*
```

**Behavior.** Create a resource for a subscription and pass it to a factory that supplies that subscription's values. Dispose the resource when the established execution is torn down.

**Execution details.**

- Both factories run separately for each subscription. The resource exposes an unsubscribe method; the factory may also return no resource.
- After setup succeeds, completion, error, or downstream unsubscription disposes the resource. A void Observable-factory result acts like EMPTY.
- In 7.8.2, cleanup is registered after observableFactory returns: if that factory throws after allocating the resource, provide cleanup for that failure path yourself.

**Example.**

```ts
using(
  () => ({ unsubscribe: () => console.log('disposed') }),
  () => of(1, 2)
) // next: 1, 2; complete; resource cleanup logs 'disposed'
```

**Scope and overloads.** The actual Observable factory can return any ObservableInput, or void. The displayed resource contract is the API's Unsubscribable | void type.

**References.** [API](https://rxjs.dev/api/index/function/using) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/using.ts)

**Compare.** [defer](#defer) · [finalize](#finalize)

---

<a id="webSocket"></a>
### webSocket

Current API · Supplement · Import: `rxjs/webSocket` · API role: creation

```text
webSocket(urlOrConfig: string | WebSocketSubjectConfig<A>): WebSocketSubject<A>
```

**Behavior.** Create a duplex WebSocket endpoint: subscribing receives A values, while calling next sends A values to the server.

**Execution details.**

- The first subscription opens the socket; subscribers to the same WebSocketSubject share that connection. When its last observer unsubscribes, it closes the socket.
- Outgoing values sent before the socket opens are queued. Sending a value does not also emit it locally as an incoming value.
- The default serializer uses JSON.stringify and the default deserializer uses JSON.parse; configure them for a different wire format.
- A clean socket close completes its observers; an unclean close or socket error errors them.

**Example.**

```ts
const messages = webSocket<{ text: string }>('wss://example.test/messages');
// messages.subscribe(...): receive server messages
// messages.next({ text: 'hello' }): send a message
```

**Scope and overloads.** WebSocketSubject<A> is both an A* read side and an Observer<A> write side, so reducing the return type to A* would hide its duplex behavior. Configuration supports custom serialization, deserialization, lifecycle observers, and a WebSocket constructor.

**References.** [API](https://rxjs.dev/api/webSocket/webSocket) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/dom/webSocket.ts)

**Compare.** [fromEvent](#fromEvent) · [share](#share)

---

<a id="join-creation-operators"></a>
## Join Creation Operators

Supply all sources directly. Tuple joins preserve positions; union joins forward values from different sources.

<a id="combineLatest"></a>
### combineLatest

Current API · Requested list · Import: `rxjs` · API role: join-creation

```text
combineLatest(sources: [A*, B*]): [A, B]*
```

**Behavior.** After every source has supplied its first value, emit a tuple of the latest values whenever any source supplies another value.

**Execution details.**

- Subscription order matters for synchronous inputs: earlier sources can emit several times before the later sources are subscribed.
- A completed source keeps its last value available. The result completes when all sources have completed; any source error terminates the result.
- RxJS 7.8.2 still waits for all completions when a source completes empty. Therefore combineLatest([EMPTY, NEVER]) neither emits nor completes.
- With zero sources, complete without a next value.

**Example.**

```ts
combineLatest([of(1, 2), of('a', 'b')])
// next: [2, 'a'], [2, 'b']; complete
```

**Scope and overloads.** Shown for two Observable inputs. Any-length tuples, arrays, and keyed records are supported, and inputs may be ObservableInput. A record produces a record of latest values. Positional-source and scheduler-argument forms are deprecated.

**References.** [API](https://rxjs.dev/api/index/function/combineLatest) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/combineLatest.ts)

**Compare.** [zip](#zip) · [forkJoin](#forkJoin) · [withLatestFrom](#withLatestFrom)

---

<a id="concat"></a>
### concat

Current API · Requested list · Import: `rxjs` · API role: join-creation

```text
concat(first: A*, second: B*): (A | B)*
```

**Behavior.** Subscribe to the sources in sequence. Forward all values from the current source and move to the next only after it completes.

**Execution details.**

- A source that never completes prevents later sources from being subscribed.
- An error ends the sequence immediately; subsequent sources are not started.
- With no sources, complete without a next value. No scheduler is added by the common form.

**Example.**

```ts
concat(of(1, 2), of(3)) // next: 1, 2, 3; complete
```

**Scope and overloads.** Any number of ObservableInput sources can be passed as separate arguments. concat(...sources) joins an array of streams; concat(sources) instead treats that array as one input and emits its elements. A legacy scheduler overload is also available.

**References.** [API](https://rxjs.dev/api/index/function/concat) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/concat.ts)

**Compare.** [concatAll](#concatAll) · [merge](#merge) · [onErrorResumeNext](#onErrorResumeNext)

---

<a id="forkJoin"></a>
### forkJoin

Current API · Requested list · Import: `rxjs` · API role: join-creation

```text
forkJoin(sources: [A*, B*]): [A, B]*
```

**Behavior.** Wait for all sources to complete, then emit one tuple containing each source's last value and complete. Every source must have supplied a value.

**Execution details.**

- If any source completes empty, the result completes without a next value and tears down active subscriptions.
- Otherwise, a source that never completes prevents the final tuple, even if it has already emitted.
- A source error terminates the result and tears down the other active inputs.
- With zero sources, complete without a next value.

**Example.**

```ts
forkJoin([of(1, 2), of('a', 'b')]) // next: [2, 'b']; complete
```

**Scope and overloads.** Shown for a pair of Observables. Tuples of any length, arrays, and keyed records are supported; actual inputs may be ObservableInput. Positional-source overloads are deprecated. The result emits at most one tuple in the selected form.

**References.** [API](https://rxjs.dev/api/index/function/forkJoin) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/forkJoin.ts)

**Compare.** [combineLatest](#combineLatest) · [zip](#zip) · [toArray](#toArray)

---

<a id="merge"></a>
### merge

Current API · Requested list · Import: `rxjs` · API role: join-creation

```text
merge(first: A*, second: B*, concurrent?: number): (A | B)*
```

**Behavior.** Forward values from active sources as they arrive. Several sources may be subscribed at the same time.

**Execution details.**

- Concurrency defaults to Infinity. A positive concurrency limit delays subscriptions to excess sources until active ones complete.
- Inputs are subscribed in argument order; synchronous earlier inputs can finish before later subscriptions begin.
- Complete when all sources finish. An error terminates the result and tears down active inputs; zero sources complete empty.

**Example.**

```ts
merge(of(1, 2), of('a')) // next: 1, 2, 'a'; complete
```

**Scope and overloads.** Shown for two sources; any number of ObservableInput sources can be supplied. Pass a trailing positive number to set concurrency. Scheduler-argument overloads are deprecated.

**References.** [API](https://rxjs.dev/api/index/function/merge) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/merge.ts)

**Compare.** [mergeAll](#mergeAll) · [concat](#concat) · [race](#race)

---

<a id="partition"></a>
### partition

Current API · Requested list · Import: `rxjs` · API role: partition

```text
partition(source: A*, predicate: A => boolean): [A*, A*]
```

**Behavior.** Return two streams: one passes values for which the predicate is true, and the other passes values for which it is false.

**Execution details.**

- This is a pair of Observables, not an Observable that emits pairs.
- Each branch subscribes to the input independently. Subscribing to both can run a cold source twice and evaluate the predicate separately.
- partition does not introduce sharing; arrange sharing explicitly if both branches must observe one source execution.

**Example.**

```ts
const [even$, odd$] = partition(of(1, 2, 3, 4), n => n % 2 === 0);
// even$: 2, 4, complete; odd$: 1, 3, complete (separate subscriptions)
```

**Scope and overloads.** The actual input may be ObservableInput, and predicates receive an index. A type-guard predicate narrows the true branch to B and the other branch to Exclude<A, B>. The standalone function is current; the old pipeable partition is deprecated.

**References.** [API](https://rxjs.dev/api/index/function/partition) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/partition.ts)

**Compare.** [filter](#filter) · [share](#share) · [partition (pipeable)](#partition-operator)

---

<a id="race"></a>
### race

Current API · Requested list · Import: `rxjs` · API role: join-creation

```text
race(sources: [A*, B*]): (A | B)*
```

**Behavior.** The first next value selects the source whose subsequent values are forwarded. A completion or error before any next ends the result immediately.

**Execution details.**

- Once a source wins with a value, unsubscribe the other active candidates and follow the winner through its completion or error.
- Sources are subscribed in order. A synchronous winner or terminal notification can prevent later sources from ever being subscribed.
- Unlike most join creators, race([]) stays open without next values in RxJS 7.8.2.

**Example.**

```ts
race([of('first'), of('second')])
// next: 'first'; complete; the second source is never subscribed
```

**Scope and overloads.** Array and separate-argument forms accept any number of ObservableInput sources. The output payload is the union of source payloads.

**References.** [API](https://rxjs.dev/api/index/function/race) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/race.ts)

**Compare.** [merge](#merge) · [timeout](#timeout) · [takeUntil](#takeUntil)

---

<a id="zip"></a>
### zip

Current API · Requested list · Import: `rxjs` · API role: join-creation

```text
zip(sources: [A*, B*]): [A, B]*
```

**Behavior.** Match values by position: first with first, second with second, and so on. Emit a tuple only when every input has supplied its next unmatched value.

**Execution details.**

- Faster sources wait in per-source queues; this can retain many values when rates differ.
- Complete once a completed input has no buffered value left, because another full tuple is then impossible.
- A source error terminates the result and tears down the other inputs. With zero inputs, complete without next values.

**Example.**

```ts
zip([of(1, 2, 3), of('a', 'b')])
// next: [1, 'a'], [2, 'b']; complete; unmatched 3 is discarded
```

**Scope and overloads.** Any-length tuple and separate-argument forms accept ObservableInput sources. A result-selector overload maps each matched tuple to another payload type.

**References.** [API](https://rxjs.dev/api/index/function/zip) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/zip.ts)

**Compare.** [combineLatest](#combineLatest) · [forkJoin](#forkJoin) · [zipWith](#zipWith)

---

<a id="onErrorResumeNext"></a>
### onErrorResumeNext

Current API · Supplement · Import: `rxjs` · API role: join-creation

```text
onErrorResumeNext(sources: [A*, B*]): (A | B)*
```

**Behavior.** Run sources one after another, moving to the next after either completion or error. Values pass through; source errors do not.

**Execution details.**

- A normally completing source also advances to the next one; this is not a fallback that runs only on error.
- An error from a source is swallowed, so this operator cannot inspect it or choose recovery based on it.
- A source that never ends blocks the remaining sources. Once all sources have ended, complete; an empty list completes immediately.

**Example.**

```ts
onErrorResumeNext([of(1), throwError(() => new Error('skip')), of(2)])
// next: 1, 2; complete; the intermediate error is swallowed
```

**Scope and overloads.** Array and separate-argument forms accept ObservableInput sources. This standalone creator is current. Use onErrorResumeNextWith for the current pipeable form.

**References.** [API](https://rxjs.dev/api/index/function/onErrorResumeNext) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/onErrorResumeNext.ts)

**Compare.** [concat](#concat) · [catchError](#catchError) · [onErrorResumeNextWith](#onErrorResumeNextWith)

---

<a id="transformation-operators"></a>
## Transformation Operators

Change payloads, accumulate state, group values, or choose an Action Policy for inner subscriptions.

<a id="buffer"></a>
### buffer

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
buffer(closingNotifier: unknown*): A* => (A[])*
```

**Behavior.** Collect source values into an array. Each closing notification emits the current array and starts an empty replacement.

**Execution details.**

- A closing next can emit an empty array; closing-notifier completion does not close the buffer or complete the result.
- Source completion emits the remaining array, including an empty one, then completes. Errors and unsubscription discard pending values.
- In RxJS 7.8.2 the source is subscribed before the closing notifier, which matters for synchronous sources.

**Example.**

```ts
of(1, 2, 3).pipe(buffer(NEVER)) // next: [1, 2, 3]; complete
```

**Scope and overloads.** The closing notifier can be any ObservableInput; the shorthand shows an Observable whose payload is ignored.

**References.** [API](https://rxjs.dev/api/operators/buffer) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/buffer.ts)

**Compare.** [bufferCount](#bufferCount) · [bufferTime](#bufferTime) · [bufferWhen](#bufferWhen) · [window](#window)

---

<a id="bufferCount"></a>
### bufferCount

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
bufferCount(bufferSize: number, startBufferEvery?: number): A* => (A[])*
```

**Behavior.** Collect values into arrays and emit each array when it reaches the chosen size.

**Execution details.**

- With positive counts, the default start interval is bufferSize, producing consecutive batches. A smaller interval overlaps buffers; a larger interval leaves gaps.
- Source completion emits all remaining partial buffers, then completes. An empty source produces no arrays.
- Buffers open when a source value arrives. Errors and unsubscription discard unfinished buffers.

**Example.**

```ts
of(1, 2, 3, 4, 5).pipe(bufferCount(2)) // next: [1, 2], [3, 4], [5]; complete
```

**Scope and overloads.** Passing null for startBufferEvery also selects bufferSize. The teaching form assumes positive buffer and start counts.

**References.** [API](https://rxjs.dev/api/operators/bufferCount) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/bufferCount.ts)

**Compare.** [buffer](#buffer) · [pairwise](#pairwise) · [windowCount](#windowCount)

---

<a id="bufferTime"></a>
### bufferTime

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
bufferTime(timeSpan: number, scheduler?: SchedulerLike): A* => (A[])*
```

**Behavior.** Collect values during each time span and emit the resulting array when that span ends.

**Execution details.**

- The first buffer opens on subscription. With the displayed form, each emitted buffer is immediately replaced; even empty buffers are emitted.
- The default clock is asyncScheduler and durations are in milliseconds. The operator schedules boundaries, while source values retain their arrival order within each buffer.
- Source completion flushes every active buffer immediately, then completes; it does not wait for their timers. Errors and unsubscription discard active buffers and cancel their timers.
- The longer forms can create overlapping buffers or gaps, and can close a buffer early at maxBufferSize. Without a creation interval, early closure immediately starts a replacement.

**Example.**

```ts
of(1, 2, 3).pipe(bufferTime(100)) // next: [1, 2, 3] immediately on source completion; complete
```

**Scope and overloads.** Also accepts (timeSpan, creationInterval, scheduler?) and (timeSpan, creationInterval, maxBufferSize, scheduler?). The creation interval defaults to no separate opening schedule and maxBufferSize to Infinity.

**References.** [API](https://rxjs.dev/api/operators/bufferTime) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/bufferTime.ts)

**Compare.** [buffer](#buffer) · [bufferCount](#bufferCount) · [windowTime](#windowTime)

---

<a id="bufferToggle"></a>
### bufferToggle

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
bufferToggle(openings: O*, closingSelector: O => unknown*): A* => (A[])*
```

**Behavior.** Each opening value starts a buffer and selects its closing notifier. That notifier's first next emits the buffer.

**Execution details.**

- Several buffers can be open together; a source value is added to all of them. Values arriving while no buffer is open are omitted.
- Closing-notifier completion alone leaves its buffer open. Completion of openings only prevents further openings.
- Source completion emits all still-open buffers, including empty ones, then completes. An error fails the result; unsubscription releases source and notifier subscriptions.
- Openings are subscribed before the source, so a synchronous opening can establish a buffer before a synchronous source starts.

**Example.**

```ts
of(1, 2, 3).pipe(bufferToggle(of('open'), () => NEVER)) // next: [1, 2, 3]; complete
```

**Scope and overloads.** Both openings and the closing-selector result can be ObservableInput values. The selector receives the opening payload, not a source payload.

**References.** [API](https://rxjs.dev/api/operators/bufferToggle) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/bufferToggle.ts)

**Compare.** [bufferWhen](#bufferWhen) · [bufferTime](#bufferTime) · [windowToggle](#windowToggle)

---

<a id="bufferWhen"></a>
### bufferWhen

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
bufferWhen(closingSelector: () => unknown*): A* => (A[])*
```

**Behavior.** Open one buffer immediately. Each selected closing next emits that buffer, opens its replacement, and calls the selector again.

**Execution details.**

- Only one buffer is active at a time. The closing subscription is replaced after its first next; completion without a next leaves the current buffer open.
- Source completion emits the remaining buffer, including an empty array, then completes. Errors and unsubscription discard it.
- The first closing notifier is subscribed before the source. A selector that repeatedly returns an immediately emitting source can keep reopening buffers synchronously.

**Example.**

```ts
of(1, 2, 3).pipe(bufferWhen(() => NEVER)) // next: [1, 2, 3]; complete
```

**Scope and overloads.** The closing selector may return any ObservableInput. Unlike windowWhen, closing-notifier completion does not advance the buffer.

**References.** [API](https://rxjs.dev/api/operators/bufferWhen) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/bufferWhen.ts)

**Compare.** [buffer](#buffer) · [bufferToggle](#bufferToggle) · [windowWhen](#windowWhen)

---

<a id="concatMap"></a>
### concatMap

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
concatMap(project: A => B*): A* => B*
```

**Behavior.** Process source values in order, one inner subscription at a time. Wait for the current inner to complete before starting the next.

**Execution details.**

- While an inner is active, source values queue. The projector is called when each queued value gets its turn, not when that value first arrives.
- Outer completion waits for the active inner and queued work. An inner that never completes blocks the queue.
- Errors terminate the result and tear down active subscriptions; downstream unsubscription also abandons queued work.
- The queue can grow when arrivals outpace completion. This is mergeMap with concurrency 1, without an added scheduling or sharing policy.

**Example.**

```ts
of(1, 2).pipe(concatMap(n => of(n, n * 10))) // next: 1, 10, 2, 20; complete
```

**Scope and overloads.** The projector also receives a zero-based processing index and can return any ObservableInput. The legacy resultSelector overload is deprecated; concatMap itself is current.

**References.** [API](https://rxjs.dev/api/operators/concatMap) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/concatMap.ts)

**Compare.** [concatAll](#concatAll) · [mergeMap](#mergeMap) · [switchMap](#switchMap) · [exhaustMap](#exhaustMap)

---

<a id="concatMapTo"></a>
### concatMapTo

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: pipeable

```text
concatMapTo(inner: B*): A* => B*
```

**Behavior.** For each source value, subscribe to the same supplied inner Observable, waiting for each subscription to complete before starting the next.

**Execution details.**

- Source payloads are ignored, but each source next reserves a turn in the queue.
- A cold inner starts its execution again for each subscription; a hot inner exposes whatever values arrive during that subscription.
- Outer completion waits for queued turns and the active inner. Errors or downstream unsubscription terminate the active work and abandon the queue.

**Example.**

```ts
of('a', 'b').pipe(concatMapTo(of(1, 2))) // next: 1, 2, 1, 2; complete
```

**Scope and overloads.** The supplied inner may be any ObservableInput. The legacy resultSelector form also exists but is deprecated; the entire concatMapTo API is deprecated.

**Modern alternative.** concatMap(() => inner)

**References.** [API](https://rxjs.dev/api/operators/concatMapTo) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/concatMapTo.ts)

**Compare.** [concatMap](#concatMap) · [mergeMapTo](#mergeMapTo) · [switchMapTo](#switchMapTo)

---

<a id="exhaust"></a>
### exhaust

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: pipeable

```text
exhaust(): (A*)* => A*
```

**Behavior.** Subscribe to an arriving inner only while idle. Ignore arriving inners until the current one completes.

**Execution details.**

- This is the deprecated name of exhaustAll, with identical behavior.
- Ignored inners are neither subscribed nor queued. A synchronous inner can complete before the outer emits the next inner, allowing both to run.
- Outer completion waits for the accepted inner to complete. Errors and downstream unsubscription tear down active work.

**Example.**

```ts
of(timer(10), of(99)).pipe(exhaust()) // next: 0 after the timer; complete; of(99) is ignored
```

**Scope and overloads.** The outer can emit any ObservableInput; the shorthand shows an Observable of Observables.

**Modern alternative.** exhaustAll()

**References.** [API](https://rxjs.dev/api/operators/exhaust) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/exhaust.ts)

**Compare.** [exhaustAll](#exhaustAll) · [exhaustMap](#exhaustMap) · [switchAll](#switchAll)

---

<a id="exhaustMap"></a>
### exhaustMap

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
exhaustMap(project: A => B*): A* => B*
```

**Behavior.** While idle, project a source value and subscribe to its inner. Ignore further source values until that inner completes.

**Execution details.**

- Ignored values are not queued and do not call the projector. Only accepted values advance the projector's index.
- A never-completing inner keeps the operator busy indefinitely. A synchronous inner may finish before the next source value arrives.
- Outer completion waits for the active inner. Source, projection, or inner errors fail the result; downstream unsubscription tears down active work.

**Example.**

```ts
of(1, 2, 3).pipe(exhaustMap(n => of(n).pipe(delay(10)))) // next: 1; complete; 2 and 3 are ignored while busy
```

**Scope and overloads.** The projector also receives a zero-based accepted-value index and may return any ObservableInput. Only the legacy resultSelector overload is deprecated.

**References.** [API](https://rxjs.dev/api/operators/exhaustMap) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/exhaustMap.ts)

**Compare.** [exhaustAll](#exhaustAll) · [concatMap](#concatMap) · [mergeMap](#mergeMap) · [switchMap](#switchMap)

---

<a id="expand"></a>
### expand

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
expand(project: A => A*, concurrent?: number): A* => A*
```

**Behavior.** Emit each source value and recursively project every value reached. Values produced by inner streams become further inputs to the same projection.

**Execution details.**

- The starting source values are included in the output. Returning EMPTY ends that branch without removing the value that led to it.
- The default concurrency is Infinity. A finite positive limit queues values until an inner subscription slot becomes available; projection and output order depend on that limit and inner timing.
- Completion requires the source, all recursive inner work, and the queue to finish. Errors or downstream unsubscription tear down active subscriptions.
- There is no built-in visited set or cycle detection. A projection that keeps producing values can continue indefinitely.

**Example.**

```ts
of(1).pipe(expand(n => n < 4 ? of(n + 1) : EMPTY)) // next: 1, 2, 3, 4; complete
```

**Scope and overloads.** Shows recursion within one payload type A. The projector also receives an index and may return ObservableInput. The legacy scheduler argument is deprecated; schedule inner subscriptions with subscribeOn when needed.

**References.** [API](https://rxjs.dev/api/operators/expand) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/expand.ts)

**Compare.** [mergeMap](#mergeMap) · [mergeScan](#mergeScan) · [take](#take)

---

<a id="groupBy"></a>
### groupBy

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
groupBy(key: A => K): A* => (A* & { readonly key: K })*
```

**Behavior.** Route each value into the stream for its key. Emit a new keyed stream when that key first appears, then send matching values through that stream.

**Execution details.**

- A group is a GroupedObservable: an Observable with a key property. Default groups use Subjects, are hot, and do not replay missed values; subscribe when the group is emitted.
- Without a duration selector, groups remain tracked until the source terminates. A duration next or completion expires that group; a later value with the same key creates a new group.
- Source, key-selector, and element-selector errors reach the outer stream and all groups. A duration-stream error affects its own group; source completion completes all current groups and the outer stream.
- Subscribed groups can keep the source subscription alive after the outer group stream is unsubscribed. Teardown waits for the remaining group subscriptions to end.

**Example.**

```ts
of(1, 2, 3, 4).pipe(groupBy(n => n % 2), mergeMap(group => group.pipe(toArray(), map(values => ({ key: group.key, values }))))) // next: { key: 1, values: [1, 3] }, { key: 0, values: [2, 4] }; complete
```

**Scope and overloads.** The options form can select element payloads, group duration, and a custom connector. With element: A => B, the result is (B* & { readonly key: K })*. A type-guard key has narrowing overloads. Legacy positional element/duration/connector overloads are deprecated; groupBy itself is current.

**References.** [API](https://rxjs.dev/api/operators/groupBy) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/groupBy.ts)

**Compare.** [partition](#partition) · [window](#window) · [mergeMap](#mergeMap)

---

<a id="map"></a>
### map

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
map(project: A => B): A* => B*
```

**Behavior.** Apply the projection to each source value and emit its returned value.

**Execution details.**

- Projection runs during each source next; map adds no scheduling step.
- If the projection returns an Observable, that Observable is the payload. It is not automatically subscribed or flattened: the resulting shape is (B*)*.
- A thrown projection error fails the result. Otherwise, source completion and errors pass through.

**Example.**

```ts
of(1, 2, 3).pipe(map(n => n * 10)) // next: 10, 20, 30; complete
```

**Scope and overloads.** The projector also receives a zero-based source index. The thisArg overload is deprecated; map itself is current.

**References.** [API](https://rxjs.dev/api/operators/map) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/map.ts)

**Compare.** [filter](#filter) · [scan](#scan) · [switchMap](#switchMap) · [mapTo](#mapTo)

---

<a id="mapTo"></a>
### mapTo

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: pipeable

```text
mapTo(value: B): A* => B*
```

**Behavior.** Replace every source value with the same supplied value.

**Execution details.**

- Source next notifications determine when the constant is emitted; source payloads are ignored.
- The supplied value is reused. An object is the same reference on every emission, and an Observable value is emitted without being subscribed.
- An empty source produces no constant value. Source completion and errors pass through.

**Example.**

```ts
of(1, 2).pipe(mapTo('saved')) // next: 'saved', 'saved'; complete
```

**Scope and overloads.** The public input type is unknown because the source payload is unused.

**Modern alternative.** map(() => value)

**References.** [API](https://rxjs.dev/api/operators/mapTo) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mapTo.ts)

**Compare.** [map](#map) · [startWith](#startWith)

---

<a id="mergeMap"></a>
### mergeMap

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
mergeMap(project: A => B*, concurrent?: number): A* => B*
```

**Behavior.** Project source values into inner streams and forward their values as they arrive. Several inner subscriptions may be active together.

**Execution details.**

- Concurrency defaults to Infinity. With a finite positive limit, excess source values queue and the projector is called only when a subscription slot opens.
- Output follows inner emission order, which can differ from source order. With concurrency 1, the processing policy is concatMap.
- Outer completion waits for active inners and queued work. Errors fail the result and tear down active subscriptions; downstream unsubscription also abandons queued values.
- A concurrency limit bounds active inners, not the queue. Queued source values can accumulate when arrivals outpace inner completion.

**Example.**

```ts
of(1, 2).pipe(mergeMap(n => of(n).pipe(delay(n === 1 ? 20 : 10)))) // next: 2, 1 with these delays; complete
```

**Scope and overloads.** The projector also receives a zero-based processing index and may return any ObservableInput. The legacy resultSelector overload is deprecated; mergeMap itself is current.

**References.** [API](https://rxjs.dev/api/operators/mergeMap) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeMap.ts)

**Compare.** [mergeAll](#mergeAll) · [concatMap](#concatMap) · [switchMap](#switchMap) · [exhaustMap](#exhaustMap)

---

<a id="mergeMapTo"></a>
### mergeMapTo

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: pipeable

```text
mergeMapTo(inner: B*, concurrent?: number): A* => B*
```

**Behavior.** For each source value, subscribe to the same supplied inner and merge the values from those subscriptions.

**Execution details.**

- Source payloads are ignored. Concurrency defaults to Infinity; a finite positive limit queues source triggers until a slot is available.
- Each trigger creates another subscription. A cold inner can repeat its work, while multiple subscriptions to a hot inner can forward the same event more than once.
- Outer completion waits for active and queued subscriptions. Errors or downstream unsubscription end active work and abandon the queue.

**Example.**

```ts
of('a', 'b').pipe(mergeMapTo(of(1, 2))) // next: 1, 2, 1, 2; complete
```

**Scope and overloads.** The supplied inner may be any ObservableInput. The legacy resultSelector form is also deprecated.

**Modern alternative.** mergeMap(() => inner, concurrent)

**References.** [API](https://rxjs.dev/api/operators/mergeMapTo) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeMapTo.ts)

**Compare.** [mergeMap](#mergeMap) · [concatMapTo](#concatMapTo) · [switchMapTo](#switchMapTo)

---

<a id="mergeScan"></a>
### mergeScan

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
mergeScan(accumulator: (S, A) => S*, seed: S, concurrent?: number): A* => S*
```

**Behavior.** Use the current state and an input to start an inner stream of states. Merge all active inners, remembering each emitted state for the next accumulator call.

**Execution details.**

- The seed initializes state but is not emitted. The accumulator sees the latest inner value emitted so far, or the seed if no inner has emitted.
- Concurrency defaults to Infinity. Overlapping accumulations can start from the same state, and a later emission from an older inner can replace a newer state.
- With concurrency 1, queued inputs call the accumulator after prior inners complete, using the latest state at that moment. This serializes asynchronous state transitions.
- Outer completion waits for inners and queued work. State belongs to each subscription, but a supplied object seed is not cloned.

**Example.**

```ts
of(1, 2, 3).pipe(mergeScan((state, n) => of(state + n), 0)) // next: 1, 3, 6; complete
```

**Scope and overloads.** The accumulator also receives a zero-based processing index and may return ObservableInput<S>. There is no unseeded overload.

**References.** [API](https://rxjs.dev/api/operators/mergeScan) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeScan.ts)

**Compare.** [scan](#scan) · [switchScan](#switchScan) · [mergeMap](#mergeMap) · [expand](#expand)

---

<a id="pairwise"></a>
### pairwise

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
pairwise(): A* => [A, A]*
```

**Behavior.** Starting with the second source value, emit the previous and current values as a tuple.

**Execution details.**

- The tuple order is [previous, current]. Adjacent tuples overlap in one value.
- A source with zero or one value emits no pair. There is no final incomplete tuple when the source completes.
- Only the previous value is retained between notifications; each pair is a new array, while its element references are unchanged.

**Example.**

```ts
of(1, 2, 3).pipe(pairwise()) // next: [1, 2], [2, 3]; complete
```

**References.** [API](https://rxjs.dev/api/operators/pairwise) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/pairwise.ts)

**Compare.** [bufferCount](#bufferCount) · [scan](#scan)

---

<a id="partition-operator"></a>
### partition (legacy pipeable form)

Deprecated in 7.8.2 · Requested list · Import: `rxjs/operators` · API role: partition

```text
partition(predicate: A => boolean): A* => [A*, A*]
```

**Behavior.** Return two streams: values that pass the predicate and values that fail it.

**Execution details.**

- This legacy rxjs/operators form returns an array of streams, not an Observable emitting arrays. It ends the ordinary Observable pipeline at that point.
- Each branch subscribes to the source separately and runs its own predicate evaluation. A cold source can execute twice when both branches are subscribed.
- Sharing is a separate decision. With a hot source, each branch observes only values available during its own subscription.

**Example.**

```ts
of(1, 2, 3).pipe(partition(n => n % 2 === 0)) // returns [passing$, failing$]; subscribing yields 2 / 1, 3; each completes
```

**Scope and overloads.** Import this legacy form from rxjs/operators. The predicate also receives a zero-based index and an optional thisArg is supported. Prefer the current static partition from rxjs.

**Modern alternative.** partition(source, predicate) imported from rxjs

**References.** [API](https://rxjs.dev/api/operators/partition) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/partition.ts)

**Compare.** [partition](#partition) · [filter](#filter) · [groupBy](#groupBy) · [share](#share)

---

<a id="pluck"></a>
### pluck

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: pipeable

```text
pluck(key: K): A* => (A[K])*
```

**Behavior.** Read a property from every source value and emit the selected property value.

**Execution details.**

- A nested path walks successive properties. If the path cannot be resolved, the operator emits undefined rather than omitting that input.
- A selected null value is still an emitted value. Getter exceptions fail the result, just as a thrown map projection would.
- Calling pluck with no property names throws when the operator is created.

**Example.**

```ts
of({ name: 'Ada' }, { name: 'Erik' }).pipe(pluck('name')) // next: 'Ada', 'Erik'; complete
```

**Scope and overloads.** Shows one known key, K extends keyof A, with the indexed property type A[K]. Typed overloads support nested paths; a general string path returns unknown. Real runtime data with missing properties can produce undefined.

**Modern alternative.** map(value => value?.property), with optional chaining for nested paths

**References.** [API](https://rxjs.dev/api/operators/pluck) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/pluck.ts)

**Compare.** [map](#map)

---

<a id="scan"></a>
### scan

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
scan(reducer: (S, A) => S, seed: S): A* => S*
```

**Behavior.** Update the current state with each source value and emit that updated state.

**Execution details.**

- The seed supplies the first state but is not emitted on subscription. An empty source produces no state values.
- Each subscription tracks its own state variable. A supplied object seed is reused by reference, so pure reducers should return the intended next state without mutating shared seed data.
- Reduction runs when each input arrives. A thrown reducer error fails the result; source completion does not emit an extra final state.

**Example.**

```ts
of(1, 2, 3).pipe(scan((state, n) => state + n, 0)) // next: 1, 3, 6; complete
```

**Scope and overloads.** Shows the seeded form with one state type S. Without a seed, the first source value becomes state and is emitted without calling the reducer. Other overloads distinguish initial and accumulated state types. The reducer also receives the source index; explicitly passing undefined still supplies a seed.

**References.** [API](https://rxjs.dev/api/operators/scan) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/scan.ts)

**Compare.** [reduce](#reduce) · [mergeScan](#mergeScan) · [switchScan](#switchScan) · [startWith](#startWith)

---

<a id="switchScan"></a>
### switchScan

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
switchScan(accumulator: (S, A) => S*, seed: S): A* => S*
```

**Behavior.** Use the current state and each input to select an inner stream of states. Replace the previous inner, forwarding and remembering values only from the active one.

**Execution details.**

- The seed is not emitted. State is the latest inner value already emitted, so a canceled inner that emitted nothing has not advanced state.
- On each new input, the prior inner is unsubscribed before the new accumulator call. Values already emitted by that inner remain part of the observed history.
- Outer completion waits for the current inner. Errors or downstream unsubscription tear down active work.
- State tracking is per subscription, but the supplied seed object is not cloned. The underlying work stops on cancellation only when the inner's teardown stops it.

**Example.**

```ts
of(1, 2).pipe(switchScan((state, n) => of(state + n).pipe(delay(10)), 0)) // next: 2; complete; the first inner never emits
```

**Scope and overloads.** Shows one state type S. The accumulator also receives the source index and may return ObservableInput. There is no unseeded overload.

**References.** [API](https://rxjs.dev/api/operators/switchScan) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/switchScan.ts)

**Compare.** [scan](#scan) · [mergeScan](#mergeScan) · [switchMap](#switchMap)

---

<a id="switchMap"></a>
### switchMap

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
switchMap(project: A => B*): A* => B*
```

**Behavior.** For each input, replace the current inner subscription with the projected inner. Forward values from the active inner only.

**Execution details.**

- The previous inner is unsubscribed before the next projector call and subscription. Previously emitted values are not undone.
- Outer completion waits for the current inner to complete; an outer next, not outer completion, triggers replacement.
- Unsubscribing stops observing the old inner. Stopping its underlying request, timer, or other work depends on that inner's teardown.
- Inner streams determine emission timing. switchMap adds no sharing, and source, projection, or inner errors fail the result.

**Example.**

```ts
of(1, 2).pipe(switchMap(n => of(n).pipe(delay(10)))) // next: 2; complete; the first inner is canceled
```

**Scope and overloads.** The projector also receives the source index and may return any ObservableInput. The legacy resultSelector overload is deprecated; switchMap itself is current.

**References.** [API](https://rxjs.dev/api/operators/switchMap) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/switchMap.ts)

**Compare.** [switchAll](#switchAll) · [map](#map) · [concatMap](#concatMap) · [mergeMap](#mergeMap) · [exhaustMap](#exhaustMap)

---

<a id="switchMapTo"></a>
### switchMapTo

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: pipeable

```text
switchMapTo(inner: B*): A* => B*
```

**Behavior.** Each source value cancels the current inner subscription and starts another subscription to the same supplied inner.

**Execution details.**

- Source payloads are ignored. A cold inner starts again; a hot inner supplies the events available to its replacement subscription.
- Cancellation does not undo earlier emissions, and stopping underlying work depends on the inner's teardown.
- Outer completion waits for the current inner. Errors or downstream unsubscription terminate active work.

**Example.**

```ts
of(1, 2).pipe(switchMapTo(timer(10))) // next: 0 from the replacement timer; complete
```

**Scope and overloads.** The supplied inner may be any ObservableInput. The legacy resultSelector form is also deprecated.

**Modern alternative.** switchMap(() => inner)

**References.** [API](https://rxjs.dev/api/operators/switchMapTo) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/switchMapTo.ts)

**Compare.** [switchMap](#switchMap) · [concatMapTo](#concatMapTo) · [mergeMapTo](#mergeMapTo)

---

<a id="window"></a>
### window

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
window(boundaries: unknown*): A* => (A*)*
```

**Behavior.** Emit a live window stream immediately. Each boundary next completes that window and emits a new one.

**Execution details.**

- Windows are hot and do not replay past values. Subscribe to each window when it is emitted, commonly by immediately flattening or processing it.
- Boundary completion alone does not close the window or complete the result. Source completion completes the current window and the outer stream.
- Source or boundary errors error both the current window and the outer stream. Downstream unsubscription tears down the source and boundary subscriptions.
- The initial window is emitted before source subscription; the boundary subscription is established after the source subscription in RxJS 7.8.2.

**Example.**

```ts
of(1, 2, 3).pipe(window(NEVER), mergeMap(w => w.pipe(toArray()))) // next: [1, 2, 3]; complete
```

**Scope and overloads.** The boundary source may be any ObservableInput. Its next payload is ignored; it supplies window boundaries only.

**References.** [API](https://rxjs.dev/api/operators/window) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/window.ts)

**Compare.** [buffer](#buffer) · [windowCount](#windowCount) · [windowTime](#windowTime) · [windowWhen](#windowWhen)

---

<a id="windowCount"></a>
### windowCount

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
windowCount(windowSize: number, startWindowEvery?: number): A* => (A*)*
```

**Behavior.** Divide source values into live window streams, completing each window after its chosen number of values.

**Execution details.**

- For positive counts, the default start interval equals windowSize. Smaller intervals overlap windows; larger intervals leave values outside any window.
- Windows are hot and need timely subscriptions. Each window is emitted when it opens, before its values arrive.
- RxJS 7.8.2 opens the initial window immediately and eagerly opens each next window after the start interval. An empty source or an exact count boundary can therefore leave an empty window.
- Source completion completes all open windows and the outer stream; source errors error them. Window completion does not wait for consumers to subscribe.

**Example.**

```ts
of(1, 2, 3, 4).pipe(windowCount(2), mergeMap(w => w.pipe(toArray()))) // next: [1, 2], [3, 4], []; complete
```

**Scope and overloads.** The displayed behavior assumes positive windowSize. An omitted or nonpositive startWindowEvery uses windowSize.

**References.** [API](https://rxjs.dev/api/operators/windowCount) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/windowCount.ts)

**Compare.** [bufferCount](#bufferCount) · [window](#window) · [windowTime](#windowTime)

---

<a id="windowTime"></a>
### windowTime

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
windowTime(timeSpan: number, scheduler?: SchedulerLike): A* => (A*)*
```

**Behavior.** Emit a live window for each time span. In the displayed form, completing one timed window immediately opens the next.

**Execution details.**

- A window is emitted when it opens, starting immediately on subscription. It is hot and does not replay missed source values.
- The default scheduler is asyncScheduler, with millisecond durations. Timers close windows; source arrivals supply their values, and windows can be empty.
- Source completion completes active windows immediately and completes the outer stream. Source errors error both; unsubscription cancels source and scheduled boundary work.
- Longer forms support overlapping windows, gaps, and a maximum value count. Without a separate creation interval, hitting the count limit immediately opens a replacement.

**Example.**

```ts
of(1, 2, 3).pipe(windowTime(100), mergeMap(w => w.pipe(toArray()))) // next: [1, 2, 3] immediately on source completion; complete
```

**Scope and overloads.** Also accepts (timeSpan, creationInterval, scheduler?) and (timeSpan, creationInterval, maxWindowSize, scheduler?). The creation interval defaults to no separate opening schedule and maxWindowSize to Infinity.

**References.** [API](https://rxjs.dev/api/operators/windowTime) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/windowTime.ts)

**Compare.** [bufferTime](#bufferTime) · [windowCount](#windowCount) · [windowToggle](#windowToggle)

---

<a id="windowToggle"></a>
### windowToggle

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
windowToggle(openings: O*, closingSelector: O => unknown*): A* => (A*)*
```

**Behavior.** Each opening value creates and emits a live window. Its selected closing notifier completes that window on the first next.

**Execution details.**

- Windows can overlap or leave gaps. A source value is sent to every open window; with no open window it is omitted.
- Closing-notifier completion alone does not close a window. Completion of openings prevents new openings without completing current windows.
- Windows are hot and require timely subscriptions. Openings are subscribed before the source, allowing synchronous openings to establish windows first.
- Source completion completes all current windows and the outer stream. Errors fail the outer stream; downstream unsubscription tears down source and notifier subscriptions.

**Example.**

```ts
of(1, 2, 3).pipe(windowToggle(of('open'), () => NEVER), mergeMap(w => w.pipe(toArray()))) // next: [1, 2, 3]; complete
```

**Scope and overloads.** Openings and closing-selector results may be ObservableInput values. The selector receives the opening value rather than the source value.

**References.** [API](https://rxjs.dev/api/operators/windowToggle) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/windowToggle.ts)

**Compare.** [bufferToggle](#bufferToggle) · [windowWhen](#windowWhen) · [windowTime](#windowTime)

---

<a id="windowWhen"></a>
### windowWhen

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
windowWhen(closingSelector: () => unknown*): A* => (A*)*
```

**Behavior.** Open and emit a window immediately. A selected closing next or completion closes it, opens a replacement, and calls the selector again.

**Execution details.**

- Only one window is active at a time. Unlike bufferWhen, a closing notifier that completes without a value also advances the window.
- Windows are hot and do not replay past values. Subscribe when each is emitted to observe its contents.
- Source completion completes the current window and outer stream. Source, selector, or closing errors error the window and the result; unsubscription tears down the active subscriptions.
- The first closing notifier is subscribed before the source. Repeated immediately emitting or completing closers can reopen windows synchronously without letting the source run.

**Example.**

```ts
of(1, 2, 3).pipe(windowWhen(() => NEVER), mergeMap(w => w.pipe(toArray()))) // next: [1, 2, 3]; complete
```

**Scope and overloads.** The closing selector may return any ObservableInput.

**References.** [API](https://rxjs.dev/api/operators/windowWhen) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/windowWhen.ts)

**Compare.** [bufferWhen](#bufferWhen) · [window](#window) · [windowToggle](#windowToggle)

---

<a id="flatMap"></a>
### flatMap

Deprecated in 7.8.2 · Supplement · Import: `rxjs` · API role: pipeable

```text
flatMap(project: A => B*, concurrent?: number): A* => B*
```

**Behavior.** Project values to inner streams and merge their emissions. This is the deprecated alias of mergeMap.

**Execution details.**

- Concurrency defaults to Infinity. A finite positive limit queues source values until an inner subscription can start.
- Output follows inner emission timing, so source order is not guaranteed. Outer completion waits for active and queued work.
- Errors or downstream unsubscription end active subscriptions and abandon queued work, exactly as with mergeMap.

**Example.**

```ts
of(1, 2).pipe(flatMap(n => of(n, n * 10))) // next: 1, 10, 2, 20; complete
```

**Scope and overloads.** Inherits mergeMap's ObservableInput projector, processing index, concurrency option, and legacy deprecated resultSelector overloads.

**Modern alternative.** mergeMap(project, concurrent)

**References.** [API](https://rxjs.dev/api/operators/flatMap) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/flatMap.ts)

**Compare.** [mergeMap](#mergeMap) · [mergeAll](#mergeAll)

---

<a id="filtering-operators"></a>
## Filtering Operators

Choose which values pass. Similar A* => A* shapes can have very different gates, deadlines, and completion rules.

<a id="audit"></a>
### audit

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
audit(durationSelector: A => unknown*): A* => A*
```

**Behavior.** The first value starts a duration. While that duration is active, remember the latest source value; emit it when the duration sends a next notification.

**Execution details.**

- New source values replace the pending value without restarting the active duration.
- Duration completion without a next notification closes the duration without emitting the pending value.
- Source completion waits for an active duration: a duration next releases the pending value before completion, while a duration completion without next discards it.
- A source or duration error terminates the result and discards the pending value.

**Example.**

```ts
of(1, 2, 3).pipe(audit(() => timer(10))) // next: 3 when the duration signals; complete
```

**Scope and overloads.** The duration selector also accepts other ObservableInput values, including promises. Its emitted payload is ignored.

**References.** [API](https://rxjs.dev/api/operators/audit) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/audit.ts)

**Compare.** [auditTime](#auditTime) · [debounce](#debounce) · [throttle](#throttle) · [sample](#sample)

---

<a id="auditTime"></a>
### auditTime

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
auditTime(duration: number, scheduler?: SchedulerLike): A* => A*
```

**Behavior.** The first value opens a timed interval. Emit the latest value at the end of that interval, then wait for another source value to open the next interval.

**Execution details.**

- Values arriving during an interval replace the pending value without moving its deadline.
- Intervals are started by source values; there is no continuously running sampling clock.
- Source completion waits for an active interval and its pending emission. An error or downstream unsubscription discards that pending value.
- The scheduler defaults to asyncScheduler; duration is measured in its time units, normally milliseconds.

**Example.**

```ts
of(1, 2, 3).pipe(auditTime(10)) // next: 3 after the interval; complete
```

**Scope and overloads.** Equivalent to audit(() => timer(duration, scheduler)).

**References.** [API](https://rxjs.dev/api/operators/auditTime) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/auditTime.ts)

**Compare.** [audit](#audit) · [debounceTime](#debounceTime) · [sampleTime](#sampleTime) · [throttleTime](#throttleTime)

---

<a id="debounce"></a>
### debounce

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
debounce(durationSelector: A => unknown*): A* => A*
```

**Behavior.** Each source value replaces the pending value and starts a new duration. Emit that value if its duration sends a next notification before another source value arrives.

**Execution details.**

- Every new source value unsubscribes the previous duration and chooses a replacement duration.
- Duration completion without next does not release the pending value.
- Source completion immediately emits any pending value and then completes, even if the duration has not signaled.
- An error or downstream unsubscription discards the pending value.

**Example.**

```ts
of(1, 2, 3).pipe(debounce(() => timer(10))) // next: 3 immediately on source completion; complete
```

**Scope and overloads.** The duration selector also accepts other ObservableInput values. The duration payload is ignored.

**References.** [API](https://rxjs.dev/api/operators/debounce) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/debounce.ts)

**Compare.** [debounceTime](#debounceTime) · [audit](#audit) · [switchMap](#switchMap)

---

<a id="debounceTime"></a>
### debounceTime

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
debounceTime(dueTime: number, scheduler?: SchedulerLike): A* => A*
```

**Behavior.** Wait for a quiet period after a source value, then emit the latest pending value. Each new value moves the deadline.

**Execution details.**

- A continuously busy source can keep replacing the pending value without producing output.
- Source completion immediately releases the pending value and then completes; it does not wait out the remaining delay.
- A source error or downstream unsubscription discards the pending value.
- The scheduler defaults to asyncScheduler; dueTime uses its time units, normally milliseconds.

**Example.**

```ts
of(1, 2, 3).pipe(debounceTime(10)) // next: 3 immediately on source completion; complete
```

**Scope and overloads.** The output remains A*: the operator can emit many values across separate quiet periods.

**References.** [API](https://rxjs.dev/api/operators/debounceTime) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/debounceTime.ts)

**Compare.** [debounce](#debounce) · [auditTime](#auditTime) · [throttleTime](#throttleTime) · [sampleTime](#sampleTime)

---

<a id="distinct"></a>
### distinct

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
distinct(keySelector?: A => K, flushes?: unknown*): A* => A*
```

**Behavior.** Emit a source value only when its selected key has not been seen in this subscription since the last flush.

**Execution details.**

- Without a key selector, the source value itself is the key. Keys are stored in a JavaScript Set: objects compare by identity and repeated NaN keys count as duplicates.
- A flushes next notification clears the remembered keys; flushes completion alone does not clear them or complete the result.
- The remembered set can grow for the lifetime of a subscription; supplying a key selector does not impose a size limit.

**Example.**

```ts
of(1, 1, 2, 1, 3, 2).pipe(distinct()) // next: 1, 2, 3; complete
```

**Scope and overloads.** K is the selected key type. The optional flushes input also accepts other ObservableInput values.

**References.** [API](https://rxjs.dev/api/operators/distinct) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/distinct.ts)

**Compare.** [distinctUntilChanged](#distinctUntilChanged) · [distinctUntilKeyChanged](#distinctUntilKeyChanged) · [filter](#filter)

---

<a id="distinctUntilChanged"></a>
### distinctUntilChanged

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
distinctUntilChanged(compare?: (A, A) => boolean): A* => A*
```

**Behavior.** Emit the first value, then emit a later value only when the comparator says it differs from the last emitted value.

**Execution details.**

- Comparator true suppresses the new value; comparator false emits it and updates the remembered value.
- The default comparator is ===. It does not perform a deep object comparison.
- Suppressed values do not replace the comparison baseline; only the last emitted value is remembered.

**Example.**

```ts
of(1, 1, 2, 2, 1).pipe(distinctUntilChanged()) // next: 1, 2, 1; complete
```

**Scope and overloads.** The key-selector form is distinctUntilChanged(compare: (K, K) => boolean, keySelector: A => K): A* => A*. It compares selected keys but emits the original A values.

**References.** [API](https://rxjs.dev/api/operators/distinctUntilChanged) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/distinctUntilChanged.ts)

**Compare.** [distinct](#distinct) · [distinctUntilKeyChanged](#distinctUntilKeyChanged) · [pairwise](#pairwise)

---

<a id="distinctUntilKeyChanged"></a>
### distinctUntilKeyChanged

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
distinctUntilKeyChanged(key: K, compare?: (A[K], A[K]) => boolean): A* => A*
```

**Behavior.** Emit the first object, then suppress objects whose chosen property compares equal to that property on the last emitted object.

**Execution details.**

- The default comparison is ===; a custom comparator returning true suppresses the new object.
- The entire object is emitted, including properties that were not compared.
- The previous object is retained by reference, so mutating it can change a later comparison.

**Example.**

```ts
of({ id: 1 }, { id: 1 }, { id: 2 }).pipe(distinctUntilKeyChanged('id')) // next: { id: 1 }, { id: 2 }; complete
```

**Scope and overloads.** K extends keyof A; A[K] is the type of the selected property.

**References.** [API](https://rxjs.dev/api/operators/distinctUntilKeyChanged) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/distinctUntilKeyChanged.ts)

**Compare.** [distinctUntilChanged](#distinctUntilChanged) · [distinct](#distinct) · [filter](#filter)

---

<a id="elementAt"></a>
### elementAt

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
elementAt(index: number): A* => A*
```

**Behavior.** Emit the value at a zero-based position, then complete and unsubscribe from the source.

**Execution details.**

- At most one value is emitted. Counting begins with the first value observed by this subscription.
- If the source completes before that position exists, the selected form errors with ArgumentOutOfRangeError.
- A negative index throws when elementAt is called, before subscription.

**Example.**

```ts
of('a', 'b', 'c').pipe(elementAt(1)) // next: 'b'; complete
```

**Scope and overloads.** Use a non-negative integer index. Providing defaultValue: D changes the output to (A | D)* and emits the default on normal completion if the position was not reached.

**References.** [API](https://rxjs.dev/api/operators/elementAt) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/elementAt.ts)

**Compare.** [first](#first) · [take](#take) · [skip](#skip) · [single](#single)

---

<a id="filter"></a>
### filter

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
filter(predicate: A => boolean): A* => A*
```

**Behavior.** Keep each source value whose predicate returns true. Other values contribute no output.

**Execution details.**

- The predicate is evaluated independently for each source value; a rejection does not stop later values from being tested.
- Values that pass are forwarded during the source notification; filter adds no scheduling step.
- The full result is A*: an individual input can contribute zero or one value, but the subscription can emit many values.

**Example.**

```ts
of(1, 2, 3, 4).pipe(filter(n => n % 2 === 0)) // next: 2, 4; complete
```

**Scope and overloads.** The callback also receives a zero-based index. A type guard (value: A) => value is B, with B extends A, produces B*. Boolean has a truthiness-narrowing overload. Only overloads accepting thisArg are deprecated.

**References.** [API](https://rxjs.dev/api/operators/filter) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/filter.ts)

**Compare.** [map](#map) · [takeWhile](#takeWhile) · [skipWhile](#skipWhile) · [partition](#partition)

---

<a id="first"></a>
### first

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
first(predicate?: A => boolean): A* => A*
```

**Behavior.** Emit the first matching value and complete immediately. Without a predicate, the first source value matches.

**Execution details.**

- Once a match is emitted, the source subscription is closed; later values are not needed.
- If the source completes without a match, the selected form errors with EmptyError.
- An input that never matches and never completes can keep the result open without emitting.

**Example.**

```ts
of(1, 2, 3).pipe(first(n => n > 1)) // next: 2; complete
```

**Scope and overloads.** A second argument defaultValue: D changes the output to (A | D)* and replaces the no-match error on completion. Use first(null, defaultValue) without a predicate. Type-guard and Boolean overloads can narrow the payload; predicates also receive index and source.

**References.** [API](https://rxjs.dev/api/operators/first) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/first.ts)

**Compare.** [take](#take) · [find](#find) · [last](#last) · [single](#single) · [elementAt](#elementAt)

---

<a id="ignoreElements"></a>
### ignoreElements

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
ignoreElements(): A* => never*
```

**Behavior.** Suppress every next value while preserving the source's completion or error notification.

**Execution details.**

- The source is still subscribed and executes normally; ignoring its values does not prevent its side effects.
- A source that never terminates leaves the result open. never* describes the absence of next values, not the termination behavior.

**Example.**

```ts
of(1, 2, 3).pipe(ignoreElements()) // no next values; complete
```

**Scope and overloads.** The native signature accepts unknown payloads and produces Observable<never>.

**References.** [API](https://rxjs.dev/api/operators/ignoreElements) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/ignoreElements.ts)

**Compare.** [filter](#filter) · [tap](#tap) · [materialize](#materialize) · [endWith](#endWith)

---

<a id="last"></a>
### last

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
last(predicate?: A => boolean): A* => A*
```

**Behavior.** Remember the latest matching value and emit it when the source completes. Without a predicate, every source value matches.

**Execution details.**

- It must wait for normal source completion to know which matching value was last.
- If the source completes without a match, the selected form errors with EmptyError.
- A source error or downstream unsubscription discards the remembered value.

**Example.**

```ts
of(1, 2, 3, 4).pipe(last(n => n % 2 === 1)) // next: 3 at source completion; complete
```

**Scope and overloads.** A second argument defaultValue: D changes the output to (A | D)* and replaces the no-match error on completion. Use last(null, defaultValue) without a predicate. Type-guard and Boolean overloads can narrow the payload; predicates also receive index and source.

**References.** [API](https://rxjs.dev/api/operators/last) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/last.ts)

**Compare.** [first](#first) · [takeLast](#takeLast) · [single](#single) · [reduce](#reduce)

---

<a id="sample"></a>
### sample

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
sample(notifier: unknown*): A* => A*
```

**Behavior.** On each notifier next, emit the latest source value received since the previous sample. If no new source value arrived, emit nothing.

**Execution details.**

- Sampling clears the pending-value flag, so repeated notifier values do not replay the same source value.
- Notifier completion is ignored. Source completion immediately completes the result without flushing a pending value.
- The source is subscribed before the notifier; a synchronous source can finish before the notifier is subscribed.
- A notifier error terminates the result, as does a source error.

**Example.**

If the source emits 1 then 2 before a notifier next, that next releases 2. A second notifier next with no new source value emits nothing. Source completion then completes the result.

**Scope and overloads.** The notifier also accepts other ObservableInput values. Its emitted payload is ignored.

**References.** [API](https://rxjs.dev/api/operators/sample) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/sample.ts)

**Compare.** [sampleTime](#sampleTime) · [audit](#audit) · [withLatestFrom](#withLatestFrom)

---

<a id="sampleTime"></a>
### sampleTime

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
sampleTime(period: number, scheduler?: SchedulerLike): A* => A*
```

**Behavior.** At regular clock ticks, emit the latest source value received since the previous tick. A tick with no new value produces no output.

**Execution details.**

- The sampling clock runs independently of source arrivals; arrivals do not move its next tick.
- Source completion immediately completes the result and discards any value waiting for a later tick.
- The scheduler defaults to asyncScheduler; period uses its time units, normally milliseconds.

**Example.**

With a 10 ms period, values 1 at 2 ms and 2 at 7 ms produce 2 at the 10 ms tick. If the source completes at 15 ms, the result completes then.

**Scope and overloads.** Equivalent to sample(interval(period, scheduler)).

**References.** [API](https://rxjs.dev/api/operators/sampleTime) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/sampleTime.ts)

**Compare.** [sample](#sample) · [auditTime](#auditTime) · [debounceTime](#debounceTime) · [throttleTime](#throttleTime)

---

<a id="single"></a>
### single

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
single(predicate?: A => boolean): A* => A*
```

**Behavior.** Require exactly one matching value across the source. Emit that value only after source completion proves there was no second match.

**Execution details.**

- A second match causes an immediate SequenceError, without emitting the first match.
- A source that completes without any values causes EmptyError.
- A nonempty source that completes with no predicate match causes NotFoundError.
- There is no default-value argument. A nonterminating source with only one match still cannot establish uniqueness.

**Example.**

```ts
of(1, 2, 3).pipe(single(n => n % 2 === 0)) // next: 2 at source completion; complete
```

**Scope and overloads.** Without a predicate, all source values count as matches. Predicates also receive index and source. A Boolean overload narrows truthy payloads.

**References.** [API](https://rxjs.dev/api/operators/single) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/single.ts)

**Compare.** [first](#first) · [last](#last) · [find](#find) · [elementAt](#elementAt)

---

<a id="skip"></a>
### skip

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
skip(count: number): A* => A*
```

**Behavior.** Discard the first count source values, then forward later values.

**Execution details.**

- Counting is local to each subscription and does not depend on elapsed time.
- A source that completes before enough values arrive simply completes without output.
- For count zero or below, values pass through.

**Example.**

```ts
of(1, 2, 3, 4).pipe(skip(2)) // next: 3, 4; complete
```

**Scope and overloads.** The teaching form assumes an integer count.

**References.** [API](https://rxjs.dev/api/operators/skip) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/skip.ts)

**Compare.** [take](#take) · [skipWhile](#skipWhile) · [skipUntil](#skipUntil) · [skipLast](#skipLast)

---

<a id="skipLast"></a>
### skipLast

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
skipLast(count: number): A* => A*
```

**Behavior.** Hold back the latest count values. Each later arrival releases the oldest held value; the final held values are discarded when the source ends.

**Execution details.**

- This introduces a lag measured in source values, not a timed delay.
- Normal completion does not flush the held values. A source with at most count values completes without emitting.
- Positive integer counts retain up to count values; zero or negative counts pass values through.

**Example.**

```ts
of(1, 2, 3, 4).pipe(skipLast(2)) // next: 1 when 3 arrives, 2 when 4 arrives; complete
```

**Scope and overloads.** The teaching form assumes an integer count.

**References.** [API](https://rxjs.dev/api/operators/skipLast) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/skipLast.ts)

**Compare.** [takeLast](#takeLast) · [skip](#skip) · [delay](#delay)

---

<a id="skipUntil"></a>
### skipUntil

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
skipUntil(notifier: unknown*): A* => A*
```

**Behavior.** Discard source values until the notifier sends its first next notification. Forward later source values from then on.

**Execution details.**

- The notifier is subscribed before the source, so a synchronous notifier next can open the gate before the first source value.
- After opening the gate, the notifier is unsubscribed; it cannot close the gate again.
- Notifier completion without next leaves the gate closed. Source completion still completes the result; notifier errors terminate it.

**Example.**

```ts
of(1, 2, 3).pipe(skipUntil(of('go'))) // next: 1, 2, 3; complete
```

**Scope and overloads.** The notifier also accepts other ObservableInput values; its payload is ignored.

**References.** [API](https://rxjs.dev/api/operators/skipUntil) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/skipUntil.ts)

**Compare.** [takeUntil](#takeUntil) · [skipWhile](#skipWhile) · [skip](#skip)

---

<a id="skipWhile"></a>
### skipWhile

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
skipWhile(predicate: A => boolean): A* => A*
```

**Behavior.** Discard the initial run of values for which the predicate is true. Emit the first value for which it is false and every later value.

**Execution details.**

- The predicate stops being called after its first false result.
- Later values pass through even if they would have satisfied the original skipping condition.
- If the predicate stays true until source completion, the result completes without values.

**Example.**

```ts
of(1, 2, 3, 1).pipe(skipWhile(n => n < 3)) // next: 3, 1; complete
```

**Scope and overloads.** The callback also receives a zero-based index. Native overloads include Boolean and an always-true predicate; skipWhile does not generally provide type-guard narrowing for later values.

**References.** [API](https://rxjs.dev/api/operators/skipWhile) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/skipWhile.ts)

**Compare.** [takeWhile](#takeWhile) · [filter](#filter) · [skipUntil](#skipUntil)

---

<a id="take"></a>
### take

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
take(count: number): A* => A*
```

**Behavior.** Forward up to count source values, then complete and unsubscribe from the source.

**Execution details.**

- A positive count is an upper bound, not a promise that the source will supply that many values.
- Early source completion is forwarded without an empty-source error.
- For count zero or below, the result completes immediately without subscribing to the source.

**Example.**

```ts
of(1, 2, 3).pipe(take(2)) // next: 1, 2; complete
```

**Scope and overloads.** The teaching form assumes an integer count. take(1) permits zero values; first() instead errors if its source completes empty.

**References.** [API](https://rxjs.dev/api/operators/take) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/take.ts)

**Compare.** [first](#first) · [takeUntil](#takeUntil) · [takeWhile](#takeWhile) · [skip](#skip)

---

<a id="takeLast"></a>
### takeLast

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
takeLast(count: number): A* => A*
```

**Behavior.** Remember up to count recent values and emit them in their original order when the source completes.

**Execution details.**

- For a positive count, no values are emitted before normal source completion.
- If the source supplies fewer than count values and completes, all its values are emitted; an empty source completes without error.
- A source error or downstream unsubscription discards the buffered values.
- For count zero or below, the result completes immediately without subscribing to the source.

**Example.**

```ts
of(1, 2, 3, 4).pipe(takeLast(2)) // next: 3, 4 at source completion; complete
```

**Scope and overloads.** The teaching form assumes an integer count. The buffer retains at most count values for a positive integer count.

**References.** [API](https://rxjs.dev/api/operators/takeLast) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/takeLast.ts)

**Compare.** [last](#last) · [skipLast](#skipLast) · [toArray](#toArray) · [take](#take)

---

<a id="takeUntil"></a>
### takeUntil

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
takeUntil(notifier: unknown*): A* => A*
```

**Behavior.** Forward source values until the notifier sends a next notification. That notification completes the result and tears down both subscriptions.

**Execution details.**

- The notifier is subscribed first. A synchronous notifier next prevents the source from being subscribed at all.
- Notifier completion without next does not stop the source.
- Source completion also completes the result; a source or notifier error terminates it with that error.

**Example.**

```ts
of(1, 2, 3).pipe(takeUntil(EMPTY)) // next: 1, 2, 3; complete; notifier completion does not stop values
```

**Scope and overloads.** The notifier also accepts other ObservableInput values; its payload is ignored.

**References.** [API](https://rxjs.dev/api/operators/takeUntil) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/takeUntil.ts)

**Compare.** [skipUntil](#skipUntil) · [take](#take) · [takeWhile](#takeWhile) · [endWith](#endWith)

---

<a id="takeWhile"></a>
### takeWhile

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
takeWhile(predicate: A => boolean, inclusive?: boolean): A* => A*
```

**Behavior.** Forward the initial run of values that satisfy the predicate. Complete at the first false result, optionally including that boundary value.

**Execution details.**

- inclusive defaults to false; true emits the first failing value before completion.
- After the first failure, the source is unsubscribed and no later values are tested.
- If the source completes while all tested values pass, completion is forwarded normally.

**Example.**

```ts
of(1, 2, 3, 1).pipe(takeWhile(n => n < 3)) // next: 1, 2; complete when 3 arrives
```

**Scope and overloads.** The predicate also receives a zero-based index. Type-guard and Boolean overloads can narrow the result when inclusive is false or omitted; including the failing boundary generally preserves A.

**References.** [API](https://rxjs.dev/api/operators/takeWhile) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/takeWhile.ts)

**Compare.** [skipWhile](#skipWhile) · [filter](#filter) · [takeUntil](#takeUntil) · [take](#take)

---

<a id="throttle"></a>
### throttle

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
throttle(durationSelector: A => unknown*, config?: ThrottleConfig): A* => A*
```

**Behavior.** Use a duration to limit which values pass during a burst. By default, emit a leading value immediately and suppress further values while its duration is active.

**Execution details.**

- Defaults are leading: true and trailing: false. With trailing enabled, remember the latest suppressed value for release on a duration next.
- A duration next ends the current gate. A trailing emission starts a new duration while the source is still active.
- Duration completion without next ends the gate without a trailing emission.
- Source completion waits only if a trailing value is pending behind an active duration; its next releases that value, while completion without next discards it.

**Example.**

```ts
of(1, 2, 3).pipe(throttle(() => timer(10))) // next: 1; complete
```

**Scope and overloads.** ThrottleConfig has optional leading and trailing booleans. The duration selector also accepts other ObservableInput values; their payloads are ignored.

**References.** [API](https://rxjs.dev/api/operators/throttle) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/throttle.ts)

**Compare.** [throttleTime](#throttleTime) · [audit](#audit) · [debounce](#debounce)

---

<a id="throttleTime"></a>
### throttleTime

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
throttleTime(duration: number, scheduler?: SchedulerLike, config?: ThrottleConfig): A* => A*
```

**Behavior.** By default, emit a value immediately and suppress new values for a fixed duration. Leading and trailing options choose which ends of each interval may emit.

**Execution details.**

- Defaults are leading: true and trailing: false. trailing: true can emit the latest value held during the interval.
- Suppressed source values do not restart the running interval. A trailing emission can start the next interval while the source remains active.
- If source completion leaves a trailing value pending, the result waits for the timer to release it; the default configuration completes immediately.
- The scheduler defaults to asyncScheduler, with time units normally in milliseconds. Errors and downstream unsubscription discard pending values.

**Example.**

```ts
of(1, 2, 3).pipe(throttleTime(10)) // next: 1; complete
```

**Scope and overloads.** Equivalent to throttle(() => timer(duration, scheduler), config). ThrottleConfig contains optional leading and trailing booleans.

**References.** [API](https://rxjs.dev/api/operators/throttleTime) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/throttleTime.ts)

**Compare.** [throttle](#throttle) · [auditTime](#auditTime) · [debounceTime](#debounceTime) · [sampleTime](#sampleTime)

---

<a id="join-operators"></a>
## Join Operators

Combine a primary source with companions, or flatten an outer stream. Read who triggers output and when inner subscriptions start.

<a id="combineLatestAll"></a>
### combineLatestAll

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
combineLatestAll(): (A*)* => (A[])*
```

**Behavior.** Collect the inner sources until the outer source completes, then combine those sources by their latest values.

**Execution details.**

- No inner source is subscribed before outer completion; a never-completing outer prevents all inner subscriptions.
- After collection, every inner must provide a first value. Later inner values emit a new array in collected-source order.
- A completed inner's latest value remains usable; normal result completion waits for all collected inners to complete.
- An empty outer completes without a next value. Hot inner values emitted before the delayed inner subscriptions are not recovered.

**Example.**

```ts
of(of(1, 2), of(10, 20)).pipe(combineLatestAll()) // next: [2, 10], [2, 20]; complete
```

**Scope and overloads.** The selected form uses homogeneous Observable<A> inners and produces array values. Native inputs may be other ObservableInput values, and an optional projection can produce B* instead of (A[])*.

**References.** [API](https://rxjs.dev/api/operators/combineLatestAll) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/combineLatestAll.ts)

**Compare.** [combineLatest](#combineLatest) · [combineLatestWith](#combineLatestWith) · [zipAll](#zipAll) · [mergeAll](#mergeAll)

---

<a id="concatAll"></a>
### concatAll

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
concatAll(): (A*)* => A*
```

**Behavior.** Subscribe to one inner source at a time. Queue later inner sources and start the next only when the current inner completes.

**Execution details.**

- The first inner can start before the outer completes; output follows inner subscription order.
- Outer completion waits for the active inner and queued inners to finish. A nonterminating inner blocks the queue.
- The queue stores inner sources, not events missed before their subscriptions; hot inner values can be lost while waiting.
- A fast outer can grow the queue without bound. Errors terminate the result and discard queued work.

**Example.**

```ts
of(of(1, 2).pipe(delay(10)), of(3)).pipe(concatAll()) // next: 1, 2, 3; complete
```

**Scope and overloads.** Equivalent to mergeAll(1). Native inner inputs may also be other ObservableInput values.

**References.** [API](https://rxjs.dev/api/operators/concatAll) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/concatAll.ts)

**Compare.** [concatMap](#concatMap) · [mergeAll](#mergeAll) · [switchAll](#switchAll) · [exhaustAll](#exhaustAll)

---

<a id="exhaustAll"></a>
### exhaustAll

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
exhaustAll(): (A*)* => A*
```

**Behavior.** Subscribe to an inner source only when no inner is active. Ignore new inner sources while the current one is running.

**Execution details.**

- Ignored inner sources are neither subscribed nor queued for later.
- When the active inner completes, the next outer value can supply a new inner.
- Outer completion waits for the active inner. A nonterminating active inner keeps the result open.

**Example.**

```ts
of(of(1, 2).pipe(delay(10)), of(3)).pipe(exhaustAll()) // next: 1, 2; complete; of(3) is ignored
```

**Scope and overloads.** Native inner inputs may also be other ObservableInput values. exhaust is the deprecated earlier name.

**References.** [API](https://rxjs.dev/api/operators/exhaustAll) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/exhaustAll.ts)

**Compare.** [exhaustMap](#exhaustMap) · [exhaust](#exhaust) · [concatAll](#concatAll) · [switchAll](#switchAll)

---

<a id="mergeAll"></a>
### mergeAll

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
mergeAll(concurrent?: number): (A*)* => A*
```

**Behavior.** Subscribe to inner sources as they arrive, up to the concurrency limit, and forward values from all active inners.

**Execution details.**

- concurrent defaults to Infinity. A positive limit queues additional inner sources until an active inner completes.
- Values follow actual arrival order across active inners; earlier outer positions do not reserve earlier output positions.
- Outer completion waits for all active and queued inners to finish.
- The limit bounds active subscriptions, not queue length. Errors cancel active inners and discard queued work.

**Example.**

```ts
of(of(1, 2).pipe(delay(10)), of(3)).pipe(mergeAll()) // next: 3, 1, 2; complete
```

**Scope and overloads.** Use a positive integer limit or Infinity. Native inner inputs may also be other ObservableInput values; mergeAll(1) has concatAll's policy.

**References.** [API](https://rxjs.dev/api/operators/mergeAll) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeAll.ts)

**Compare.** [mergeMap](#mergeMap) · [concatAll](#concatAll) · [switchAll](#switchAll) · [exhaustAll](#exhaustAll)

---

<a id="switchAll"></a>
### switchAll

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
switchAll(): (A*)* => A*
```

**Behavior.** Follow only the latest inner source. Each new inner replaces the previous inner subscription immediately.

**Execution details.**

- The previous inner is unsubscribed before its replacement is subscribed; already emitted values remain part of the output history.
- Outer completion waits for the current inner to complete; it does not cancel that final inner.
- Stopping underlying external work depends on the inner source's teardown implementation.

**Example.**

```ts
of(of(1, 2).pipe(delay(10)), of(3)).pipe(switchAll()) // next: 3; complete; the delayed inner is unsubscribed
```

**Scope and overloads.** Equivalent to switchMap(inner => inner). Native inner inputs may also be other ObservableInput values.

**References.** [API](https://rxjs.dev/api/operators/switchAll) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/switchAll.ts)

**Compare.** [switchMap](#switchMap) · [mergeAll](#mergeAll) · [concatAll](#concatAll) · [exhaustAll](#exhaustAll)

---

<a id="startWith"></a>
### startWith

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
startWith(...values: B[]): A* => (A | B)*
```

**Behavior.** On subscription, emit the supplied values in order, then subscribe to the source and forward its values.

**Execution details.**

- In the selected form, the supplied values are emitted synchronously before the source subscription starts.
- If downstream closes while receiving those initial values, the source need not be subscribed.
- Argument expressions are evaluated when constructing the operator. Use defer when a starting value must be computed anew per subscription.

**Example.**

```ts
of(2, 3).pipe(startWith(0, 1)) // next: 0, 1, 2, 3; complete
```

**Scope and overloads.** The variadic native form preserves unions of heterogeneous initial values, including null and undefined. Only the scheduler-argument overload is deprecated; startWith itself is current.

**References.** [API](https://rxjs.dev/api/operators/startWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/startWith.ts)

**Compare.** [endWith](#endWith) · [concatWith](#concatWith) · [scan](#scan) · [defer](#defer)

---

<a id="withLatestFrom"></a>
### withLatestFrom

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
withLatestFrom(other: B*): A* => [A, B]*
```

**Behavior.** When the primary source emits A, pair it with the latest B from the companion. Companion values update the remembered B without triggering output.

**Execution details.**

- Every companion must have emitted once before a primary value can produce a tuple; early primary values are discarded.
- Companions are subscribed before the primary source. A synchronous companion can establish its latest value during setup.
- Companion completion does not complete the result. A completed companion's last value remains available; a companion that completes empty never establishes readiness.
- Primary completion completes the result and unsubscribes companions; an error from any subscribed input terminates it.

**Example.**

```ts
of(1, 2).pipe(withLatestFrom(of('a', 'b'))) // next: [1, 'b'], [2, 'b']; complete
```

**Scope and overloads.** The selected form has one Observable companion. Native forms accept multiple ObservableInput companions and an optional projection; output tuples keep the primary value first.

**References.** [API](https://rxjs.dev/api/operators/withLatestFrom) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/withLatestFrom.ts)

**Compare.** [combineLatestWith](#combineLatestWith) · [sample](#sample) · [zipWith](#zipWith)

---

<a id="combineAll"></a>
### combineAll

Deprecated in 7.8.2 · Supplement · Import: `rxjs` · API role: pipeable

```text
combineAll(): (A*)* => (A[])*
```

**Behavior.** Collect inner sources until outer completion, then emit arrays of their latest values. This is the older name for combineLatestAll.

**Execution details.**

- Inner subscriptions begin only after the outer completes.
- Each collected inner must emit before any combined array can be emitted; later arrays retain collected-source order.
- Normal completion waits for all collected inner sources; an empty outer completes without emitting.

**Example.**

```ts
of(of(1, 2), of(10, 20)).pipe(combineAll()) // next: [2, 10], [2, 20]; complete
```

**Scope and overloads.** The function is a direct alias of combineLatestAll, including its ObservableInput and projection overloads.

**Modern alternative.** combineLatestAll

**References.** [API](https://rxjs.dev/api/operators/combineAll) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/combineAll.ts)

**Compare.** [combineLatestAll](#combineLatestAll) · [combineLatest](#combineLatest)

---

<a id="combineLatest-operator"></a>
### combineLatest (legacy pipeable form)

Deprecated in 7.8.2 · Supplement · Import: `rxjs/operators` · API role: pipeable

```text
combineLatest(other: B*): A* => [A, B]*
```

**Behavior.** Combine the primary source with companions so every input update emits their latest-value tuple once all inputs have emitted.

**Execution details.**

- This is the legacy pipeable import from rxjs/operators; the creation function exported by rxjs is a separate API.
- Completed inputs retain their latest values; normal completion waits for all inputs. An empty-completing input prevents readiness without forcing immediate completion in RxJS 7.8.2.
- The primary source is subscribed before its companions, which affects synchronous examples.

**Example.**

```ts
import { combineLatest as combineLatestOperator } from 'rxjs/operators';
of(1, 2).pipe(combineLatestOperator(of('a', 'b'))) // next: [2, 'a'], [2, 'b']; complete
```

**Scope and overloads.** Legacy forms accept an array or separate ObservableInput companions and an optional projection. Prefer combineLatestWith followed by map for a projected result.

**Modern alternative.** combineLatestWith

**References.** [API](https://rxjs.dev/api/operators/combineLatest) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/combineLatest.ts)

**Compare.** [combineLatestWith](#combineLatestWith) · [combineLatest](#combineLatest) · [withLatestFrom](#withLatestFrom)

---

<a id="combineLatestWith"></a>
### combineLatestWith

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
combineLatestWith(other: B*): A* => [A, B]*
```

**Behavior.** After both inputs have supplied a value, any new value from either input emits a tuple containing their latest values.

**Execution details.**

- The primary source is subscribed first, followed by companions in argument order; synchronous inputs can finish during setup.
- A completed input's last value remains usable. Normal result completion waits for all inputs to complete.
- In RxJS 7.8.2, an input that completes empty prevents tuples but does not itself force immediate result completion; another input can keep the result open.
- A source error terminates the result and unsubscribes the other inputs.

**Example.**

```ts
of(1, 2).pipe(combineLatestWith(of('a', 'b'))) // next: [2, 'a'], [2, 'b']; complete
```

**Scope and overloads.** The native variadic form accepts several ObservableInput companions and produces [A, B, C, ...]* in source order.

**References.** [API](https://rxjs.dev/api/operators/combineLatestWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/combineLatestWith.ts)

**Compare.** [combineLatest](#combineLatest) · [withLatestFrom](#withLatestFrom) · [zipWith](#zipWith) · [combineLatest (pipeable)](#combineLatest-operator)

---

<a id="concat-operator"></a>
### concat (legacy pipeable form)

Deprecated in 7.8.2 · Supplement · Import: `rxjs/operators` · API role: pipeable

```text
concat(other: B*): A* => (A | B)*
```

**Behavior.** Forward the primary source, then subscribe to each supplied companion in order after the previous source completes.

**Execution details.**

- This is the legacy pipeable import from rxjs/operators, distinct from the concat creation function.
- A nonterminating input blocks later subscriptions; an error ends the sequence.
- Hot companion values sent before the companion's turn are not retained.

**Example.**

```ts
import { concat as concatOperator } from 'rxjs/operators';
of(1, 2).pipe(concatOperator(of('a'))) // next: 1, 2, 'a'; complete
```

**Scope and overloads.** Legacy forms accept multiple ObservableInput companions and an optional final scheduler. Use concatWith for the selected unscheduled form.

**Modern alternative.** concatWith

**References.** [API](https://rxjs.dev/api/operators/concat) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/concat.ts)

**Compare.** [concatWith](#concatWith) · [concat](#concat) · [concatAll](#concatAll)

---

<a id="concatWith"></a>
### concatWith

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
concatWith(other: B*): A* => (A | B)*
```

**Behavior.** Forward the primary source, then subscribe to the companion after the primary completes and forward the companion.

**Execution details.**

- With multiple companions, subscriptions proceed in argument order, one at a time.
- A source that never completes blocks later subscriptions; an error ends the sequence without moving on.
- Values from a hot companion before its turn are not buffered by concatWith.

**Example.**

```ts
of(1, 2).pipe(concatWith(of('a', 'b'))) // next: 1, 2, 'a', 'b'; complete
```

**Scope and overloads.** The native form accepts multiple ObservableInput companions. The output payload is the union of their value types and the primary source's value type.

**References.** [API](https://rxjs.dev/api/operators/concatWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/concatWith.ts)

**Compare.** [concat](#concat) · [concatAll](#concatAll) · [mergeWith](#mergeWith) · [concat (pipeable)](#concat-operator)

---

<a id="endWith"></a>
### endWith

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
endWith(...values: B[]): A* => (A | B)*
```

**Behavior.** Forward the source, then emit the supplied values in order after normal source completion and complete the result.

**Execution details.**

- In the selected form, the appended values are emitted synchronously when source completion is received.
- A source error or downstream unsubscription does not emit the appended values.
- A source that never completes never reaches the appended values.

**Example.**

```ts
of(1, 2).pipe(endWith('done')) // next: 1, 2, 'done'; complete
```

**Scope and overloads.** The native variadic form preserves unions of heterogeneous appended values. The scheduler-argument behavior is deprecated; endWith itself is current.

**References.** [API](https://rxjs.dev/api/operators/endWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/endWith.ts)

**Compare.** [startWith](#startWith) · [concatWith](#concatWith) · [finalize](#finalize) · [takeUntil](#takeUntil)

---

<a id="merge-operator"></a>
### merge (legacy pipeable form)

Deprecated in 7.8.2 · Supplement · Import: `rxjs/operators` · API role: pipeable

```text
merge(other: B*): A* => (A | B)*
```

**Behavior.** Subscribe to the primary and companion sources and interleave their arriving values into one result.

**Execution details.**

- This is the legacy pipeable import from rxjs/operators, distinct from the merge creation function.
- The selected form starts inputs in source order and permits overlapping subscriptions without a concurrency limit.
- Normal completion waits for all inputs; an input error terminates the result and cancels the others.

**Example.**

```ts
import { merge as mergeOperator } from 'rxjs/operators';
of(1, 2).pipe(delay(10), mergeOperator(of('a'))) // next: 'a', 1, 2; complete
```

**Scope and overloads.** Legacy forms accept multiple ObservableInput companions, an optional concurrency number, and an optional scheduler. Those extra options are not parameters of mergeWith.

**Modern alternative.** mergeWith for the common unlimited-concurrency form; use merge or mergeAll for an explicit concurrency limit

**References.** [API](https://rxjs.dev/api/operators/merge) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/merge.ts)

**Compare.** [mergeWith](#mergeWith) · [merge](#merge) · [mergeAll](#mergeAll)

---

<a id="mergeWith"></a>
### mergeWith

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
mergeWith(other: B*): A* => (A | B)*
```

**Behavior.** Subscribe to the primary and companion sources and forward each input's values as they arrive.

**Execution details.**

- Subscriptions start in primary-then-companion order, so a synchronous input can emit during setup before later inputs are subscribed.
- Normal completion waits for every input to complete.
- An error from any input terminates the result and unsubscribes the others.

**Example.**

```ts
of(1, 2).pipe(delay(10), mergeWith(of('a'))) // next: 'a', 1, 2; complete
```

**Scope and overloads.** The native form accepts multiple ObservableInput companions. For an explicit concurrency limit, use an appropriate merge creation form or a higher-order source with mergeAll(limit).

**References.** [API](https://rxjs.dev/api/operators/mergeWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeWith.ts)

**Compare.** [merge](#merge) · [mergeAll](#mergeAll) · [concatWith](#concatWith) · [merge (pipeable)](#merge-operator)

---

<a id="race-operator"></a>
### race (legacy pipeable form)

Deprecated in 7.8.2 · Supplement · Import: `rxjs/operators` · API role: pipeable

```text
race(other: B*): A* => (A | B)*
```

**Behavior.** Race the primary and companion sources: the first next chooses a source to follow, while a first complete or error ends the result immediately.

**Execution details.**

- This is the legacy pipeable import from rxjs/operators, distinct from the race creation function.
- Losing subscriptions are closed; a synchronous winner can prevent later inputs from being subscribed.
- An empty input can end the race before any value is emitted.

**Example.**

```ts
import { race as raceOperator } from 'rxjs/operators';
of(1, 2).pipe(raceOperator(of('later'))) // next: 1, 2; complete
```

**Scope and overloads.** Legacy forms accept an array or separate ObservableInput companions. The implementation delegates to raceWith.

**Modern alternative.** raceWith

**References.** [API](https://rxjs.dev/api/operators/race) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/race.ts)

**Compare.** [raceWith](#raceWith) · [race](#race) · [mergeWith](#mergeWith)

---

<a id="raceWith"></a>
### raceWith

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
raceWith(other: B*): A* => (A | B)*
```

**Behavior.** Let the first input notification decide the result. A first next selects that source for the remaining output; a first complete or error ends the result immediately.

**Execution details.**

- Once a source wins with a next value, other subscribed inputs are unsubscribed.
- Inputs are subscribed in primary-then-companion order. A synchronous winner can prevent later inputs from being subscribed at all.
- An empty source can win by completing before any competing value arrives.

**Example.**

```ts
of(1, 2).pipe(raceWith(of('later'))) // next: 1, 2; complete; the companion is never subscribed
```

**Scope and overloads.** The native form accepts multiple ObservableInput companions. With no companions, raceWith() returns the primary source unchanged.

**References.** [API](https://rxjs.dev/api/operators/raceWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/raceWith.ts)

**Compare.** [race](#race) · [mergeWith](#mergeWith) · [race (pipeable)](#race-operator)

---

<a id="zip-operator"></a>
### zip (legacy pipeable form)

Deprecated in 7.8.2 · Supplement · Import: `rxjs/operators` · API role: pipeable

```text
zip(other: B*): A* => [A, B]*
```

**Behavior.** Combine equally numbered values from the primary and companion sources into tuples, waiting until every input has its next unpaired value.

**Execution details.**

- This is the legacy pipeable import from rxjs/operators, distinct from the zip creation function.
- Faster inputs are queued; completion occurs when a completed input has no queued values left.
- Queue growth depends on differences in input rates, so a slow companion can retain many primary values.

**Example.**

```ts
import { zip as zipOperator } from 'rxjs/operators';
of(1, 2, 3).pipe(zipOperator(of('a', 'b'))) // next: [1, 'a'], [2, 'b']; complete
```

**Scope and overloads.** Legacy forms accept multiple ObservableInput companions and optional projection overloads. Prefer zipWith followed by map for a projected result.

**Modern alternative.** zipWith

**References.** [API](https://rxjs.dev/api/operators/zip) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/zip.ts)

**Compare.** [zipWith](#zipWith) · [zip](#zip) · [zipAll](#zipAll)

---

<a id="zipAll"></a>
### zipAll

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
zipAll(): (A*)* => (A[])*
```

**Behavior.** Collect inner sources until the outer completes, then combine their first values, second values, and later matching positions into arrays.

**Execution details.**

- No inner is subscribed before outer completion; a nonterminating outer prevents the join from starting.
- Array positions follow the order in which inner sources were collected, while each inner's unpaired values wait in a queue.
- The result completes when any completed inner has no queued value left. An empty outer completes without a next value.
- Hot inner values sent before the eventual subscriptions are missed, and faster subscribed inners can grow their queues.

**Example.**

```ts
of(of(1, 2), of(10, 20, 30)).pipe(zipAll()) // next: [1, 10], [2, 20]; complete
```

**Scope and overloads.** The selected form uses homogeneous Observable<A> inners. Native inputs may be other ObservableInput values; an optional projection changes the output from (A[])* to B*.

**References.** [API](https://rxjs.dev/api/operators/zipAll) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/zipAll.ts)

**Compare.** [zip](#zip) · [zipWith](#zipWith) · [combineLatestAll](#combineLatestAll)

---

<a id="zipWith"></a>
### zipWith

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
zipWith(other: B*): A* => [A, B]*
```

**Behavior.** Pair the first value from each input, then the second from each, and so on. Emit a tuple whenever every input has its next unpaired value available.

**Execution details.**

- Values from faster inputs wait in queues; these queues can grow when arrival rates differ.
- A completed input can still contribute values already queued.
- The result completes as soon as a completed input has no queued value left, because another full tuple is impossible. An input that completes empty can therefore end the result immediately.

**Example.**

```ts
of(1, 2, 3).pipe(zipWith(of('a', 'b'))) // next: [1, 'a'], [2, 'b']; complete
```

**Scope and overloads.** The native variadic form accepts multiple ObservableInput companions and emits tuples in primary-then-companion order.

**References.** [API](https://rxjs.dev/api/operators/zipWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/zipWith.ts)

**Compare.** [zip](#zip) · [zipAll](#zipAll) · [combineLatestWith](#combineLatestWith) · [zip (pipeable)](#zip-operator)

---

<a id="multicasting-operators"></a>
## Multicasting Operators

Choose how listeners share source connections and what later listeners receive. Type shape alone does not specify this policy.

<a id="multicast"></a>
### multicast

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: connectable

```text
multicast(connector: () => Subject<A>): A* => ConnectableObservable<A>
```

**Behavior.** Routes one connected source execution through a Subject chosen by the caller. The returned legacy connectable exposes explicit connection control.

**Execution details.**

- Subscribing to the result attaches a listener; connect() starts the source connection. Unsubscribing the connection tears that connection down.
- A Subject instance reuses that instance; a factory can supply a new one when the legacy connectable recreates its subject. The Subject type controls replay and terminal behavior.

**Example.**

```ts
const connected$ = of(1, 2).pipe(multicast(() => new Subject<number>()));
connected$.subscribe(console.log);
connected$.connect(); // next: 1, 2; complete
```

**Scope and overloads.** The selector overload, multicast(connector, shared => result), returns B* and shares within that selector instead of exposing connect().

**Modern alternative.** connectable(source, { connector }) for explicit connections; connect(selector, { connector }) for selector-local sharing.

**References.** [API](https://rxjs.dev/api/operators/multicast) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/multicast.ts)

**Compare.** [connectable](#connectable) · [connect](#connect) · [share](#share)

---

<a id="publish"></a>
### publish

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: connectable

```text
publish(): A* => ConnectableObservable<A>
```

**Behavior.** Creates a legacy connectable backed by one plain Subject, sharing live values without replay.

**Execution details.**

- Listeners can attach before connect() starts the source. The plain Subject has no cached next value for a late listener.
- The no-selector form reuses its Subject. Its completed or errored Subject is retained for later listeners.

**Example.**

```ts
const connected$ = of(1, 2).pipe(publish());
connected$.subscribe(console.log);
connected$.connect(); // next: 1, 2; complete
```

**Scope and overloads.** publish(selector: A* => B*) returns A* => B*; use connect(selector) for that form.

**Modern alternative.** connectable(source, { connector: () => new Subject(), resetOnDisconnect: false }) for the legacy connection policy; share() for default automatic sharing.

**References.** [API](https://rxjs.dev/api/operators/publish) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/publish.ts)

**Compare.** [multicast](#multicast) · [connectable](#connectable) · [connect](#connect) · [share](#share)

---

<a id="publishBehavior"></a>
### publishBehavior

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: connectable

```text
publishBehavior(seed: A): A* => ConnectableObservable<A>
```

**Behavior.** Creates a legacy connectable backed by a BehaviorSubject. While the subject is active, a listener immediately receives its current value, initially the seed.

**Execution details.**

- The seed can be observed before connect() starts the source; source values subsequently replace the current value.
- A late listener after completion receives only complete, not the cached value. After error it receives that error.

**Example.**

```ts
const connected$ = of(1, 2).pipe(publishBehavior(0));
connected$.subscribe(console.log); // next: 0
connected$.connect(); // next: 1, 2; complete
```

**Modern alternative.** connectable(source, { connector: () => new BehaviorSubject(seed), resetOnDisconnect: false }); choose share configuration explicitly for automatic connections.

**References.** [API](https://rxjs.dev/api/operators/publishBehavior) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/publishBehavior.ts)

**Compare.** [publishReplay](#publishReplay) · [connectable](#connectable) · [share](#share)

---

<a id="publishLast"></a>
### publishLast

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: connectable

```text
publishLast(): A* => ConnectableObservable<A>
```

**Behavior.** Creates a legacy connectable backed by an AsyncSubject. It remembers the latest source value and publishes that value only when the source completes normally.

**Execution details.**

- An empty source completes without a next value; a source error is forwarded without publishing the remembered value.
- After successful completion, late listeners receive the final value and complete. Before completion, source values are withheld.

**Example.**

```ts
const connected$ = of(1, 2, 3).pipe(publishLast());
connected$.subscribe(console.log);
connected$.connect(); // next: 3; complete
```

**Modern alternative.** connectable(source, { connector: () => new AsyncSubject(), resetOnDisconnect: false }).

**References.** [API](https://rxjs.dev/api/operators/publishLast) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/publishLast.ts)

**Compare.** [last](#last) · [connectable](#connectable) · [share](#share)

---

<a id="publishReplay"></a>
### publishReplay

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: connectable

```text
publishReplay(bufferSize?: number, windowTime?: number): A* => ConnectableObservable<A>
```

**Behavior.** Creates a legacy connectable backed by one ReplaySubject. New listeners first receive eligible cached values, then live values.

**Execution details.**

- The buffer is limited by count and age; both defaults are unbounded. connect() starts the source; replay itself does not start it.
- The same ReplaySubject is retained, including its completion or error. Cached values within the retention limits can be replayed before that terminal notification.

**Example.**

```ts
const connected$ = of(1, 2, 3).pipe(publishReplay(2));
const connection = (connected$ as ConnectableObservable<number>).connect();
connected$.subscribe(console.log); // next: 2, 3; complete
```

**Scope and overloads.** This card shows runtime connectability. The no-selector public overload is typed only as MonoTypeOperatorFunction<A>, so TypeScript can require the cast shown. Selector and timestamp-provider overloads also exist.

**Modern alternative.** connectable(source, { connector: () => new ReplaySubject(bufferSize, windowTime), resetOnDisconnect: false }); shareReplay has different reset defaults.

**References.** [API](https://rxjs.dev/api/operators/publishReplay) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/publishReplay.ts)

**Compare.** [shareReplay](#shareReplay) · [publishBehavior](#publishBehavior) · [connectable](#connectable)

---

<a id="share"></a>
### share

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
share(config?: ShareConfig<A>): A* => A*
```

**Behavior.** Shares a source connection among listeners attached to the same shared Observable instance. The default connector is a plain Subject, so it forwards live values without replay.

**Execution details.**

- By default the first listener connects, and losing the last listener disconnects an active source. Error, completion, and a zero listener count each reset the sharing state.
- Separate subscriptions to a synchronously completing shared source can each start a new execution because the first execution has already completed and reset.
- The configuration changes the connector and reset policies; it can retain a terminal state or delay a reset.

**Example.**

```ts
const shared$ = interval(1000).pipe(share());
// Overlapping subscriptions to shared$ use one interval connection.
```

**Scope and overloads.** The signature preserves payload type; sharing is a connection policy, not a property of A* itself.

**References.** [API](https://rxjs.dev/api/operators/share) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/share.ts)

**Compare.** [shareReplay](#shareReplay) · [connect](#connect) · [refCount](#refCount)

---

<a id="connect"></a>
### connect

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
connect(selector: A* => B*, config?: ConnectConfig<A>): A* => B*
```

**Behavior.** Gives a selector a shared view of the source, then connects the source after the selected result has been subscribed. This lets several branches observe one source execution within that result subscription.

**Execution details.**

- A new connector is made for each subscription to the resulting Observable. This does not automatically share across separate result subscriptions.
- The default connector is a plain Subject. The selected result supplies the output type and termination policy; tearing down the result also tears down its source connection.

**Example.**

```ts
of(1, 2).pipe(connect(shared$ =>
  merge(shared$.pipe(map(n => n * 10)), shared$.pipe(map(n => n + 1)))
)) // next: 10, 2, 20, 3; complete
```

**Scope and overloads.** The actual selector may return any ObservableInput<B>. ConnectConfig<A> requires a connector when a config object is supplied.

**References.** [API](https://rxjs.dev/api/operators/connect) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/connect.ts)

**Compare.** [share](#share) · [connectable](#connectable) · [multicast](#multicast)

---

<a id="connectable"></a>
### connectable

Current API · Supplement · Import: `rxjs` · API role: connectable

```text
connectable(source: A*, config?: ConnectableConfig<A>): Connectable<A>
```

**Behavior.** Create a shared stream with an explicit connection switch. Subscribers attach to the shared subject; connect() starts the source subscription.

**Execution details.**

- The default connector creates a plain Subject, so it does not replay earlier values to later subscribers.
- connect() returns the shared connection Subscription. Unsubscribing that connection disconnects the source; merely having no observers does not automatically disconnect it.
- By default, resetOnDisconnect is true: ending a connection replaces the subject for future subscriptions and connections. Existing observers are not moved to the replacement subject.
- Attach observers before connecting when synchronous source values must reach them.

**Example.**

```ts
const shared = connectable(of(1, 2));
shared.subscribe(console.log); // no source values yet
shared.connect(); // next: 1, 2; complete
```

**Scope and overloads.** The actual source may be ObservableInput. Connectable<A> is an A* with connect(): Subscription. A supplied config provides a connector factory and may select resetOnDisconnect; replay requires an appropriate connector.

**References.** [API](https://rxjs.dev/api/index/function/connectable) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/observable/connectable.ts)

**Compare.** [share](#share) · [connect](#connect) · [multicast](#multicast)

---

<a id="refCount"></a>
### refCount

Deprecated in 7.8.2 · Supplement · Import: `rxjs` · API role: pipeable

```text
refCount(): ConnectableObservable<A> => A*
```

**Behavior.** Adds listener-count control to a legacy ConnectableObservable: connect for the first listener and disconnect an active shared connection after the last listener leaves.

**Execution details.**

- The connector and its retained terminal state come from the preceding legacy multicasting operation; refCount does not add replay or choose reset behavior.
- This teaching input names the legacy connectable requirement even though the public TypeScript return type is MonoTypeOperatorFunction<A>. Do not treat it as a generic adapter for the newer connectable() result.

**Example.**

```ts
const shared$ = interval(1000).pipe(publish(), refCount());
// Legacy automatic connection pattern; prefer share().
```

**Modern alternative.** share(), with an explicit connector/reset configuration when preserving legacy behavior.

**References.** [API](https://rxjs.dev/api/operators/refCount) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/refCount.ts)

**Compare.** [share](#share) · [publish](#publish) · [connectable](#connectable)

---

<a id="shareReplay"></a>
### shareReplay

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
shareReplay(config: ShareReplayConfig): A* => A*
```

**Behavior.** Shares through a ReplaySubject so late listeners receive eligible cached values before live values.

**Execution details.**

- Prefer an explicit bufferSize and refCount. With refCount: true, losing the last listener resets and disconnects an active source; refCount: false keeps that active connection.
- In RxJS 7.8.2, an error resets the shared state, but successful completion retains the replay cache. refCount: true does not clear a successfully completed cache.
- windowTime limits the age of replayed values; expiration is checked by the ReplaySubject and does not by itself trigger a new source execution.

**Example.**

```ts
const shared$ = of(1, 2, 3).pipe(shareReplay({ bufferSize: 1, refCount: true }));
shared$.subscribe(console.log); // next: 1, 2, 3; complete
shared$.subscribe(console.log); // next: 3; complete
```

**Scope and overloads.** The positional overload shareReplay(bufferSize?, windowTime?, scheduler?) defaults refCount to false. The scheduler supplies the replay timestamp clock; it does not schedule delivery of cached values.

**References.** [API](https://rxjs.dev/api/operators/shareReplay) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/shareReplay.ts)

**Compare.** [share](#share) · [publishReplay](#publishReplay)

---

<a id="error-handling-operators"></a>
## Error Handling Operators

Choose whether an error terminates, selects another input, or requests another subscription.

<a id="catchError"></a>
### catchError

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
catchError(recover: unknown => B*): A* => (A | B)*
```

**Behavior.** Forwards source values until an error, then replaces the failed subscription with the Observable returned by recover.

**Execution details.**

- Values emitted before the error remain in the output. Returning a fallback does not undo those values or resume the failed source.
- A thrown recovery error, or an error from the replacement, propagates downstream. Unsubscription tears down whichever subscription is active.

**Example.**

```ts
concat(of(1), throwError(() => new Error('failed'))).pipe(
  catchError(() => of('fallback'))
) // next: 1, 'fallback'; complete
```

**Scope and overloads.** The actual callback receives (error, caught) and returns ObservableInput<B>. Returning caught requests resubscription through the same catchError logic.

**References.** [API](https://rxjs.dev/api/operators/catchError) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/catchError.ts)

**Compare.** [retry](#retry) · [onErrorResumeNextWith](#onErrorResumeNextWith)

---

<a id="retry"></a>
### retry

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
retry(config?: number | RetryConfig): A* => A*
```

**Behavior.** On source error, subscribes to the source again, up to the retry policy. Every attempt can contribute values to the same output.

**Execution details.**

- retry(2) allows the original subscription plus two retries. The default count is unbounded; count <= 0 does not retry. Completion is forwarded normally.
- A delay may be a duration or an error/count callback. The first delay-notifier next retries; completion without a next completes the result, and a notifier error errors it.
- resetOnSuccess resets the retry counter on a next value, not on completion; it defaults to false. Resubscription repeats source side effects.

**Example.**

```ts
defer(() => of(1)).pipe(retry(2)) // next: 1; complete; no retry needed
```

**Scope and overloads.** RetryConfig contains count?, delay?, and resetOnSuccess?. The callback retry count starts at 1.

**References.** [API](https://rxjs.dev/api/operators/retry) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/retry.ts)

**Compare.** [repeat](#repeat) · [retryWhen](#retryWhen) · [catchError](#catchError)

---

<a id="retryWhen"></a>
### retryWhen

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: pipeable

```text
retryWhen(notifier: unknown* => unknown*): A* => A*
```

**Behavior.** Feeds source errors into a notifier factory. Notifier next values request new subscriptions to the source.

**Execution details.**

- The notifier is created after the first source error. Its output controls retries; its own next payload is ignored.
- Notifier completion completes the result and notifier error errors it. Ordinary source completion completes the result without requiring notifier completion.

**Example.**

```ts
request$.pipe(retryWhen(errors$ => errors$.pipe(delay(1000))))
// After each source error, the notifier requests a retry after 1 second.
```

**Scope and overloads.** The notifier may return any ObservableInput. Errors are typed unknown in this teaching view instead of the public any.

**Modern alternative.** retry({ delay: (error, retryCount) => retrySignal$ }) for the usual retry policy; translate custom notifier state deliberately.

**References.** [API](https://rxjs.dev/api/operators/retryWhen) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/retryWhen.ts)

**Compare.** [retry](#retry)

---

<a id="onErrorResumeNext-operator"></a>
### onErrorResumeNext (legacy pipeable form)

Deprecated in 7.8.2 · Supplement · Import: `rxjs/operators` · API role: pipeable

```text
onErrorResumeNext(next: B*): A* => (A | B)*
```

**Behavior.** The legacy pipeable name for onErrorResumeNextWith. It advances to the next input when the current input completes or errors.

**Execution details.**

- This entry is the rxjs/operators export. The same name imported from rxjs is a creation function that takes all sources directly.
- Errors from constituent inputs are swallowed; a nonterminating input prevents progression.

**Example.**

```ts
// import { onErrorResumeNext } from 'rxjs/operators';
throwError(() => new Error('failed')).pipe(onErrorResumeNext(of(2))) // next: 2; complete
```

**Modern alternative.** onErrorResumeNextWith from rxjs.

**References.** [API](https://rxjs.dev/api/operators/onErrorResumeNext) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/onErrorResumeNextWith.ts)

**Compare.** [onErrorResumeNextWith](#onErrorResumeNextWith) · [onErrorResumeNext](#onErrorResumeNext)

---

<a id="onErrorResumeNextWith"></a>
### onErrorResumeNextWith

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
onErrorResumeNextWith(next: B*): A* => (A | B)*
```

**Behavior.** Concatenates subscriptions, advancing to the next input after either normal completion or error. Errors from the constituent inputs are swallowed.

**Execution details.**

- Inputs are subscribed sequentially. An input that never terminates prevents reaching later inputs.
- There is no recovery callback and no error value to inspect here; use catchError when the error should determine the fallback.

**Example.**

```ts
throwError(() => new Error('failed')).pipe(onErrorResumeNextWith(of('next')))
// next: 'next'; complete
```

**Scope and overloads.** Variadic and array input forms accept ObservableInput values and produce the union of input payloads.

**References.** [API](https://rxjs.dev/api/operators/onErrorResumeNextWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/onErrorResumeNextWith.ts)

**Compare.** [onErrorResumeNext](#onErrorResumeNext) · [catchError](#catchError) · [concatWith](#concatWith)

---

<a id="utility-operators"></a>
## Utility Operators

Observe execution, schedule work or delivery, measure time, enforce deadlines, or convert notifications.

<a id="tap"></a>
### tap

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
tap(effect: A => void): A* => A*
```

**Behavior.** Runs an effect for each source value and forwards that same value. The callback return value is ignored.

**Execution details.**

- A synchronous exception in the next-value callback becomes an error downstream. Teardown hooks have teardown-error behavior instead. Callbacks can still mutate referenced objects.
- tap does not start a subscription by itself. Its observer-object form also provides error, complete, subscribe, unsubscribe, and finalize hooks.

**Example.**

```ts
of(1, 2).pipe(tap(n => console.log(n))) // next: 1, 2; complete; also logs each value
```

**Scope and overloads.** Use an observer object for multiple hooks. The older separate next/error/complete-argument overload is deprecated; tap itself is current.

**References.** [API](https://rxjs.dev/api/operators/tap) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/tap.ts)

**Compare.** [map](#map) · [finalize](#finalize)

---

<a id="delay"></a>
### delay

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
delay(due: number | Date, scheduler?: SchedulerLike): A* => A*
```

**Behavior.** Holds source values until their scheduled release time. A numeric due delays each value by that duration; a Date is an absolute release time.

**Execution details.**

- The default scheduler is asyncScheduler. The source is subscribed immediately; this delays delivery, not the start of source work.
- Completion waits for held values. A source error is forwarded immediately and discards held values; unsubscription also discards them.
- An empty source can complete immediately: delay does not simply shift every terminal notification by the due time.

**Example.**

```ts
of(1, 2).pipe(delay(100)) // after about 100 ms: next 1, 2; complete
```

**References.** [API](https://rxjs.dev/api/operators/delay) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/delay.ts)

**Compare.** [delayWhen](#delayWhen) · [observeOn](#observeOn) · [subscribeOn](#subscribeOn)

---

<a id="delayWhen"></a>
### delayWhen

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
delayWhen(release: A => unknown*): A* => A*
```

**Behavior.** Creates a release Observable for each source value. The first next from that Observable releases that value.

**Execution details.**

- Each value has its own subscription, so later source values can be released first. Output order need not match source order.
- A release Observable that completes without a next drops its value in RxJS 7.8.2. Source completion waits for outstanding releases; errors terminate and discard pending values.

**Example.**

```ts
of(1, 2).pipe(delayWhen(n => timer(n === 1 ? 20 : 10)))
// next: 2 at about 10 ms, 1 at about 20 ms; complete
```

**Scope and overloads.** The actual callback also receives an index and may return ObservableInput. The deprecated subscriptionDelay overload gates the initial source subscription on notifier next or completion.

**References.** [API](https://rxjs.dev/api/operators/delayWhen) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/delayWhen.ts)

**Compare.** [delay](#delay) · [debounce](#debounce)

---

<a id="dematerialize"></a>
### dematerialize

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
dematerialize(): Notice<A>* => A*
```

**Behavior.** Interprets notification objects as real next, error, and complete notifications.

**Execution details.**

- An N notice emits its value. An E notice errors the result; a C notice completes it. Either terminal notice ends the subscription and prevents later notices from being delivered.
- The input stream can also terminate through its own error or completion channel; a terminal notice is not required.

**Example.**

```ts
of(1, 2).pipe(materialize(), dematerialize()) // next: 1, 2; complete
```

**Scope and overloads.** The actual input is ObservableNotification<A>, including structurally compatible objects. The output type extracts the value of N notices.

**References.** [API](https://rxjs.dev/api/operators/dematerialize) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/dematerialize.ts)

**Compare.** [materialize](#materialize)

---

<a id="materialize"></a>
### materialize

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
materialize(): A* => Notice<A>*
```

**Behavior.** Turns next, error, and complete notifications into ordinary next values describing those notifications.

**Execution details.**

- A source error becomes one E notice followed by normal completion of the materialized result. Normal source completion becomes one C notice followed by completion.
- Unsubscription creates no notice. Materializing an outer stream does not materialize notifications inside its inner streams.

**Example.**

```ts
of(1).pipe(materialize()) // next: N(1), C; complete
// N(1) and C describe notification objects here, not function calls.
```

**Scope and overloads.** Notice<A> denotes the observable-notification union. Runtime results are Notification<A> instances that also satisfy ObservableNotification<A>.

**References.** [API](https://rxjs.dev/api/operators/materialize) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/materialize.ts)

**Compare.** [dematerialize](#dematerialize)

---

<a id="observeOn"></a>
### observeOn

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
observeOn(scheduler: SchedulerLike, delay?: number): A* => A*
```

**Behavior.** Schedules delivery of next, error, and complete notifications to the downstream listener.

**Execution details.**

- It does not schedule when source subscription begins or move source work to another thread. The chosen scheduler determines execution timing.
- Delay defaults to 0. Unsubscription cancels pending scheduled deliveries. Unlike delay, an error is scheduled too.

**Example.**

```ts
of(1, 2).pipe(observeOn(asyncScheduler))
// Schedules next 1, next 2, and complete after the current synchronous work.
```

**References.** [API](https://rxjs.dev/api/operators/observeOn) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/observeOn.ts)

**Compare.** [subscribeOn](#subscribeOn) · [delay](#delay)

---

<a id="subscribeOn"></a>
### subscribeOn

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
subscribeOn(scheduler: SchedulerLike, delay?: number): A* => A*
```

**Behavior.** Schedules the act of subscribing to the source, including the work performed as that subscription starts.

**Execution details.**

- Once the source starts, its own behavior determines how values are delivered. This is not a per-notification scheduling policy.
- Delay defaults to 0. Unsubscribing before the scheduled subscription runs cancels it, so source work does not start.

**Example.**

```ts
defer(() => of(1, 2)).pipe(subscribeOn(asyncScheduler))
// The factory is called when the scheduled source subscription runs.
```

**References.** [API](https://rxjs.dev/api/operators/subscribeOn) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/subscribeOn.ts)

**Compare.** [observeOn](#observeOn) · [defer](#defer)

---

<a id="timeInterval"></a>
### timeInterval

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
timeInterval(scheduler?: SchedulerLike): A* => { value: A; interval: number }*
```

**Behavior.** Pairs each source value with the elapsed clock time since the preceding source value, or since subscription for the first value.

**Execution details.**

- The default clock is asyncScheduler.now(). interval is a duration, not an absolute timestamp.
- The operator measures time without delaying values or scheduling source work. Clock units follow the supplied scheduler.

**Example.**

```ts
interval(100).pipe(take(2), timeInterval())
// Values 0 and 1 are wrapped with intervals of about 100 ms each.
```

**Scope and overloads.** The actual result is a TimeInterval<A> object with these public fields.

**References.** [API](https://rxjs.dev/api/operators/timeInterval) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/timeInterval.ts)

**Compare.** [timestamp](#timestamp)

---

<a id="timestamp"></a>
### timestamp

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
timestamp(clock?: TimestampProvider): A* => { value: A; timestamp: number }*
```

**Behavior.** Pairs each source value with the current clock reading at the point this operator receives it.

**Execution details.**

- By default the clock uses Date.now(). timestamp is an absolute clock reading, unlike the elapsed duration from timeInterval.
- A custom TimestampProvider only needs now(). Reading a clock neither delays delivery nor changes source scheduling.

**Example.**

```ts
of("ready").pipe(timestamp())
// next: { value: "ready", timestamp: currentClockReading }; complete
```

**Scope and overloads.** The actual result type is Timestamp<A>. A SchedulerLike can serve as a TimestampProvider.

**References.** [API](https://rxjs.dev/api/operators/timestamp) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/timestamp.ts)

**Compare.** [timeInterval](#timeInterval) · [observeOn](#observeOn)

---

<a id="timeout"></a>
### timeout

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
timeout(due: number | Date, scheduler?: SchedulerLike): A* => A*
timeout(config: TimeoutConfig<A, B*> & { with: TimeoutInfo<A> => B* }): A* => (A | B)*
```

**Behavior.** Enforces a deadline for receiving a source value. On expiry it unsubscribes the source and either errors or switches to a configured fallback.

**Execution details.**

- For a positive numeric due, the deadline covers the first value and every following gap. A Date overload sets only the first-value deadline. asyncScheduler is the default scheduler.
- The config separates first and each. Without with, expiry raises TimeoutError; with supplies the replacement subscription. Values already forwarded remain in the result.
- The fallback is not recursively checked by the same timeout. Completion or error before a deadline ends the source normally for that channel.

**Example.**

```ts
NEVER.pipe(timeout({ first: 100, with: () => of("fallback") }))
// next: "fallback" at about 100 ms; complete
```

**Scope and overloads.** At least first or each is required at runtime. The full API accepts ObservableInput fallbacks and metadata. The zero/negative each edge is not represented by the positive-duration teaching rule.

**References.** [API](https://rxjs.dev/api/operators/timeout) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/timeout.ts)

**Compare.** [timeoutWith](#timeoutWith) · [takeUntil](#takeUntil) · [catchError](#catchError)

---

<a id="timeoutWith"></a>
### timeoutWith

Deprecated in 7.8.2 · Requested list · Import: `rxjs` · API role: pipeable

```text
timeoutWith(due: number | Date, fallback: B*, scheduler?: SchedulerLike): A* => (A | B)*
```

**Behavior.** The older timeout form that switches to a supplied fallback when a source-value deadline expires.

**Execution details.**

- A positive number guards the first value and subsequent gaps; a Date guards the first value only.
- On expiry the source is unsubscribed and fallback is subscribed. Previously delivered values remain in the output.

**Example.**

```ts
NEVER.pipe(timeoutWith(100, of("fallback")))
// next: "fallback" at about 100 ms; complete
```

**Scope and overloads.** The actual fallback may be any ObservableInput<B>.

**Modern alternative.** timeout({ each: duration, with: () => fallback }) or timeout({ first: date, with: () => fallback }).

**References.** [API](https://rxjs.dev/api/operators/timeoutWith) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/timeoutWith.ts)

**Compare.** [timeout](#timeout)

---

<a id="toArray"></a>
### toArray

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
toArray(): A* => (A[])*
```

**Behavior.** Collects source values into one array and emits that array when the source completes normally.

**Execution details.**

- An empty completed source emits [] once. Source errors and unsubscription discard the accumulated array.
- A source that never completes never emits its array. Memory use grows with the number of collected values.

**Example.**

```ts
of(1, 2, 3).pipe(toArray()) // next: [1, 2, 3]; complete
```

**Scope and overloads.** The result is a stream carrying an array value; it is not an array of Observables.

**References.** [API](https://rxjs.dev/api/operators/toArray) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/toArray.ts)

**Compare.** [buffer](#buffer) · [reduce](#reduce)

---

<a id="finalize"></a>
### finalize

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
finalize(cleanup: () => void): A* => A*
```

**Behavior.** Registers cleanup for the subscription. It runs when that subscription ends through completion, error, or unsubscription.

**Execution details.**

- The callback receives no reason or last value. It is not a complete callback: cancellation also runs it.
- Placement around sharing matters: upstream cleanup follows the shared source connection; downstream cleanup follows each listener subscription.

**Example.**

```ts
NEVER.pipe(finalize(() => console.log("released"))).subscribe().unsubscribe();
// No next or complete; logs "released" during teardown.
```

**References.** [API](https://rxjs.dev/api/operators/finalize) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/finalize.ts)

**Compare.** [tap](#tap) · [share](#share)

---

<a id="repeat"></a>
### repeat

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
repeat(config?: number | RepeatConfig): A* => A*
```

**Behavior.** On normal source completion, subscribes again according to the repeat policy. Source errors still terminate the result.

**Execution details.**

- repeat(3) means three total source subscriptions, including the first. The default is unbounded; count <= 0 completes without subscribing to the source.
- A delay may be a duration or a completed-run-count callback. Its first next starts the next run; completion without a next ends repetition.
- Resubscription repeats source side effects. Unbounded repetition of a synchronous source needs particular care; it need not yield execution.

**Example.**

```ts
of(1, 2).pipe(repeat(2)) // next: 1, 2, 1, 2; complete
```

**Scope and overloads.** RepeatConfig contains count? and delay?. The delay callback first receives 1 after the first run completes.

**References.** [API](https://rxjs.dev/api/operators/repeat) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/repeat.ts)

**Compare.** [retry](#retry) · [repeatWhen](#repeatWhen)

---

<a id="repeatWhen"></a>
### repeatWhen

Deprecated in 7.8.2 · Supplement · Import: `rxjs` · API role: pipeable

```text
repeatWhen(notifier: void* => unknown*): A* => A*
```

**Behavior.** Feeds source completion signals into a notifier factory. Each notifier next requests another source subscription.

**Execution details.**

- Source errors are forwarded. Notifier errors also error the result.
- Notifier completion stops requesting new runs; the result completes once the active source run has also completed. This differs from retryWhen notifier completion.
- With synchronous sources and synchronous notifier completion, notification order can prevent a requested repeat from starting. Test that boundary when translating legacy notifier logic.

**Example.**

```ts
timer(10).pipe(repeatWhen(completions$ => completions$.pipe(take(1))))
// next: 0, then 0 from the repeated run; complete
```

**Scope and overloads.** The void values are next notifications signalling completed runs, not the completion channel itself. The actual notifier return type is ObservableInput.

**Modern alternative.** repeat({ delay: completedRunCount => repeatSignal$ }) for the usual repetition policy.

**References.** [API](https://rxjs.dev/api/operators/repeatWhen) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/repeatWhen.ts)

**Compare.** [repeat](#repeat) · [retryWhen](#retryWhen)

---

<a id="conditional-and-boolean-operators"></a>
## Conditional and Boolean Operators

Answer questions about a subscription. Many answers require completion; a counterexample can sometimes end the search early.

<a id="defaultIfEmpty"></a>
### defaultIfEmpty

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
defaultIfEmpty(fallback: B): A* => (A | B)*
```

**Behavior.** Forwards source values. If the source completes normally without any value, it emits the fallback before completing.

**Execution details.**

- null and undefined are ordinary values and therefore prevent the fallback from being emitted.
- It does not recover errors and does not impose a timeout on a silent, open source.

**Example.**

```ts
EMPTY.pipe(defaultIfEmpty("none")) // next: "none"; complete
```

**References.** [API](https://rxjs.dev/api/operators/defaultIfEmpty) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/defaultIfEmpty.ts)

**Compare.** [throwIfEmpty](#throwIfEmpty) · [startWith](#startWith)

---

<a id="every"></a>
### every

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
every(predicate: A => boolean): A* => boolean*
```

**Behavior.** Emits false and completes at the first value that fails the predicate. If all received values pass and the source completes, it emits true.

**Execution details.**

- An empty completed source emits true. An open source whose values all pass has not yet established true.
- The first failing value ends the subscription early. Predicate exceptions error the result.

**Example.**

```ts
of(2, 4, 5, 6).pipe(every(n => n % 2 === 0)) // next: false; complete at 5
```

**Scope and overloads.** The actual predicate also receives index and source. Boolean-constructor overloads are omitted.

**References.** [API](https://rxjs.dev/api/operators/every) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/every.ts)

**Compare.** [find](#find) · [isEmpty](#isEmpty)

---

<a id="find"></a>
### find

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
find(predicate: A => boolean): A* => (A | undefined)*
```

**Behavior.** Emits the first matching value and completes. If the source completes without a match, it emits undefined and completes.

**Execution details.**

- A successful match unsubscribes early. A nonterminating source with no match can remain open indefinitely.
- undefined is a delivered payload here, not an empty stream. It is indistinguishable by value from a matched undefined unless the domain supplies a tag.

**Example.**

```ts
of(1, 3).pipe(find(n => n % 2 === 0)) // next: undefined; complete
```

**Scope and overloads.** Type-guard predicates narrow the successful payload to B; the result still includes undefined. Index and source callback parameters are omitted.

**References.** [API](https://rxjs.dev/api/operators/find) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/find.ts)

**Compare.** [first](#first) · [findIndex](#findIndex) · [filter](#filter)

---

<a id="findIndex"></a>
### findIndex

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
findIndex(predicate: A => boolean): A* => number*
```

**Behavior.** Emits the zero-based index of the first matching source value and completes. If the source completes with no match, it emits -1.

**Execution details.**

- The index counts all received source values, including those that do not match.
- A match ends the source subscription early; without a match, normal completion is needed to conclude -1.

**Example.**

```ts
of("a", "b", "c").pipe(findIndex(x => x === "b")) // next: 1; complete
```

**Scope and overloads.** The actual predicate also receives index and source.

**References.** [API](https://rxjs.dev/api/operators/findIndex) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/findIndex.ts)

**Compare.** [find](#find)

---

<a id="isEmpty"></a>
### isEmpty

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
isEmpty(): A* => boolean*
```

**Behavior.** Emits false and completes as soon as a source value arrives. Emits true only when the source completes without a value.

**Execution details.**

- A source error before a value is an error, not true. A silent source that never completes leaves the result open.
- The false outcome needs only the first value and cancels further source delivery.

**Example.**

```ts
of(undefined).pipe(isEmpty()) // next: false; complete
```

**References.** [API](https://rxjs.dev/api/operators/isEmpty) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/isEmpty.ts)

**Compare.** [every](#every) · [defaultIfEmpty](#defaultIfEmpty)

---

<a id="sequenceEqual"></a>
### sequenceEqual

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
sequenceEqual(other: A*, equal?: (A, A) => boolean): A* => boolean*
```

**Behavior.** Compares the two sequences by value position, ignoring differences in their emission times. It emits one boolean once equality or inequality can be decided.

**Execution details.**

- Both streams must complete with matching lengths and values to establish true. A mismatching pair or an extra value after the other completes can establish false early.
- The default equality is ===. Faster input values are buffered while awaiting partners, so a large rate imbalance can grow memory.

**Example.**

```ts
of(1, 2).pipe(sequenceEqual(of(1, 2))) // next: true; complete
```

**Scope and overloads.** The actual comparison input may be ObservableInput<A>.

**References.** [API](https://rxjs.dev/api/operators/sequenceEqual) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/sequenceEqual.ts)

**Compare.** [zip](#zip) · [every](#every)

---

<a id="throwIfEmpty"></a>
### throwIfEmpty

Current API · Supplement · Import: `rxjs` · API role: pipeable

```text
throwIfEmpty(errorFactory?: () => unknown): A* => A*
```

**Behavior.** Passes source values through, but replaces an empty normal completion with an error.

**Execution details.**

- The default factory creates EmptyError. It runs only if completion arrives before any next value.
- This does not impose a deadline: a source that stays open without values keeps the result open.

**Example.**

```ts
EMPTY.pipe(throwIfEmpty()) // no next; error: EmptyError
```

**References.** [API](https://rxjs.dev/api/operators/throwIfEmpty) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/throwIfEmpty.ts)

**Compare.** [defaultIfEmpty](#defaultIfEmpty) · [first](#first)

---

<a id="mathematical-and-aggregate-operators"></a>
## Mathematical and Aggregate Operators

Produce a final aggregate when the source completes. Compare with scan when learners need every intermediate state.

<a id="count"></a>
### count

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
count(predicate?: A => boolean): A* => number*
```

**Behavior.** Counts received source values, or only the values satisfying a predicate, and emits the total on normal completion.

**Execution details.**

- An empty completed source emits 0. No running counts are emitted.
- A source error prevents a final count. Use scan when the lesson requires a running count.

**Example.**

```ts
of(1, 2, 3, 4).pipe(count(n => n % 2 === 0)) // next: 2; complete
```

**Scope and overloads.** The optional predicate also receives the zero-based source index.

**References.** [API](https://rxjs.dev/api/operators/count) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/count.ts)

**Compare.** [scan](#scan) · [reduce](#reduce)

---

<a id="max"></a>
### max

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
max(compare?: (A, A) => number): A* => A*
```

**Behavior.** Remembers the greatest source value and emits it on normal completion.

**Execution details.**

- An empty completed source emits no value. No running maximum is emitted before completion.
- Without a comparer it uses JavaScript >. A comparer returns a positive number when its first argument should rank higher; ties select the later value in RxJS 7.8.2.

**Example.**

```ts
of(3, 1, 5, 2).pipe(max()) // next: 5; complete
```

**References.** [API](https://rxjs.dev/api/operators/max) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/max.ts)

**Compare.** [min](#min) · [reduce](#reduce) · [scan](#scan)

---

<a id="min"></a>
### min

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
min(compare?: (A, A) => number): A* => A*
```

**Behavior.** Remembers the least source value and emits it on normal completion.

**Execution details.**

- An empty completed source emits no value. No running minimum is emitted before completion.
- Without a comparer it uses JavaScript <. A comparer returns a negative number when its first argument should rank lower; ties select the later value in RxJS 7.8.2.

**Example.**

```ts
of(3, 1, 5, 2).pipe(min()) // next: 1; complete
```

**References.** [API](https://rxjs.dev/api/operators/min) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/min.ts)

**Compare.** [max](#max) · [reduce](#reduce) · [scan](#scan)

---

<a id="reduce"></a>
### reduce

Current API · Requested list · Import: `rxjs` · API role: pipeable

```text
reduce(reducer: (S, A) => S, seed: S): A* => S*
```

**Behavior.** Updates accumulated state for each source value, then emits only the final state on normal completion.

**Execution details.**

- With the seed shown here, an empty completed source emits the seed once. scan with the same seed emits nothing for that empty source.
- The seed is an initial value, not a deep clone; use an immutable reducer. Error or unsubscription prevents the final state from being emitted.

**Example.**

```ts
of(1, 2, 3).pipe(reduce((sum, n) => sum + n, 0)) // next: 6; complete
```

**Scope and overloads.** Without a seed, the first input initializes state without calling the reducer. In RxJS 7.8.2 an empty source with that overload completes without a value. The reducer also receives an index.

**References.** [API](https://rxjs.dev/api/operators/reduce) · [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/reduce.ts)

**Compare.** [scan](#scan) · [toArray](#toArray) · [count](#count)

---

[^gpt6]: These definitions and teaching notes were created with the help of GPT-6 Astra, under the course direction of Hans Schenker.
