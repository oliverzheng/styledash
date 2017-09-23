/** @flow */

import process from 'process';
import path from 'path';
import invariant from 'invariant';

const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';
invariant(isProd || isDev, 'Must have one');

export default function getResourcePath(relativeFilepath: string): string {
  if (isProd) {
    const dir = STYLEDASH_SERVER_RESOURCE_DIRECTORY;
    invariant(dir != null, 'Prod res dir is null');
    return path.join(dir, relativeFilepath);
  } else {
    return path.join(__dirname, 'res', relativeFilepath);
  }
}
