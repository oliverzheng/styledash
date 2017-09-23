const path = require('path');
const invariant = require('invariant');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const buildDir = path.join(rootDir, 'build');

const serverResourceDir = path.join(srcDir, 'res');
const serverResourceBuildDir = path.join(buildDir, 'res');

const clientSrcDir = path.join(srcDir, 'client');
const clientBuildDir = path.join(buildDir, 'client');
const clientAssetDir = path.join(clientBuildDir, 'assets');
const clientAssetManifest = 'asset-manifest.json';

const clientEntryPointApp = path.join(clientSrcDir, 'index.js');

module.exports = {
  srcDir: srcDir,
  buildDir: buildDir,

  server: {
    srcEntry: path.join(srcDir, 'server.js'),
    buildOutputFilename: 'server.js',

    resDir: serverResourceDir, 
    resBuildDir: serverResourceBuildDir,
  },

  client: {
    assetManifest: 'asset-manifest.json',
    buildDir: clientBuildDir,
    assetDir: clientAssetDir,
    apps: {
      app: clientEntryPointApp,
    },
    appEntryPoints: [
      clientEntryPointApp,
    ],
  },
};
