const path = require('path');
const process = require('process');
const invariant = require('invariant');

const rootDir = path.join(__dirname, '..');
let runtimeRootDir;
// While a heroku buildpack is being built, its directory is something like
// /tmp/build/crap, but runtime is something like /app. This config matters for
// things that get compiled into the bundle, so runtime paths are correct. time.
if (process.env.APP_ROOT_DIR) {
  runtimeRootDir = process.env.APP_ROOT_DIR;
} else {
  runtimeRootDir = rootDir;
}
const nodeModulesDir = path.join(rootDir, 'node_modules');
const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');
const buildDirRuntime = path.join(runtimeRootDir, 'build');

const serverResourceDir = path.join(srcDir, 'res');
const serverResourceBuildDir = path.join(buildDir, 'res');
const serverResourceBuildDirRuntime = path.join(buildDirRuntime, 'res');

const clientSrcDir = path.join(srcDir, 'client');
const clientBuildDir = path.join(buildDir, 'client');
const clientBuildDirRuntime = path.join(buildDirRuntime, 'client');
const clientAssetDir = path.join(clientBuildDir, 'assets');
const clientAssetManifest = 'asset-manifest.json';

const clientEntryPointApp = path.join(clientSrcDir, 'index.js');
const clientEntryPointMainSite = path.join(clientSrcDir, 'indexMainSiteApp.js');

module.exports = {
  srcDir: srcDir,
  buildDir: buildDir,

  server: {
    srcEntry: path.join(srcDir, 'server.js'),
    buildOutputFilename: 'server.js',

    resDir: serverResourceDir, 
    resBuildDir: serverResourceBuildDir,
    resBuildDirRuntime: serverResourceBuildDirRuntime,
  },

  client: {
    assetManifest: 'asset-manifest.json',
    buildDir: clientBuildDir,
    buildDirRuntime: clientBuildDirRuntime,
    assetDir: clientAssetDir,
    apps: {
      app: clientEntryPointApp,
      mainSite: clientEntryPointMainSite,
    },
    appEntryPoints: [
      clientEntryPointApp,
      clientEntryPointMainSite,
    ],
    // There are packages we depend on that don't transpile to ES5 themselves.
    packagesThatNeedBabel: [
      path.join(nodeModulesDir, 'camelcase'),
    ],
  },
};
