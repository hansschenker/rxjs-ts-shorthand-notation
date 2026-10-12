/**
 * RxJS Deep Dive — ordinary TypeScript companion for the teaching shorthand.
 *
 * These are selected common signatures, not exhaustive RxJS overload definitions.
 * The values assigned below are the actual RxJS operators; no operators are
 * reimplemented here. Cardinality suffixes such as A* are documentation notation.
 *
 * Check: npm run typecheck
 * Compile and run: npm run examples
 *
 * These definitions and teaching notes were created with the help of GPT-6 Astra,
 * under the course direction of Hans Schenker. Attribution: GPT6Astra.
 */

import {
  EMPTY,
  combineLatest as rxCombineLatest,
  debounceTime as rxDebounceTime,
  filter as rxFilter,
  from,
  map as rxMap,
  materialize,
  of,
  scan as rxScan,
  switchMap as rxSwitchMap,
} from 'rxjs';
import type {
  Observable,
  ObservableInput,
  ObservableNotification,
  SchedulerLike,
} from 'rxjs';

// A* translates to Stream<A>. A* => B* translates to StreamOperator<A, B>.
export type Stream<A> = Observable<A>;
export type StreamOperator<A, B> = (source: Stream<A>) => Stream<B>;
export type Input<A> = ObservableInput<A>;
export type Notice<A> = ObservableNotification<A>;

// map(project: A => B): A* => B*
export type MapSignature = <A, B>(
  project: (value: A, index: number) => B,
) => StreamOperator<A, B>;

// filter(predicate: A => boolean): A* => A*
// The type-guard overload also expresses narrowing from A to B extends A.
export type FilterSignature = {
  <A, B extends A>(
    predicate: (value: A, index: number) => value is B,
  ): StreamOperator<A, B>;
  <A>(
    predicate: (value: A, index: number) => boolean,
  ): StreamOperator<A, A>;
};

// scan(reducer: (S, A) => S, seed: S): A* => S*
export type ScanSignature = <A, S>(
  reducer: (state: S, value: A, index: number) => S,
  seed: S,
) => StreamOperator<A, S>;

// debounceTime(dueTime: number, scheduler?: SchedulerLike): A* => A*
export type DebounceTimeSignature = <A>(
  dueTime: number,
  scheduler?: SchedulerLike,
) => StreamOperator<A, A>;

// combineLatest(sources: [A*, B*]): [A, B]*
export type CombineLatestSignature = <A, B>(
  sources: readonly [Stream<A>, Stream<B>],
) => Stream<[A, B]>;

// switchMap(project: A => B*): A* => B*
// The selected form returns Observable<B>; RxJS also accepts other inputs.
export type SwitchMapSignature = <A, B>(
  project: (value: A, index: number) => Stream<B>,
) => StreamOperator<A, B>;

// Direct assignments check that the selected generic forms fit RxJS 7.8.2.
export const map: MapSignature = rxMap;
export const filter: FilterSignature = rxFilter;
export const scan: ScanSignature = rxScan;
export const debounceTime: DebounceTimeSignature = rxDebounceTime;
export const combineLatest: CombineLatestSignature = rxCombineLatest;
export const switchMap: SwitchMapSignature = rxSwitchMap;

// Pure domain functions carry business rules. Operators carry generic policies.
export type CartLine = {
  readonly sku: string;
  readonly unitPriceCents: number;
  readonly quantity: number;
};

export type CartTotal = {
  readonly amountCents: number;
  readonly lineCount: number;
};

export const lineAmount = (line: CartLine): number =>
  line.unitPriceCents * line.quantity;

export const hasSeveralUnits = (line: CartLine): boolean => line.quantity > 1;

export const isCartLine = (line: CartLine | null): line is CartLine =>
  line !== null;

export const addLine = (state: CartTotal, line: CartLine): CartTotal => ({
  amountCents: state.amountCents + lineAmount(line),
  lineCount: state.lineCount + 1,
});

export const describeSku = (sku: string): string => `Item ${sku}`;

// A cold, synchronous stream description: subscription emits one label and ends.
export const lookupLabel = (line: CartLine): Stream<string> =>
  of(describeSku(line.sku));

