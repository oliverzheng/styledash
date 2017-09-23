// Purposely don't use flow here.

import process from 'process';
import path from 'path';
import invariant from 'invariant';
import nullthrows from 'nullthrows';
import findRoot from 'find-root';

export function getClientDevWebpackConfig() {
  invariant(process.env.NODE_ENV === 'development', 'Must be dev');

  // Don't add some shit like require('../' + CONST). Webpack will go, "Oh you
  // want possibly everything in the parent directory? Let me include every
  // bloody file in this entire repository, including the build artifacts from
  // the last build, recursively bulking the build process each time.
  const webpackFilepath = path.join(
    findRoot(__dirname),
    nullthrows(process.env.STYLEDASH_WEBPACK_CONFIG),
  );
  return require(webpackFilepath);
}
