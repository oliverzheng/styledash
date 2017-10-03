/** @flow */

import invariant from 'invariant';
// Emits webpack warning - see https://github.com/Marak/colors.js/issues/137
import colors from 'colors/safe';

export function printAction(action: string): void {
  console.log(colors.bold('==> ' + action));
}

export function printActionResult(result: string): void {
  console.log('    ' + result);
}

export function printError(error: Object | string): void {
  let msg;
  if (typeof error === 'string') {
    msg = error;
  } else if (error instanceof Error) {
    msg = error.stack;
  } else {
    invariant(false, 'Found unusable error');
  }

  console.log(colors.red(msg));
}
