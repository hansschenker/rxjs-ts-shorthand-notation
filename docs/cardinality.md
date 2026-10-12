# Optional occurrence refinements

**RxJS Deep Dive · RxJS 7.8.2**

Use this page after learners are comfortable reading `A*`. It extends the same shorthand with explicit emission-count information.[^gpt6]

| Notation | Delivered next values |
| --- | --- |
| `A?` | Zero or one |
| `A!` | Exactly one |
| `A+` | One or more |
| `A*` | Zero or more, with no upper bound expressed |

## Choose the scope before the suffix

Count values delivered to **one subscription at the position being described**. Do not count complete or error notifications as values. Do not infer a value from `null`, `undefined`, or a seed that has not been emitted.

An upper bound can remain true after cancellation: `take(1)` emits at most one value, even when it is cancelled or its source errors first. A lower bound such as “exactly one” needs a stronger condition. A result that is cancelled before its first value does not satisfy that lower bound.

The first table gives unconditional upper bounds on delivered values for the selected forms, assuming ordinary conforming RxJS sources. It makes **no promise that the subscription will complete**.

| Selected result | Safe count description | What this does not promise |
| --- | --- | --- |
| `take(1)` | `A?` | A first value might never arrive. |
| `first()` / `last()` / `single()` | `A?` | The result may error, remain open, or be cancelled. |
| `elementAt(index)` for a nonnegative integer | `A?` | The position might not be reached. |
| `find(predicate)` | `(A \| undefined)?` | A silent open source can postpone the answer forever. |
| `findIndex(predicate)` / `count()` | `number?` | Error or cancellation can prevent an answer. |
| `every(predicate)` / `isEmpty()` | `boolean?` | Not every input permits a decision yet. |
| Seeded `reduce(reducer, seed)` | `S?` | The final state is emitted only on normal completion. |
| `toArray()` | `(A[])?` | No array is emitted before normal completion. |
| `min()` / `max()` | `A?` | A normally completed empty source still has no result value. |
| One-shot `timer(due)` | `number?` | Cancellation can occur before the scheduled zero is delivered. |
| Two-source `forkJoin([a$, b$])` | `[A, B]?` | An empty or nonterminating input can prevent a tuple. |

The second table is conditional: **observe the selected result subscription through its own normal completion, without external cancellation**. Do not apply these lower bounds to errors or nontermination.

| Selected result that completes normally | Refined occurrence | Why |
| --- | --- | --- |
| `first()` / `last()` / `single()` | `A!` | Their no-match or invalid-count paths error instead of completing normally. |
| `find(predicate)` | `(A \| undefined)!` | Either a match or the explicit no-match value is delivered. |
| `findIndex(predicate)` | `number!` | A matching index or -1 is delivered. |
| `every(predicate)` / `isEmpty()` | `boolean!` | A decided boolean is delivered. |
| `count()` | `number!` | Empty input still gives 0. |
| Seeded `reduce(reducer, seed)` | `S!` | Empty input still gives the seed. |
| `toArray()` | `(A[])!` | Empty input still gives one empty array. |
| `defaultIfEmpty(fallback)` | `(A \| B)+` | At least one source value or the fallback has been delivered. |
| `take(1)` / `min()` / `max()` | `A?` | Normal completion can still be empty. |
| Unseeded `reduce(reducer)` | `(A \| S)?` | In 7.8.2, empty input completes without a value. |

For a finite, normally completing input and nonthrowing functions, with the result allowed to complete, the familiar transformation refinements also apply:

```text
map(project: A => B): A! => B!
map(project: A => B): A+ => B+
filter(predicate: A => boolean): A! => A?
filter(predicate: A => boolean): A+ => A*
scan(reducer: (S, A) => S, seed: S): A! => S!
scan(reducer: (S, A) => S, seed: S): A+ => S+
```

These are teaching contracts under the stated assumptions. Ordinary `Observable<T>` does not encode or enforce them. Branded aliases would only record an assertion unless a construction or verification discipline supplied the guarantee.

## Two questions that prevent common mistakes

**Does `single()` guarantee a useful value will arrive?** No. It checks uniqueness and emits on successful source completion. An infinite source with one matching value has not finished proving uniqueness.

**Does `T?` mean that `undefined` can be emitted?** No. It bounds the number of next values. `(T | undefined)!` can describe exactly one emitted value whose payload is either a `T` or `undefined`.

The full cards link their implementation evidence: [take](operator-reference.md#take), [first](operator-reference.md#first), [last](operator-reference.md#last), [single](operator-reference.md#single), [find](operator-reference.md#find), [findIndex](operator-reference.md#findIndex), [count](operator-reference.md#count), [every](operator-reference.md#every), [isEmpty](operator-reference.md#isEmpty), [reduce](operator-reference.md#reduce), [toArray](operator-reference.md#toArray), [min](operator-reference.md#min), [max](operator-reference.md#max), [defaultIfEmpty](operator-reference.md#defaultIfEmpty), [forkJoin](operator-reference.md#forkJoin), [timer](operator-reference.md#timer), [map](operator-reference.md#map), [filter](operator-reference.md#filter), and [scan](operator-reference.md#scan).

[^gpt6]: These definitions and teaching notes were created with the help of GPT-6 Astra, under the course direction of Hans Schenker.
