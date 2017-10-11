/** @flow */

import fs from 'fs';
import path from 'path';
import process from 'process';
import tmp from 'tmp';
import invariant from 'invariant';
import nullthrows from 'nullthrows';
import {
  parse as parseReactDocs,
  resolver,
  defaultHandlers,
} from 'react-docgen';
import findRoot from 'find-root';

import walkDirectory from '../util/walkDirectory';
import groupPaths from '../util/groupPaths';
import genLaunchChildProcess from '../util/genLaunchChildProcess';
import {printError} from '../consoleUtil';
import EntRepository from '../entity/EntRepository';
import EntGitHubToken from '../entity/EntGitHubToken';

const {findAllExportedComponentDefinitions} = resolver;

export type ParsedComponent = {
  name: string,
  isNamedExport: boolean,
  exportedNameInBundle: string,
  filepath: string,
  relativeFilepath: string,
  doc: Object,
};

export type CompileOptions = {
  libraryName: string,
};

const nodeFilepath = process.argv[0];


//// Util

// Relative here means absolute if the repo was the root
function getComponentRelativeFilepath(
  repoPath: string,
  componentFilepath: string,
): string {
  return path.resolve('/', path.relative(repoPath, componentFilepath));
}

export function getCompiledComponentsLOC(
  compiledBundle: string,
): {
  totalLOC: number,
  totalBytes: number,
} {
  const totalLOC = compiledBundle.split('\n').length;
  const totalBytes = compiledBundle.length;
  return {
    totalLOC,
    totalBytes,
  };
}


//// Cloning repo

function getGitHubCloneRepoURL(
  user: string,
  repo: string,
  token: string,
): string {
  return `https://${token}@github.com/${user}/${repo}.git`;
}

async function genCloneRepo(
  url: string,
): Promise<{
  repoPath: string,
  cleanupCallback: () => void,
}> {
  return new Promise((resolve, reject) => {
    tmp.dir(
      { unsafeCleanup: true },
      async (err, dirPath, cleanup) => {
        if (err) {
          reject(err);
          return;
        }
        const {
          code,
          stderr,
        } = await genLaunchChildProcess('git', ['clone', url, 'repo'], dirPath);
        if (code !== 0) {
          reject(
            `Git clone failed with error code ${code}` +
              (stderr != null ? ` and error message ${stderr}` : '')
          );
          cleanup();
          return;
        }

        resolve({
          repoPath: path.join(dirPath, 'repo'),
          cleanupCallback: cleanup,
        });
      },
    );
  });
}


//// Git

export async function genHeadCommitHash(
  repoPath: string,
): Promise<string> {
  const {code, stdout, stderr} =
    await genLaunchChildProcess('git', ['rev-parse', 'HEAD'], repoPath);
  if (code !== 0) {
    throw new Error(
      'Unable to get git HEAD commit hash.' +
        (stderr != null ? `Error: ${stderr}` : '')
    );
  }
  invariant(stdout != null, 'commit hash must not be null');
  return stdout.trim();
}


//// Repo util

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

export async function genVerifyPackageJSON(repoPath: string): Promise<Object> {
  if (!hasPackageJSON(repoPath)) {
    throw new Error('Not a NPM directory.');
  }

  const packageJSON = getPackageJSON(repoPath);
  if (!packageJSON) {
    throw new Error('package.json is not well formed JSON.');
  }

  return packageJSON;
}

export async function genYarnInstall(repoPath: string): Promise<void> {
  const {code, stderr} = await genLaunchChildProcess(
    'yarn',
    ['install'],
    repoPath,
  );
  if (code !== 0) {
    throw new Error('Could not yarn install. ' + (stderr || ''));
  }
}


//// Parsing components

function couldFilepathContainComponent(filepath: string): boolean {
  return !!filepath.match(/\.(js|jsx|tsx)$/);
}

