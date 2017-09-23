/** @flow */

import fs from 'fs';
import path from 'path';
import process from 'process';
import os from 'os';
import {spawn} from 'child_process';
import {Readable} from 'stream';

import invariant from 'invariant';
import findRoot from 'find-root';
import SQL from 'sql-template-strings';
import filesize from 'filesize';
import nullthrows from 'nullthrows';
import PromisePool from 'es6-promise-pool';
import {parse as parseReactDocs} from 'react-docgen';

import dbconfig from '../dbconfig.json';
import {
  connectToMySQL,
  executeSQL,
  cleanupConnection,
} from '../storage/mysql';
import {
  printAction,
  printActionResult,
  printError,
} from '../consoleUtil';


const PROMISE_POOL_SIZE = os.cpus().length;

async function main(): Promise<*> {
  const nodeFilepath = process.argv[0];
  const directory = process.argv[2];
  if (!directory) {
    throw new Error('Need to specify a directory to process.');
  }
  if (!hasPackageJSON(directory)) {
    throw new Error('Not a NPM directory.');
  }
  const packageJSON = getPackageJSON(directory);
  if (!packageJSON) {
    throw new Error('package.json is not well formed JSON.');
  }
  const repoName = process.argv[3];
  if (!repoName) {
    throw new Error('Need to specify a repository name for storage.');
  }

  printAction('Connecting to MySQL...');
  const mysqlConnection = await connectToMySQL(dbconfig);

  try {
    printAction('Parsing directory...');
    const components = getComponents(directory);
    printActionResult(`Parsed ${components.length} components.`);

    printAction(
      `Compiling components with ${PROMISE_POOL_SIZE} concurrent processes...`
    );
    const compiledComponents: Array<{
      name: string,
      doc: Object,
      filepath: string,
      compiled: string,
    }> = [];

    const componentsLeft = components.slice(0);
    const compilePool = new PromisePool(
      () => {
        if (componentsLeft.length === 0) {
          return null;
        }
        const component = componentsLeft.shift();
        return compileComponent(
          nodeFilepath,
          directory,
          component.filepath,
          packageJSON,
        ).then(compiled => {
          return {
            ...component,
            compiled,
          };
        });
      },
      PROMISE_POOL_SIZE,
    );
    compilePool.addEventListener('fulfilled', event => {
      const compiledComponent = event.data.result;
      const relativeFilepath =
        getComponentRelativeFilepath(directory, compiledComponent.filepath);
      printActionResult(`Compiled ${relativeFilepath}`);
      compiledComponents.push(compiledComponent);
    });
    compilePool.addEventListener('rejected', event => {
      printError(`Error during compilation: ${event.data.error}`);
    });
    await compilePool.start();

    if (compiledComponents.length > 0) {
      const totalLOC = compiledComponents.map(
        component => component.compiled.split('\n').length
      ).reduce((a, b) => a + b);
      const totalBytes = compiledComponents.map(
        component => component.compiled.length
      ).reduce((a, b) => a + b);
      printActionResult(
        `Produced a total of ${totalLOC} lines of code, ${filesize(totalBytes)}.`
      );
    }

    printAction('Saving new repo to database...');
    const repoID: string = (await executeSQL(
      mysqlConnection,
      SQL`INSERT INTO repository (name, last_updated_timestamp)
          VALUES (${repoName}, UNIX_TIMESTAMP())`
    )).insertId;
    printActionResult(`Saved as repo #${repoID}.`);

    printAction('Saving compiled components to database...');
    const componentsLeftToSave = compiledComponents.slice(0);
    const saveComponentPool = new PromisePool(
      () => {
        if (componentsLeftToSave.length === 0) {
          return null;
        }
        const compiledComponent = componentsLeftToSave.shift();
        const relativeFilepath =
          getComponentRelativeFilepath(directory, compiledComponent.filepath);
        return executeSQL(
          mysqlConnection,
          SQL`
            INSERT INTO component (
              name,
              repository_id,
              filepath,
              compiled_bundle,
              react_doc
            )
            VALUES (
              ${compiledComponent.name},
              ${nullthrows(repoID)},
              ${relativeFilepath},
              ${compiledComponent.compiled},
              ${JSON.stringify(compiledComponent.doc)}
            )
          `,
        ).then(sqlResult => {
          return {
            component: compiledComponent,
            insertID: sqlResult.insertId,
          };
        }).catch(err => {
          throw new Error(
            JSON.stringify({
              component: compiledComponent,
              error: err,
            })
          );
        });
      },
      PROMISE_POOL_SIZE,
    );
    saveComponentPool.addEventListener('fulfilled', event => {
      const {component, insertID} = event.data.result;
      const relativeFilepath =
        getComponentRelativeFilepath(directory, component.filepath);
      printActionResult(`Saved ${relativeFilepath} as component ID #${insertID}`);
    });
    saveComponentPool.addEventListener('rejected', event => {
      const {component, error} = event.data.error;
      const relativeFilepath =
        getComponentRelativeFilepath(directory, component.filepath);
      printError(`Error while saving ${relativeFilepath}: ${error}`);
    });
    await saveComponentPool.start();

    printActionResult('Saved.');
  }
  catch (err) {
    cleanupConnection(mysqlConnection);
    throw err;
  }

  cleanupConnection(mysqlConnection);
}

