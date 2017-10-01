/** @flow */

import process from 'process';
import fs from 'fs';
import nullthrows from 'nullthrows';
import invariant from 'invariant';
import findRoot from 'find-root';
import path from 'path';

let envConfig: {
  dbURL: string,
  queueURL: string,
  server: {
    port: number,
    cookieSecret: string,
  },
};

if (process.env.NODE_ENV === 'development') {
  envConfig = JSON.parse(
    fs.readFileSync(
      path.join(findRoot(__dirname), 'devEnvConfig.json')
    ).toString(),
  );
} else {
  invariant(process.env.DATABASE_URL != null, 'Undefined DATABASE_URL env');
  invariant(process.env.PORT != null, 'Undefined PORT env');
  invariant(
    process.env.STYLEDASH_COOKIE_SECRET != null,
    'Undefined STYLEDASH_COOKIE_SECRET env',
  );
  envConfig = {
    dbURL: nullthrows(process.env.DATABASE_URL),
    queueURL: nullthrows(process.env.QUEUE_URL),
    server: {
      port: nullthrows(process.env.PORT),
      cookieSecret: nullthrows(process.env.STYLEDASH_COOKIE_SECRET),
    }
  };
}

export default envConfig;
