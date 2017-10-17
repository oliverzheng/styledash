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
    port: ?number, // this is only available if we are in the www proc
    cookieSecret: string,
  },
  github: {
    clientID: string,
    clientSecret: string,
  },
  externalHostOverride: ?string,
};

if (process.env.NODE_ENV === 'development') {
  envConfig = JSON.parse(
    fs.readFileSync(
      path.join(findRoot(__dirname), 'devEnvConfig.json')
    ).toString(),
  );
} else {
  invariant(process.env.DATABASE_URL != null, 'Undefined DATABASE_URL env');
  invariant(
    process.env.STYLEDASH_COOKIE_SECRET != null,
    'Undefined STYLEDASH_COOKIE_SECRET env',
  );
  envConfig = {
    dbURL: nullthrows(process.env.DATABASE_URL),
    queueURL: nullthrows(process.env.RABBITMQ_URL),
    server: {
      port: process.env.PORT,
      cookieSecret: nullthrows(process.env.STYLEDASH_COOKIE_SECRET),
    },
    github: {
      clientID: nullthrows(process.env.GITHUB_CLIENT_ID),
      clientSecret: nullthrows(process.env.GITHUB_CLIENT_SECRET),
    },
    externalHostOverride: process.env.EXTERNAL_HOST_OVERRIDE,
  };
}

export default envConfig;

export function getExternalHost(req: Object): string {
  if (envConfig.externalHostOverride) {
    return envConfig.externalHostOverride;
  }

  return `${req.protocol}://${req.get('Host')}`;
}