function extractExportNameHandler(
  documentation,
  path,
) {
  let name = null;

  // ES6 non-default export, where the value immmediately follows the export
  if (
    !Array.isArray(path.parentPath.value) &&
    path.parentPath.value.type === 'ExportNamedDeclaration'
  ) {
    const declaration = path.parentPath.value.declaration;
    // TODO functional components and createClass
    if (declaration.type === 'ClassDeclaration') {
      name = declaration.id.name;
    }
  }
  // ES6 default export, where the value immediately follows the export
  else if (
    !Array.isArray(path.parentPath.value) &&
    path.parentPath.value.type === 'ExportDefaultDeclaration'
  ) {
    name = 'default';
  }
  // TODO
  // - export where the value is a reference to an earlier declaration
  // - commonJS export

  if (name != null) {
    documentation.set('exportName', name);
  } else {
    // Log something so we have an indicator to look back on this
    printError('Did not find an export name');
  }
}

const reactDocHandlers = [];
reactDocHandlers.push(...defaultHandlers);
reactDocHandlers.push(extractExportNameHandler);

function getComponentDoc(filepath: string): Array<Object> {
  const src = fs.readFileSync(filepath).toString();
  try {
    return parseReactDocs(
      src,
      findAllExportedComponentDefinitions,
      reactDocHandlers,
    );
  } catch (err) {
    return [];
  }
}

export function parseComponents(
  repoPath: string,
): Array<ParsedComponent> {
  // TODO use .gitignore
  const IGNORE_DIRECTORIES = {
    'node_modules': true,
    '.git': true,
    'build': true,
    'doc': true,
    'docs': true,
    'test': true,
    'tests': true,
    '__test__': true,
    '__tests__': true,
  };

  const components: Array<{
    name: string,
    isNamedExport: boolean,
    exportedNameInBundle: string,
    filepath: string,
    relativeFilepath: string,
    doc: Object,
  }> = [];
  walkDirectory(
    repoPath,
    (filepath, isDir) => {
      const basename = path.basename(filepath);
      if (IGNORE_DIRECTORIES[basename]) {
        return false;
      }
      if (couldFilepathContainComponent(filepath)) {
        const docs = getComponentDoc(filepath);
        docs.forEach(doc => {
          const isNamedExport = doc.exportName && doc.exportName !== 'default';
          const name = isNamedExport
            ? doc.exportName
            : path.basename(filepath).replace(/\.[^/.]+$/, '');
          components.push({
            name,
            exportedNameInBundle: name,
            isNamedExport,
            filepath,
            relativeFilepath: getComponentRelativeFilepath(repoPath, filepath),
            doc,
          });
        });
      }
      return true;
    }
  );
  return components;
}


//// Compiling components

function findCommonAncestorDirectory(
  filepaths: Array<string>,
): string {
  invariant(filepaths.length > 0, 'Must have more than 1 filepath');

  const pathGroup = groupPaths(
    filepaths.map(p => ({path: p, content: null}))
  );
  // groupPaths assumes relative paths, so the result is not absolute
  return '/' + nullthrows(Object.keys(nullthrows(pathGroup.children))[0]);
}

function getAggregateExportFileContent(
  dir: string,
  parsedComponents: Array<ParsedComponent>,
): string {
  const contents = [];

  parsedComponents.forEach(pc => {
    const relativeFilepathFromDir = path.relative(dir, pc.filepath);
    const exportNameFromFile =
      pc.isNamedExport ? pc.name : 'default';

    contents.push(
      `export { ${exportNameFromFile} as ${pc.exportedNameInBundle} } from './${relativeFilepathFromDir}';`
    );
  });

  return contents.join('\n');
}

async function genCreateAggregateExportFile(
  repoPath: string,
  parsedComponents: Array<ParsedComponent>,
): Promise<{
  filepath: string,
  cleanupCallback: () => void,
}> {
  const dir = findCommonAncestorDirectory(
    parsedComponents.map(pc => pc.filepath)
  );

  const {
    name,
    fd,
    removeCallback,
  } = tmp.fileSync({
    dir,
    postfix: '.js',
  });

  // Flow thinks the extra args are required
  (fs.writeSync: any)(fd, getAggregateExportFileContent(dir, parsedComponents));
  fs.closeSync(fd);

  return {
    filepath: name,
    cleanupCallback: removeCallback,
  };
}

