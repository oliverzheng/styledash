/** @flow */

import fs from 'fs';
import path from 'path';
import process from 'process';
import {spawn} from 'child_process';
import {Readable} from 'stream';

// Emits webpack warning - see https://github.com/Marak/colors.js/issues/137
import colors from 'colors/safe';
import webpack from 'webpack';
import findRoot from 'find-root';
import {parse as parseReactDocs} from 'react-docgen';

const nodeFilepath = process.argv[0];
const directory = process.argv[2];
if (!directory) {
  printError('Need to specify a directory to process.');
}

printAction(`Parsing directory ${directory}`);

if (!hasPackageJSON(directory)) {
  printError('Not a NPM directory.');
}

const IGNORE_DIRECTORIES = {
  'node_modules': true,
  '.git': true,
  'doc': true,
  'docs': true,
  'test': true,
  'tests': true,
  '__test__': true,
  '__tests__': true,
};

const reactFilepaths = [];
walkDirectory(
  directory,
  (filepath, isDir) => {
    const basename = path.basename(filepath);
    if (IGNORE_DIRECTORIES[basename]) {
      return false;
    }
    if (couldFilepathContainComponent(filepath)) {
      const doc = getComponentDoc(filepath);
      if (doc) {
        reactFilepaths.push(filepath);
      }
      console.log(filepath, doc ? 'is react' : 'is not');
    }
    return true;
  }
);

if (reactFilepaths.length > 0) {
  // Do just the fisrt right now
  const scriptStr =
    createComponentWebpackSerializedScript(directory, reactFilepaths[0], false);

  launchChildProcess(
    directory,
    scriptStr,
    (err, data) => {
      console.log('end');
      if (err) {
        console.log('error', err);
      } else {
        console.log('data', data);
      }
    },
  );
}


//// Generating output

function launchChildProcess(
  directory: string,
  inputSerializedFunc: string,
  onExitCallback: (err: ?string, data: ?string) => void,
) {
  const env = Object.create(process.env);
  env.NODE_ENV = 'development';
  const child = spawn(nodeFilepath, [], {
    cwd: directory,
    env,
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
    const out = childStdout.length !== 0
      ? childStdout.join('')
      : null;
    const err = childStderr.length !== 0
      ? childStderr.join('')
      : null;

    onExitCallback(err, out);
  });

  child.on('error', () => {
    console.log('child derped', arguments);
  });

  const childInputStream = new Readable();
  childInputStream.push(inputSerializedFunc);
  childInputStream.push(null);
  childInputStream.pipe(child.stdin);
}

function createComponentWebpackSerializedScript(
  dir: string,
  componentFilepath: string,
  useBabel: boolean,
): string {
  const serializedFunc = (function(
    webpack,
    MemoryFS,
    webpackConfig,
    componentRelativeFilepath,
  ) {
    const fs = new MemoryFS();
    const compiler = webpack(webpackConfig);

    webpackConfig.externals = {
      react: 'react',
    };
    webpackConfig.module = {
      rules: [{
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env', 'react'],
          },
        },
      }, {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      }, {
        test: /\.svg$/,
        use: ['file-loader'],
      }],
    };

    compiler.outputFileSystem = fs;
    compiler.run((err, stats) => {
      // Feed it back to the parent process
      console.log(
        fs.readFileSync(componentRelativeFilepath).toString(),
      );
    });
  }).toString();

  const nodeModulesDir = path.resolve(findRoot(__dirname), 'node_modules');
  const webpackDir = path.resolve(nodeModulesDir, 'webpack');
  const memoryFSDir = path.resolve(nodeModulesDir, 'memory-fs');

  const webpackConfig = createWebpackConfig(dir, componentFilepath, useBabel);

  // The text below must be ES5 only - what can be run by node.js. Since it's
  // a string, it's not compiled by babel, and is passed as is to the forked
  // node process.
  return `
    (${serializedFunc})(
      require('${webpackDir}'),
      require('${memoryFSDir}'),
      ${JSON.stringify(webpackConfig)},
      '${getComponentRelativeFilepath(dir, componentFilepath)}'
    )
  `;
}

function createWebpackConfig(
  dir: string,
  componentFilepath: string,
  useBabel: boolean,
): Object {
  const relativeFilepath = getComponentRelativeFilepath(dir, componentFilepath);
  return {
    entry: componentFilepath,
    output: {
      filename: path.basename(relativeFilepath),
      // The output will be in memory, so this path doesn't matter, as long as
      // all the components have unique paths.
      path: path.dirname(relativeFilepath),
    },
  };
}


//// Doc gen util

function getComponentDoc(filepath: string): ?Object /* TODO typing */ {
  const src = fs.readFileSync(filepath).toString();
  try {
    return parseReactDocs(src);
  } catch (err) {
    return null;
  }
}

function couldFilepathContainComponent(filepath: string): boolean {
  return !!filepath.match(/\.(js|jsx|tsx)$/);
}


//// Repo util

// Relative here means absolute if the repo was the root
function getComponentRelativeFilepath(
  dir: string,
  componentFilepath: string,
): string {
  return path.resolve('/', path.relative(dir, componentFilepath));
}

function walkDirectory(
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

function hasPackageJSON(dir: string): boolean {
  const packageJSONFilepath = path.resolve(dir, 'package.json');
  return fs.existsSync(packageJSONFilepath);
}

function hasBabelRC(dir: string): boolean {
  const babelRCFilepath = path.resolve(dir, '.babelrc');
  return fs.existsSync(babelRCFilepath);
}


//// Script printing util

function printAction(action: string): void {
  console.log(colors.bold('==> ' + action));
}

function printError(error: string): void {
  console.log(colors.red(error));
  process.exit();
}
