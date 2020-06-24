// @flow

/* eslint-disable fp/no-class, fp/no-this */

import ExtendableError from 'es6-error';

export class MutualExclusionError extends ExtendableError {}

export class WaitTimeoutError extends MutualExclusionError {
  code: string;

  constructor (message: string, code: string = 'WAIT_TIMEOUT') {
    super(message);

    this.code = code;
  }
}

export class HoldTimeoutError extends MutualExclusionError {
  code: string;

  constructor (message: string, code: string = 'HOLD_TIMEOUT') {
    super(message);

    this.code = code;
  }
}
