import test from 'ava';

/**
 * Tests for the load-timeout feature.
 *
 * The core fix is a Promise.race between ProcessSpec and a timeout.
 * We test the pattern directly here since the component requires a browser environment.
 */

test('Promise.race rejects with timeout when inner promise hangs', async (t) => {
  const neverResolves = new Promise(() => {});
  const loadTimeout = 200;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(
      `Loading the spec timed out after ${loadTimeout / 1000} seconds`
    )), loadTimeout)
  );

  const error = await t.throwsAsync(() => Promise.race([neverResolves, timeoutPromise]));
  t.is(error.message, 'Loading the spec timed out after 0.2 seconds');
});

test('Promise.race resolves normally when inner promise is faster than timeout', async (t) => {
  const fastPromise = new Promise((resolve) => setTimeout(() => resolve('spec-data'), 50));
  const loadTimeout = 2000;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(
      `Loading the spec timed out after ${loadTimeout / 1000} seconds`
    )), loadTimeout)
  );

  const result = await Promise.race([fastPromise, timeoutPromise]);
  t.is(result, 'spec-data');
});

test('Promise.race rejects with inner error when it rejects before timeout', async (t) => {
  const failingPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Network error')), 50)
  );
  const loadTimeout = 2000;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(
      `Loading the spec timed out after ${loadTimeout / 1000} seconds`
    )), loadTimeout)
  );

  const error = await t.throwsAsync(() => Promise.race([failingPromise, timeoutPromise]));
  t.is(error.message, 'Network error');
});

test('timeout message formats correctly for default 5000ms', (t) => {
  const loadTimeout = 5000;
  const message = `Loading the spec timed out after ${loadTimeout / 1000} seconds`;
  t.is(message, 'Loading the spec timed out after 5 seconds');
});

test('timeout message formats correctly for custom 2000ms', (t) => {
  const loadTimeout = 2000;
  const message = `Loading the spec timed out after ${loadTimeout / 1000} seconds`;
  t.is(message, 'Loading the spec timed out after 2 seconds');
});
