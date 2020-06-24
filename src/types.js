// @flow

/**
 * @property holdTimeout The maximum amount of time lock can be held (default: 30000).
 * @property key Used to scope mutex (default: a random generated value).
 * @property waitTimeout The maximum amount of time lock can be waited for (default: 5000).
 */
export type MutexConfigurationInputType = {|
  +holdTimeout?: number,
  +key?: string,
  +waitTimeout?: number,
|};

export type LockConfigurationInputType = {|
  +holdTimeout?: number,
  +key?: string,
  +waitTimeout?: number,
|};

export type MutexType = {|
  +isLocked: (key?: string) => boolean,
  +lock: (
    routine: () => Promise<void>,
    lockConfigurationInput?: LockConfigurationInputType,
  ) => Promise<void>,
|};
