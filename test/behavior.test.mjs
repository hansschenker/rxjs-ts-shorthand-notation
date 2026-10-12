// Selected teaching contracts for RxJS 7.8.2.
// These tests verify consequential examples and edge cases, not every overload
// or every catalog card. Timed examples use virtual time and make no requests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY,
  NEVER,
  Subject,
  audit,
  auditTime,
  bindCallback,
  bufferCount,
  bufferWhen,
  catchError,
  combineLatest,
  combineLatestAll,
  concat,
  concatMap,
  debounce,
  debounceTime,
  defer,
  delay,
  delayWhen,
  dematerialize,
  exhaustMap,
  filter,
  finalize,
  first,
  forkJoin,
  from,
  map,
  materialize,
  max,
  mergeMap,
  min,
  of,
  partition,
  race,
  reduce,
  repeat,
  repeatWhen,
  retry,
  retryWhen,
  sample,
  sampleTime,
  scan,
  share,
  shareReplay,
  single,
  skipUntil,
  switchMap,
  take,
  takeUntil,
  throttle,
  throttleTime,
  throwError,
  timeout,
  timer,
  toArray,
  windowCount,
  windowWhen,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

/** Observe synchronous behavior, then always dispose any still-open execution. */
function captureSync(source) {
  const result = { values: [], completed: false, error: undefined, closed: false };
  const subscription = source.subscribe({
    next: value => result.values.push(value),
    error: error => { result.error = error; },
    complete: () => { result.completed = true; },
  });
  result.closed = subscription.closed;
  subscription.unsubscribe();
  return result;
}

function expectSync(source, values, terminal = 'complete') {
  const actual = captureSync(source);
  assert.deepEqual(actual.values, values);
  if (terminal === 'complete') {
    assert.equal(actual.completed, true, 'expected normal completion');
    assert.equal(actual.error, undefined);
    assert.equal(actual.closed, true);
  } else if (terminal === 'open') {
    assert.equal(actual.completed, false);
    assert.equal(actual.error, undefined);
    assert.equal(actual.closed, false, 'expected an open subscription before cleanup');
  } else {
    assert.equal(actual.completed, false);
    assert.equal(actual.error?.name, terminal, 'expected the specified error channel');
    assert.equal(actual.closed, true);
  }
  return actual;
}

function virtual(body) {
  const scheduler = new TestScheduler((actual, expected) => {
    assert.deepEqual(actual, expected);
  });
  scheduler.run(helpers => body({ ...helpers, scheduler }));
}

test('of emits null and whole arrays; from emits array elements', () => {
  expectSync(of(null), [null]);
  expectSync(of([1, 2]), [[1, 2]]);
  expectSync(from([1, 2]), [1, 2]);
  expectSync(EMPTY, []);
});

test('map transforms each value and does not flatten a returned stream', () => {
  expectSync(of(1, 2, 3).pipe(map(n => n * 10)), [10, 20, 30]);
  const inner = of('inside');
  expectSync(of('outside').pipe(map(() => inner)), [inner]);
});

test('filter preserves matching payloads and may remove every value', () => {
  expectSync(of(1, 2, 3, 4).pipe(filter(n => n % 2 === 0)), [2, 4]);
  expectSync(of(1, 3).pipe(filter(n => n % 2 === 0)), []);
});

test('seeded scan emits updated states without first emitting its seed', () => {
  expectSync(of(1, 2, 3).pipe(scan((sum, n) => sum + n, 10)), [11, 13, 16]);
});

test('empty scan emits nothing; seeded reduce emits its seed; unseeded reduce stays empty', () => {
  expectSync(EMPTY.pipe(scan((sum, n) => sum + n, 10)), []);
  expectSync(EMPTY.pipe(reduce((sum, n) => sum + n, 10)), [10]);
  expectSync(EMPTY.pipe(reduce((sum, n) => sum + n)), []);
});

test('take(1) permits empty completion and does not force a silent source to emit', () => {
  expectSync(EMPTY.pipe(take(1)), []);
  expectSync(of(1, 2).pipe(take(1)), [1]);
  expectSync(NEVER.pipe(take(1)), [], 'open');
});

