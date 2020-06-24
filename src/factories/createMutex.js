// @flow

import {
  HoldTimeoutError,
  WaitTimeoutError,
} from '../errors';
import type {
  MutexConfigurationInputType,
  MutexType,
} from '../types';

type StoreType = {|

  // eslint-disable-next-line flowtype/no-weak-types
  locking: Promise<any>,
  lockCount: number,
|};

export default (mutexConfigurationInput?: MutexConfigurationInputType): MutexType => {
  const defaultKey = 'mutex-' + String(Math.random());

  const mutexConfiguration = {
    holdTimeout: 30000,
    key: defaultKey,
    waitTimeout: 5000,
    ...mutexConfigurationInput,
  };

  const stores = {};

  return {
    isLocked: (key: string = defaultKey): boolean => {
      return Boolean(stores[key]);
    },
    lock: async (
      routine,
      lockConfigurationInput = mutexConfiguration,
    ) => {
      const lockConfiguration = {
        ...mutexConfiguration,
        ...lockConfigurationInput,
      };

      if (!stores[lockConfiguration.key]) {
        stores[lockConfiguration.key] = {
          lockCount: 0,
          locking: Promise.resolve(),
        };
      }

      const store: StoreType = stores[lockConfiguration.key];

      store.lockCount++;

      let unlockNext;

      // Creates a promise that is resolved by calling `unlockNext`.
      // `unlockNext` is result of `willUnlock`.
      // On first call, `willUnlock` is resolved immediately.
      // However, afterwards `willLock` is added to `locking`, i.e.
      // `willLock` locks `locking` until the associated `unlockNext` is called.
      const willLock = new Promise((resolve) => {
        unlockNext = () => {
          store.lockCount--;

          if (store.lockCount === 0) {
            // eslint-disable-next-line fp/no-delete
            delete stores[lockConfiguration.key];
          }

          resolve();
        };
      });

      const willUnlock = store.locking
        .then(() => {
          return Promise.race([
            routine(),
            new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(new HoldTimeoutError('Hold timeout.'));
              }, lockConfiguration.holdTimeout);
            }),
          ]);
        })
        .then(() => {
          return unlockNext();
        });

      store.locking = store.locking
        .then(() => {
          return willLock;
        });

      const waitTimeout = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new WaitTimeoutError('Wait timeout.'));
        }, lockConfiguration.waitTimeout);
      });

      // Suppress unhandled rejection error.
      willLock.catch(() => {});
      store.locking.catch(() => {});

      await Promise.race([
        willUnlock,
        waitTimeout,
      ]);
    },
  };
};
