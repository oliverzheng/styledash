/** @flow */

// Emits webpack warning - see https://github.com/Marak/colors.js/issues/137
import colors from 'colors/safe';

export function printAction(action: string): void {
  console.log(colors.bold('==> ' + action));
}

export function printActionResult(result: string): void {
  console.log('    ' + result);
}

export function printError(error: string): void {
  console.log(colors.red(error));
}