test('first errors on no match unless an explicit default is supplied', () => {
  expectSync(EMPTY.pipe(first()), [], 'EmptyError');
  expectSync(of(1, 3).pipe(first(n => n % 2 === 0)), [], 'EmptyError');
  expectSync(EMPTY.pipe(first(undefined, 'fallback')), ['fallback']);
  expectSync(EMPTY.pipe(first(undefined, undefined)), [undefined]);
});

test('single distinguishes empty input, no matching value, and too many matches', () => {
  expectSync(EMPTY.pipe(single()), [], 'EmptyError');
  expectSync(of(1, 3).pipe(single(n => n % 2 === 0)), [], 'NotFoundError');
  expectSync(of(2, 4).pipe(single(n => n % 2 === 0)), [], 'SequenceError');
  expectSync(of(1, 2, 3).pipe(single(n => n % 2 === 0)), [2]);
});

test('single withholds a sole match until normal source completion', () => {
  virtual(({ cold, expectObservable }) => {
    expectObservable(cold('a---|').pipe(single())).toBe('----(a|)');
  });
});

test('debounceTime restarts the quiet period and flushes a pending value on completion', () => {
  virtual(({ cold, expectObservable, scheduler }) => {
    const source = cold('a-b----c-|');
    expectObservable(source.pipe(debounceTime(3, scheduler))).toBe('-----b---(c|)');
  });
});

test('debounceTime forwards an error without flushing pending values', () => {
  virtual(({ cold, expectObservable, scheduler }) => {
    const failure = new Error('failed');
    const source = cold('a-b-#', undefined, failure);
    expectObservable(source.pipe(debounceTime(5, scheduler))).toBe('----#', undefined, failure);
  });
});

test('debounce ignores an empty duration completion but source completion flushes the latest value', () => {
  expectSync(of(1, 2).pipe(debounce(() => EMPTY)), [2]);
});

test('auditTime waits for its active interval after source completion and emits the latest value', () => {
  virtual(({ cold, expectObservable, scheduler }) => {
    expectObservable(cold('a-b|').pipe(auditTime(5, scheduler))).toBe('-----(b|)');
  });
});

test('audit duration completion without next drops the held value, including with EMPTY', () => {
  expectSync(of(1, 2).pipe(audit(() => EMPTY)), []);
  virtual(({ cold, expectObservable }) => {
    expectObservable(cold('a-b|').pipe(audit(() => cold('-----|')))).toBe('-----|');
  });
});

test('sample ignores notifier completion and sampleTime does not flush at source completion', () => {
  virtual(({ cold, expectObservable, scheduler }) => {
    expectObservable(cold('a-b---|').pipe(sample(cold('---|')))).toBe('------|');
    expectObservable(cold('a|').pipe(sampleTime(5, scheduler))).toBe('-|');
  });
});

test('sample emits only when a new source value arrived since the previous sampling tick', () => {
  virtual(({ cold, expectObservable }) => {
    const source = cold('a---b------|');
    const ticks = cold('--x--x--x--|');
    expectObservable(source.pipe(sample(ticks))).toBe('--a--b-----|');
  });
});

test('throttleTime defaults to leading delivery with no completion-time trailing flush', () => {
  virtual(({ cold, expectObservable, scheduler }) => {
    expectObservable(cold('a-b|').pipe(throttleTime(5, scheduler))).toBe('a--|');
  });
});

test('trailing throttleTime waits for its duration next after the source completes', () => {
  virtual(({ cold, expectObservable, scheduler }) => {
    const result = cold('a-b|').pipe(throttleTime(5, scheduler, { leading: false, trailing: true }));
    expectObservable(result).toBe('-----(b|)');
  });
});

test('trailing throttle does not emit on duration completion without next', () => {
  const config = { leading: false, trailing: true };
  expectSync(of(1, 2).pipe(throttle(() => EMPTY, config)), []);
  virtual(({ cold, expectObservable }) => {
    expectObservable(cold('a-b|').pipe(throttle(() => cold('-----|'), config))).toBe('-----|');
  });
});