main().catch(err => printError(err));


//// Generating output

function getComponents(
  directory: string,
): Array<{
  name: string,
  filepath: string,
  doc: Object,
}> {
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

  const components: Array<{
    name: string,
    filepath: string,
    doc: Object,
  }> = [];
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
          components.push({
            name: path.basename(filepath).replace(/\.[^/.]+$/, ''),
            filepath,
            doc,
          });
        }
      }
      return true;
    }
  );
  return components;
}

async function compileComponent(
  nodeFilepath: string,
  directory: string,
  filepath: string,
  packageJSON: Object,
): Promise<string> {
  const scriptStr =
    createComponentWebpackSerializedScript(directory, filepath, packageJSON);

  return await launchChildProcess(
    nodeFilepath,
    directory,
    scriptStr,
  );
}

async function launchChildProcess(
  nodeFilepath: string,
  directory: string,
  inputSerializedFunc: string,
): Promise<string> {
  return await new Promise((resolve, reject) => {
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
      if (code === 0) {
        resolve(childStdout.join(''));
      } else {
        resolve(childStderr.join(''));
      }
    });

    child.on('error', () => {
      reject({err: 'child derped', args: arguments});
    });

    const childInputStream = new Readable();
    childInputStream.push(inputSerializedFunc);
    childInputStream.push(null);
    childInputStream.pipe(child.stdin);
  });
}

function createComponentWebpackSerializedScript(
  dir: string,
  componentFilepath: string,
  packageJSON: Object,
): string {
  const serializedFunc = (function(
    webpack,
    MemoryFS,
    webpackConfig,
    babelOptions,
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
          options: babelOptions,
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

  const webpackConfig = createWebpackConfig(dir, componentFilepath);

  // The text below must be ES5 only - what can be run by node.js. Since it's
  // a string, it's not compiled by babel, and is passed as is to the forked
  // node process.
  return `
    (${serializedFunc})(
      require('${webpackDir}'),
      require('${memoryFSDir}'),
      ${JSON.stringify(webpackConfig)},
      ${JSON.stringify(getBabelOptions(dir, packageJSON))},
      '${getComponentRelativeFilepath(dir, componentFilepath)}'
    )
  `;
}

function createWebpackConfig(
  dir: string,
  componentFilepath: string,
): Object {
  const relativeFilepath = getComponentRelativeFilepath(dir, componentFilepath);
  return {
    entry: componentFilepath,
    output: {
      filename: path.basename(relativeFilepath),
      // The output will be in memory, so this path doesn't matter, as long as
      // all the components have unique paths.
      path: path.dirname(relativeFilepath),
      library: 'componentOnLoad',
      libraryTarget: 'jsonp',
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

function getPackageJSON(dir: string): ?Object {
  invariant(hasPackageJSON(dir), 'Must have package.json');
  const packageJSONFilepath = path.resolve(dir, 'package.json');
  try {
    return JSON.parse(
      fs.readFileSync(packageJSONFilepath).toString()
    );
  } catch (e) {
    // Invalid json
    return null;
  }
}

function hasBabelRC(dir: string): boolean {
  const babelRCFilepath = path.resolve(dir, '.babelrc');
  return fs.existsSync(babelRCFilepath);
}

const NPM_PACKAGE_TO_BABEL_PRESETS = {
  'babel-preset-es2015': 'es2015',
  'babel-preset-react': 'react',
  'babel-preset-env': 'env',
  'babel-preset-flow': 'flow',
  'babel-preset-stage-0': 'stage-0',
  'babel-preset-stage-1': 'stage-1',
};

function getBabelOptions(dir: string, packageJSON: Object): ?Object {
  if (hasBabelRC(dir)) {
    // Babel will use .babelrc directly
    return null;
  }

  const presets = Object.keys(NPM_PACKAGE_TO_BABEL_PRESETS)
    .filter(
      npmPackage => packageJSONContainsDependency(packageJSON, npmPackage)
    )
    .map(npmPackage => NPM_PACKAGE_TO_BABEL_PRESETS[npmPackage]);

  return {
    presets,
  };
}

function packageJSONContainsDependency(
  packageJSON: Object,
  dep: string,
): boolean {
  const devDeps = packageJSON.devDependencies;
  const deps = packageJSON.dependencies;
  if (devDeps && devDeps[dep]) {
    return true;
  }
  if (deps && deps[dep]) {
    return true;
  }
  return false;
}
