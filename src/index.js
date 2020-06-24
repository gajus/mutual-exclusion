// @flow

export {createMutex} from './factories';
export {
  HoldTimeoutError,
  MutualExclusionError,
  WaitTimeoutError,
} from './errors';
export type {
  LockConfigurationInputType,
  MutexConfigurationInputType,
  MutexType,
} from './types';