test('combineLatest waits for all first values and then uses the latest tuple', () => {
  expectSync(combineLatest([of(1, 2), of('a', 'b')]), [[2, 'a'], [2, 'b']]);
});

test('RxJS 7.8.2 combineLatest of EMPTY and NEVER stays open; zero inputs complete empty', () => {
  expectSync(combineLatest([EMPTY, NEVER]), [], 'open');
  expectSync(combineLatest([]), []);
});

test('forkJoin emits final values once, but an empty input completes the result without a tuple', () => {
  expectSync(forkJoin([of(1, 2), of('a', 'b')]), [[2, 'b']]);
  expectSync(forkJoin([EMPTY, NEVER]), []);
  expectSync(forkJoin([]), []);
});

test('race can be settled by an early terminal notification and race([]) stays open', () => {
  expectSync(race([EMPTY, of(1)]), []);
  expectSync(race([of('first'), of('second')]), ['first']);
  expectSync(race([throwError(() => new Error('failed')), of(1)]), [], 'Error');
  expectSync(race([]), [], 'open');
});

test('combineLatestAll subscribes to collected inner streams only after the outer completes', () => {
  virtual(({ cold, expectObservable, expectSubscriptions }) => {
    const firstInner = cold('-a--b|', { a: 1, b: 2 });
    const secondInner = cold('--x|', { x: 'x' });
    const outer = cold('a-b---|', { a: firstInner, b: secondInner });
    expectObservable(outer.pipe(combineLatestAll())).toBe('--------u-v|', {
      u: [1, 'x'], v: [2, 'x'],
    });
    expectSubscriptions(firstInner.subscriptions).toBe('------^----!');
    expectSubscriptions(secondInner.subscriptions).toBe('------^--!');
  });
});

test('bufferWhen ignores closing completion whereas windowWhen closes and replaces its window', () => {
  expectSync(of(1, 2).pipe(bufferWhen(() => EMPTY)), [[1, 2]]);
  let closings = 0;
  const windows = of(1, 2).pipe(
    windowWhen(() => closings++ === 0 ? EMPTY : NEVER),
    mergeMap(window => window.pipe(toArray())),
  );
  expectSync(windows, [[], [1, 2]]);
  assert.equal(closings, 2, 'only the first closer completes; the second remains open until source completion');
});

test('windowCount opens a trailing empty window that bufferCount does not create', () => {
  expectSync(of(1, 2, 3, 4).pipe(bufferCount(2)), [[1, 2], [3, 4]]);
  expectSync(of(1, 2, 3, 4).pipe(windowCount(2), mergeMap(window => window.pipe(toArray()))), [
    [1, 2], [3, 4], [],
  ]);
  expectSync(EMPTY.pipe(windowCount(2), mergeMap(window => window.pipe(toArray()))), [[]]);
});

test('switchMap cancels the replaced inner and waits for the active inner after outer completion', () => {
  virtual(({ cold, expectObservable, expectSubscriptions }) => {
    const firstInner = cold('--x---y|');
    const secondInner = cold('--z--|');
    const outer = cold('a---b--|');
    const result = outer.pipe(switchMap(value => value === 'a' ? firstInner : secondInner));
    expectObservable(result).toBe('--x---z--|');
    expectSubscriptions(firstInner.subscriptions).toBe('^---!');
    expectSubscriptions(secondInner.subscriptions).toBe('----^----!');
  });
});

test('concatMap delays projection of queued input until the current inner completes', () => {
  virtual(({ cold, expectObservable, scheduler, flush }) => {
    const projected = [];
    const result = cold('a-b|').pipe(concatMap(value => {
      projected.push([scheduler.frame, value]);
      return cold('----(x|)', { x: value.toUpperCase() });
    }));
    expectObservable(result).toBe('----x---(y|)', { x: 'A', y: 'B' });
    flush();
    assert.deepEqual(projected, [[0, 'a'], [4, 'b']]);
  });
});