export const cartLines: readonly CartLine[] = [
  { sku: 'A', unitPriceCents: 500, quantity: 2 },
  { sku: 'B', unitPriceCents: 750, quantity: 1 },
  { sku: 'C', unitPriceCents: 200, quantity: 3 },
];

export const emptyCart: CartTotal = { amountCents: 0, lineCount: 0 };

// A[] is an input convertible by from, while of preserves an array as one value.
export const lineInput: Input<CartLine> = cartLines;
export const lines$: Stream<CartLine> = from(lineInput);
export const batches$: Stream<readonly CartLine[]> = of(cartLines);

export const lineAmounts$: Stream<number> = lines$.pipe(map(lineAmount));
export const bulkLines$: Stream<CartLine> = lines$.pipe(filter(hasSeveralUnits));
export const runningTotals$: Stream<CartTotal> = lines$.pipe(scan(addLine, emptyCart));

// null and undefined are payload values; neither means an empty subscription.
export const nullableLines$: Stream<CartLine | null> = of(
  cartLines[0],
  null,
  cartLines[1],
);
export const presentLines$: Stream<CartLine> = nullableLines$.pipe(filter(isCartLine));
export const nullValue$: Stream<null> = of(null);
export const undefinedValue$: Stream<undefined> = of(undefined);
export const noValues$: Stream<never> = EMPTY;

// map returns inner descriptions as values: (string*)*.
export const labelStreams$: Stream<Stream<string>> = lines$.pipe(map(lookupLabel));

// switchMap subscribes to them: string*.
// Every lookup here is synchronous, so it completes before the next input arrives.
// All three labels are emitted; there is no still-active inner to cancel.
export const latestLabels$: Stream<string> = lines$.pipe(switchMap(lookupLabel));

export type Currency = 'CHF' | 'EUR';
export const currencies$: Stream<Currency> = of('CHF' as const);
export const prices$: Stream<number> = of(1250, 1490);

// [Currency*, number*]: a tuple containing two sources, not a stream itself.
export const priceSources: readonly [Stream<Currency>, Stream<number>] = [
  currencies$,
  prices$,
];

// [Currency, number]*: a stream whose next values are two-element tuples.
export const priceQuotes$: Stream<[Currency, number]> = combineLatest(priceSources);

// Source completion flushes the pending value immediately; this example does not
// remain open for 100 milliseconds merely because dueTime is 100.
export const searchTerms$: Stream<string> = of('r', 'rx', 'rxjs');
export const settledTerms$: Stream<string> = searchTerms$.pipe(debounceTime(100));

// Notice<A> represents next/error/complete as payloads when materialized.
// The resulting stream still has its own ordinary completion notification.
export const lineNotices$: Stream<Notice<CartLine>> = lines$.pipe(materialize());

// This observer is an explicit effect boundary for the executable demonstration.
// The domain functions above do not log, mutate seeds, or subscribe to streams.
function printSubscription<A>(label: string, source: Stream<A>): void {
  const values: A[] = [];
  source.subscribe({
    next: (value) => values.push(value),
    error: (error: unknown) => console.log(label, { values, error }),
    complete: () => console.log(label, { values, complete: true }),
  });
}

export function runExamples(): void {
  printSubscription('map: amounts in cents', lineAmounts$);
  printSubscription('filter: several units', bulkLines$);
  printSubscription('filter: type guard removes null', presentLines$);
  printSubscription('scan: updated states, without initial seed', runningTotals$);
  printSubscription('debounceTime: completion flush', settledTerms$);
  printSubscription('combineLatest: tuple payloads', priceQuotes$);
  printSubscription('switchMap: synchronous inner labels', latestLabels$);
  printSubscription('of: one array payload', batches$);
  printSubscription(
    'map: inner descriptions, without subscribing to them',
    labelStreams$.pipe(map(() => 'Stream<string>')),
  );
  printSubscription('of(null): one next', nullValue$);
  printSubscription('of(undefined): one next', undefinedValue$);
  printSubscription('EMPTY: zero next', noValues$);
  printSubscription('materialize: notification kinds', lineNotices$.pipe(map(n => n.kind)));
}

runExamples();
