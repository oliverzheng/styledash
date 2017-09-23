/** @flow */

import process from 'process';
import fs from 'fs';
import nullthrows from 'nullthrows';
import findRoot from 'find-root';
import path from 'path';

let envConfig: {
  dbURL: string,
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
  envConfig = {
    dbURL: nullthrows(process.env.DATABASE_URL),
    server: {
      port: nullthrows(process.env.PORT),
      cookieSecret: nullthrows(process.env.STYLEDASH_COOKIE_SECRET),
    }
  };
}

export default envConfig;