test('exhaustMap neither projects nor queues input received while an inner is active', () => {
  virtual(({ cold, expectObservable, scheduler, flush }) => {
    const projected = [];
    const result = cold('a-b---c|').pipe(exhaustMap(value => {
      projected.push([scheduler.frame, value]);
      return cold('----(x|)', { x: value.toUpperCase() });
    }));
    expectObservable(result).toBe('----x-----(y|)', { x: 'A', y: 'C' });
    flush();
    assert.deepEqual(projected, [[0, 'a'], [6, 'c']]);
  });
});

test('share resets after successful completion so sequential subscribers can start separate executions', () => {
  let executions = 0;
  const shared = defer(() => of(++executions)).pipe(share());
  expectSync(shared, [1]);
  expectSync(shared, [2]);
  assert.equal(executions, 2);
});

test('share uses one active connection and disconnects it after the last listener leaves', () => {
  const input = new Subject();
  let starts = 0;
  let stops = 0;
  const shared = defer(() => {
    starts++;
    return input.pipe(finalize(() => stops++));
  }).pipe(share());
  const subscriptions = [];
  const listen = values => {
    const subscription = shared.subscribe(value => values.push(value));
    subscriptions.push(subscription);
    return subscription;
  };
  try {
    const left = [];
    const right = [];
    const a = listen(left);
    const b = listen(right);
    assert.equal(starts, 1);
    input.next(1);
    a.unsubscribe();
    assert.equal(stops, 0);
    input.next(2);
    assert.deepEqual(left, [1]);
    assert.deepEqual(right, [1, 2]);
    b.unsubscribe();
    assert.equal(stops, 1);
    listen([]).unsubscribe();
    assert.equal(starts, 2, 'a later listener starts a fresh active connection');
    assert.equal(stops, 2);
  } finally {
    for (const subscription of subscriptions) subscription.unsubscribe();
    input.complete();
  }
});

