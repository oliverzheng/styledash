/** @flow */

import {spawn} from 'child_process';
import {Readable} from 'stream';

export default async function genLaunchChildProcess(
  cmd: string,
  args: Array<string>,
  currentDir: string,
  stdin: ?string = null,
): Promise<{
  code: number,
  stdout: ?string,
  stderr: ?string,
}> {
  return await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: currentDir,
    });

    const childStdout = [];
    child.stdout.on('data', (data) => {
      childStdout.push(data);
    });

    const childStderr = [];
    child.stderr.on('data', (data) => {
      childStderr.push(data);
    });

    child.on('exit', (code, signal) => {
      const stdout = childStdout.length > 0 ? childStdout.join('') : null;
      const stderr = childStderr.length > 0 ? childStderr.join('') : null;
      resolve({
        code,
        stdout,
        stderr,
      });
    });

    child.on('error', () => {
      reject({err: 'child derped', args: arguments});
    });

    if (stdin != null) {
      const childInputStream = new Readable();
      childInputStream.push(stdin);
      childInputStream.push(null);
      childInputStream.pipe(child.stdin);
    }
  });
}
