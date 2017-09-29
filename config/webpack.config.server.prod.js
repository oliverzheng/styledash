'use strict';

const path = require('path');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const eslintFormatter = require('react-dev-utils/eslintFormatter');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const pathConfig = require('./pathConfig');

if (process.env['NODE_ENV'] !== 'production') {
  throw new Error('Production builds must have NODE_ENV=production.');
}

module.exports = {
  // Don't attempt to continue if there are any errors.
  bail: true,
  devtool: 'source-map',
  entry: pathConfig.server.srcEntry,
  target: 'node',
  externals: [nodeExternals()],

  output: {
    path: pathConfig.buildDir,
    filename: pathConfig.server.buildOutputFilename,
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info =>
      path
        .relative(pathConfig.srcDir, info.absoluteResourcePath)
        .replace(/\\/g, '/'),
  },

  resolve: {
    // These are the reasonable defaults supported by the Node ecosystem.
    // We also include JSX as a common component filename extension to support
    // some tools, although we do not recommend using it, see:
    // https://github.com/facebookincubator/create-react-app/issues/290
    // `web` extension prefixes have been added for better support
    // for React Native Web.
    extensions: ['.web.js', '.js', '.json', '.web.jsx', '.jsx'],
    plugins: [
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(pathConfig.srcDir),
    ],
  },

  module: {
    strictExportPresence: true,
    rules: [
      // First, run the linter.
      // It's important to do this before Babel processes the JS.
      {
        test: /\.js$/,
        enforce: 'pre',
        include: pathConfig.srcDir,
        exclude: /node_modules/,
        use: [
          {
            options: {
              formatter: eslintFormatter,
              eslintPath: require.resolve('eslint'),
            },
            loader: require.resolve('eslint-loader'),
          },
        ],
      },
      {
        test: /\.js$/,
        include: pathConfig.srcDir,
        exclude: [
          /node_modules/,
          pathConfig.buildDir,
        ],
        loader: require.resolve('babel-loader'),
        query: {
          babelrc: false,
          presets: ['flow', 'es2015'],
          plugins: [
            'transform-class-properties',
            'transform-object-rest-spread',
          ],
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      STYLEDASH_SERVER_RESOURCE_DIRECTORY:
        JSON.stringify(pathConfig.server.resBuildDirRuntime),
      STYLEDASH_CLIENT_BUILD_DIRECTORY:
        JSON.stringify(pathConfig.client.buildDirRuntime),
      STYLEDASH_CLIENT_MANIFEST:
        JSON.stringify(
          path.join(pathConfig.client.buildDirRuntime, pathConfig.client.assetManifest)
        ),
    }),
    new CopyWebpackPlugin([{
      from: pathConfig.server.resDir,
      to: pathConfig.server.resBuildDir,
    }]),
    // Generate a manifest file which contains a mapping of all asset filenames
    // to their corresponding output file so that tools can pick it up without
    // having to parse `index.html`.
    new ManifestPlugin({
      fileName: pathConfig.client.assetManifest,
    }),
  ],
};