test('shareReplay with refCount true retains its successfully completed cache', () => {
  let executions = 0;
  const shared = defer(() => {
    executions++;
    return of(1, 2, 3);
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  expectSync(shared, [1, 2, 3]);
  expectSync(shared, [3]);
  assert.equal(executions, 1);
});

test('retry counts additional attempts and an empty retry delay completes the result', () => {
  let attempts = 0;
  const failing = defer(() => concat(of(++attempts), throwError(() => new Error('failed'))));
  expectSync(failing.pipe(retry(2)), [1, 2, 3], 'Error');
  assert.equal(attempts, 3);
  attempts = 0;
  expectSync(failing.pipe(retry({ count: 2, delay: () => EMPTY })), [1]);
  assert.equal(attempts, 1);
});

test('repeat counts total runs, permits zero runs, and stops when its delay completes empty', () => {
  let runs = 0;
  const successful = defer(() => of(++runs));
  expectSync(successful.pipe(repeat(3)), [1, 2, 3]);
  assert.equal(runs, 3);
  expectSync(successful.pipe(repeat(0)), []);
  assert.equal(runs, 3, 'repeat(0) does not start another execution');
  expectSync(of('value').pipe(repeat({ count: 3, delay: () => EMPTY })), ['value']);
});

test('RxJS 7.8.2 repeatWhen notifier completion can cut off a pending synchronous repeat', () => {
  expectSync(of(1).pipe(repeatWhen(completions => completions.pipe(take(1)))), [1]);
  virtual(({ expectObservable }) => {
    const result = timer(10).pipe(repeatWhen(completions => completions.pipe(take(1))));
    expectObservable(result).toBe('10ms a 9ms (a|)', { a: 0 });
  });
});

test('retryWhen notifier completion cancels active work; repeatWhen waits for an already active repeat', () => {
  virtual(({ cold, expectObservable }) => {
    let retryRuns = 0;
    const retrySource = defer(() => ++retryRuns === 1 ? cold('-#') : cold('--b|'));
    expectObservable(retrySource.pipe(retryWhen(errors => errors.pipe(delay(1), take(1))))).toBe('--|');

    let repeatRuns = 0;
    const repeatSource = defer(() => ++repeatRuns === 1 ? cold('-a|') : cold('--b|'));
    expectObservable(repeatSource.pipe(repeatWhen(completions => completions.pipe(delay(1), take(1))))).toBe('-a---b|');
  });
});

test('delayWhen drops a source value when its selected duration completes without next', () => {
  expectSync(of(1, 2).pipe(delayWhen(() => EMPTY)), []);
});

test('delayWhen can release a later source value before an earlier one', () => {
  virtual(({ expectObservable }) => {
    const result = of(1, 2).pipe(delayWhen(n => timer(n === 1 ? 20 : 10)));
    expectObservable(result).toBe('10ms b 9ms (a|)', { a: 1, b: 2 });
  });
});

test('takeUntil reacts to notifier next, ignores notifier completion, and can prevent source startup', () => {
  expectSync(of(1, 2).pipe(takeUntil(EMPTY)), [1, 2]);
  let starts = 0;
  const source = defer(() => {
    starts++;
    return of(1, 2);
  });
  expectSync(source.pipe(takeUntil(of('stop'))), []);
  assert.equal(starts, 0);
});

test('skipUntil opens on notifier next but not on notifier completion', () => {
  expectSync(of(1, 2).pipe(skipUntil(EMPTY)), []);
  expectSync(of(1, 2).pipe(skipUntil(of('go'))), [1, 2]);
});

test('materialize turns error into a notice and completion; dematerialize respects structural terminal notices', () => {
  const failure = new Error('failed');
  const source = concat(of(1), throwError(() => failure));
  const notices = source.pipe(materialize(), map(notice => (
    notice.kind === 'N' ? ['N', notice.value] : ['E', notice.error.message]
  )));
  expectSync(notices, [['N', 1], ['E', 'failed']]);
  expectSync(source.pipe(materialize(), dematerialize()), [1], 'Error');
  expectSync(of(
    { kind: 'N', value: 1 },
    { kind: 'C' },
    { kind: 'N', value: 2 },
  ).pipe(dematerialize()), [1]);
});

test('min and max complete empty and choose the later record when a comparer reports a tie', () => {
  expectSync(EMPTY.pipe(min()), []);
  expectSync(EMPTY.pipe(max()), []);
  const earlier = { rank: 1, id: 'earlier' };
  const later = { rank: 1, id: 'later' };
  const compare = (a, b) => a.rank - b.rank;
  expectSync(of(earlier, later).pipe(min(compare)), [later]);
  expectSync(of(earlier, later).pipe(max(compare)), [later]);
});

test('bindCallback is lazy and caches one invocation for subscribers to the same returned Observable', () => {
  let calls = 0;
  const bound = bindCallback((n, done) => {
    calls++;
    done(n * 2);
  });
  const result = bound(3);
  assert.equal(calls, 0);
  expectSync(result, [6]);
  expectSync(result, [6]);
  assert.equal(calls, 1);
  expectSync(bound(4), [8]);
  assert.equal(calls, 2);
});

test('partition returns independently subscribed branches rather than automatically sharing a cold source', () => {
  let executions = 0;
  const source = defer(() => {
    executions++;
    return of(1, 2, 3);
  });
  const [even, odd] = partition(source, n => n % 2 === 0);
  expectSync(even, [2]);
  expectSync(odd, [1, 3]);
  assert.equal(executions, 2);
});

test('a positive numeric timeout guards following gaps while a Date guards only the first value', () => {
  virtual(({ cold, expectObservable, scheduler }) => {
    const values = { a: 'value', e: 'TimeoutError' };
    const numeric = cold('a----------', values).pipe(
      timeout(3, scheduler),
      catchError(error => of(error.name)),
    );
    expectObservable(numeric).toBe('a--(e|)', values);
    const dated = cold('a----------', values).pipe(timeout(new Date(3), scheduler));
    expectObservable(dated, '^------!').toBe('a', values);
  });
});
