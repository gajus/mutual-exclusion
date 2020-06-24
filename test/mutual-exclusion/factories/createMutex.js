// @flow

import test from 'ava';
import delay from 'delay';
import createMutex from '../../../src/factories/createMutex';
import {
  HoldTimeoutError,
  WaitTimeoutError,
} from '../../../src/errors';

test('creates and releases a lock', async (t) => {
  const mutex = createMutex();

  await mutex.lock(async () => {
    t.true(mutex.isLocked());
  });

  await delay(50);

  t.false(mutex.isLocked());
});

test('blocks lock until an existing lock is released', async (t) => {
  const mutex = createMutex();

  mutex.lock(async () => {
    await delay(50);
  });

  t.true(mutex.isLocked());

  let secondLockPending = true;

  // eslint-disable-next-line promise/catch-or-return
  mutex.lock(async () => {})
    .then((value) => {
      secondLockPending = false;

      return value;
    });

  t.true(secondLockPending);

  await delay(100);

  t.false(secondLockPending);

  t.false(mutex.isLocked());
});

test('resolves locks in FIFO order', async (t) => {
  const mutex = createMutex();

  mutex.lock(async () => {
    await delay(50);
  });

  let secondLockPending = true;

  // eslint-disable-next-line promise/catch-or-return
  mutex.lock(async () => {
    await delay(50);
  })
    .then((value) => {
      secondLockPending = false;

      return value;
    });

  let thirdLockPending = true;

  // eslint-disable-next-line promise/catch-or-return
  mutex.lock(async () => {
    await delay(50);
  })
    .then((value) => {
      thirdLockPending = false;

      return value;
    });

  t.true(mutex.isLocked());
  t.true(secondLockPending);
  t.true(thirdLockPending);

  await delay(150);

  t.true(mutex.isLocked());
  t.false(secondLockPending);
  t.true(thirdLockPending);

  await delay(200);

  t.false(mutex.isLocked());
  t.false(secondLockPending);
  t.false(thirdLockPending);
});

test('rejects lock after the hold timeout is reached (mutex configuration)', async (t) => {
  const mutex = createMutex({
    holdTimeout: 50,
  });

  await t.throwsAsync(mutex.lock(async () => {
    await delay(100);
  }), {
    code: 'HOLD_TIMEOUT',
    instanceOf: HoldTimeoutError,
    message: 'Hold timeout.',
  });
});

test('rejects lock after the hold timeout is reached (lock configuration)', async (t) => {
  const mutex = createMutex({
    holdTimeout: 500,
  });

  await t.throwsAsync(mutex.lock(async () => {
    await delay(100);
  }, {
    holdTimeout: 50,
  }), {
    code: 'HOLD_TIMEOUT',
    instanceOf: HoldTimeoutError,
    message: 'Hold timeout.',
  });
});

test('rejects lock after the wait timeout is reached (mutex configuration)', async (t) => {
  const mutex = createMutex({
    waitTimeout: 50,
  });

  mutex.lock(async () => {
    await delay(100);
  }, {
    waitTimeout: 500,
  });

  await t.throwsAsync(mutex.lock(async () => {}), {
    code: 'WAIT_TIMEOUT',
    instanceOf: WaitTimeoutError,
    message: 'Wait timeout.',
  });
});

test('rejects lock after the wait timeout is reached (lock configuration)', async (t) => {
  const mutex = createMutex({
    waitTimeout: 500,
  });

  mutex.lock(async () => {
    await delay(100);
  });

  await t.throwsAsync(mutex.lock(async () => {}, {
    waitTimeout: 50,
  }), {
    code: 'WAIT_TIMEOUT',
    instanceOf: WaitTimeoutError,
    message: 'Wait timeout.',
  });
});
