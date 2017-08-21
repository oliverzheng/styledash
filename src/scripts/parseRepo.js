/** @flow */

import fs from 'fs';
import path from 'path';
import process from 'process';
import {spawn} from 'child_process';
import {Readable} from 'stream';

import webpack from 'webpack';
import findRoot from 'find-root';
import SQL from 'sql-template-strings';
import filesize from 'filesize';
import nullthrows from 'nullthrows';
import {parse as parseReactDocs} from 'react-docgen';

import dbconfig from '../../dbconfig.json';
import {
  connectToMySQL,
  executeSQL,
  cleanupConnection,
} from '../mysql';
import {
  printAction,
  printActionResult,
  printError,
} from '../consoleUtil';

async function main(): Promise<*> {
  const nodeFilepath = process.argv[0];
  const directory = process.argv[2];
  if (!directory) {
    throw new Error('Need to specify a directory to process.');
  }
  if (!hasPackageJSON(directory)) {
    throw new Error('Not a NPM directory.');
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

    printAction('Compiling components...');
    const compiledComponents: Array<{
      name: string,
      doc: Object,
      filepath: string,
      compiled: string,
    }> = await Promise.all(
      components.map(component => {
        return compileComponent(nodeFilepath, directory, component.filepath)
          .then(compiled => {
            return {
              ...component,
              compiled,
            };
          });
      })
    );

    const totalLOC = compiledComponents.map(
      component => component.compiled.split('\n').length
    ).reduce((a, b) => a + b);
    const totalBytes = compiledComponents.map(
      component => component.compiled.length
    ).reduce((a, b) => a + b);
    printActionResult(
      `Produced a total of ${totalLOC} lines of code, ${filesize(totalBytes)}.`
    );

    printAction('Saving new repo to database...');
    const repoID: string = (await executeSQL(
      mysqlConnection,
      SQL`INSERT INTO repository (name) VALUES (${repoName})`
    )).insertId;
    printActionResult(`Saved as repo #${repoID}.`);

    printAction('Saving compiled components to database...');
    await Promise.all(
      compiledComponents.map(compiledComponent => {
        const relativeFilepath =
          getComponentRelativeFilepath(directory, compiledComponent.filepath);
        return executeSQL(
          mysqlConnection,
          SQL`
            INSERT INTO component (
              name,
              repository_id,
              filepath,
              compiled_bundle
            )
            VALUES (
              ${compiledComponent.name},
              ${nullthrows(repoID)},
              ${relativeFilepath},
              ${compiledComponent.compiled}
             )
          `,
        );
      })
    );
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
): Promise<string> {
  const scriptStr =
    createComponentWebpackSerializedScript(directory, filepath, false);

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

function hasBabelRC(dir: string): boolean {
  const babelRCFilepath = path.resolve(dir, '.babelrc');
  return fs.existsSync(babelRCFilepath);
}
