/** @flow */

import fs from 'fs';
import path from 'path';

export default function walkDirectory(
  dir: string,
  // Return whether or not to recurse
  callback: (filepath: string, isDir: boolean) => boolean,
): void {
  fs.readdirSync(dir).forEach(name => {
    const filepath = path.resolve(dir, name);
    const stat = fs.statSync(filepath);
    if (stat) {
      const isDir = stat.isDirectory();
      const shouldRecurse = callback(filepath, isDir);
      if (isDir && shouldRecurse) {
        walkDirectory(filepath, callback);
      }
    }
  });
}