export async function genCompileParsedComponents(
  repoPath: string,
  packageJSON: Object,
  parsedComponents: Array<ParsedComponent>,
  options: CompileOptions,
): Promise<string> {
  const {
    filepath: aggregateExportFilepath,
    cleanupCallback,
  } = await genCreateAggregateExportFile(
    repoPath,
    parsedComponents,
  );

  const scriptStr = createComponentWebpackSerializedScript(
    repoPath,
    aggregateExportFilepath,
    packageJSON,
    options,
  );

  const {code, stdout, stderr} = await genLaunchChildProcess(
    nodeFilepath,
    [],
    repoPath,
    scriptStr,
  );

  cleanupCallback();

  if (code !== 0) {
    throw new Error(
      `Compiling ${aggregateExportFilepath} failed with error: ${stderr || ''}`
    );
  }

  invariant(stdout != null, 'Compiled bundle must be non empty');
  return stdout;
}


//// Webpack config
//// TODO - compile all components into 1 bundle

function createComponentWebpackSerializedScript(
  repoPath: string,
  componentFilepath: string,
  packageJSON: Object,
  options: CompileOptions,
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
      // TODO this isn't working for some reason
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
        // TODO this is temporary. We should really look at how the target
        // repo's webpack does things and clone those.
        test: /\.svg$/,
        use: 'react-svg-inline-loader',
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

  // Use node_modules from ourselves
  const nodeModulesDir = path.resolve(findRoot(__dirname), 'node_modules');
  const webpackDir = path.resolve(nodeModulesDir, 'webpack');
  const memoryFSDir = path.resolve(nodeModulesDir, 'memory-fs');

  const webpackConfig = createWebpackConfig(repoPath, componentFilepath, options);

  // The text below must be ES5 only - what can be run by node.js. Since it's
  // a string, it's not compiled by babel, and is passed as is to the forked
  // node process.
  return `
    (${serializedFunc})(
      require('${webpackDir}'),
      require('${memoryFSDir}'),
      ${JSON.stringify(webpackConfig)},
      ${JSON.stringify(getBabelOptions(repoPath, packageJSON))},
      '${getComponentRelativeFilepath(repoPath, componentFilepath)}'
    )
  `;
}

function createWebpackConfig(
  repoPath: string,
  componentFilepath: string,
  options: CompileOptions,
): Object {
  const relativeFilepath =
    getComponentRelativeFilepath(repoPath, componentFilepath);
  return {
    entry: componentFilepath,
    output: {
      filename: path.basename(relativeFilepath),
      // The output will be in memory, so this path doesn't matter, as long as
      // all the components have unique paths.
      path: path.dirname(relativeFilepath),
      library: options.libraryName,
      libraryTarget: 'var',
    },
  };
}

function getBabelOptions(repoPath: string, packageJSON: Object): ?Object {
  const NPM_PACKAGE_TO_BABEL_PRESETS = {
    'babel-preset-es2015': 'es2015',
    'babel-preset-react': 'react',
    'babel-preset-env': 'env',
    'babel-preset-flow': 'flow',
    'babel-preset-stage-0': 'stage-0',
    'babel-preset-stage-1': 'stage-1',
  };

  if (hasBabelRC(repoPath)) {
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



//// Main function

// TODO this should really use an EventEmitter since it's so long running with
// multiple steps
export default async function genCompileRepo(
  repo: EntRepository,
  options: CompileOptions,
): Promise<{
  commitHash: string,
  components: Array<ParsedComponent>,
  compiledBundle: string,
}> {
  const entToken = await EntGitHubToken.genFindTokenForRepository(repo);
  if (!entToken) {
    throw new Error(`No GitHub token available for repo ${repo.getID()}`);
  }
  const token = entToken.getToken();

  // TODO use the githubRepoID instead of username/repo, which could change if
  // someone renamed it or transferred it.
  const cloneURL = getGitHubCloneRepoURL(
    nullthrows(repo.getGitHubUsername()),
    nullthrows(repo.getGitHubRepo()),
    token,
  );
  const {
    repoPath,
    cleanupCallback,
  } = await genCloneRepo(cloneURL);

  const commitHash = await genHeadCommitHash(repoPath);

  const packageJSON = await genVerifyPackageJSON(repoPath);
  await genYarnInstall(repoPath);

  const components = parseComponents(repoPath);
  const compiledBundle = await genCompileParsedComponents(
    repoPath,
    packageJSON,
    components,
    options,
  );

  cleanupCallback();

  return {
    commitHash,
    components,
    compiledBundle,
  };
}
