/** @flow */

import fs from 'fs';
import path from 'path';
import process from 'process';

// Emits webpack warning - see https://github.com/Marak/colors.js/issues/137
import colors from 'colors/safe';
import {parse as parseReactDocs} from 'react-docgen';

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

walkDirectory(
  directory,
  (filepath, isDir) => {
    const basename = path.basename(filepath);
    if (IGNORE_DIRECTORIES[basename]) {
      return false;
    }
    if (couldFilepathContainComponent(filepath)) {
      const doc = getComponentDoc(filepath);
      console.log(filepath, doc ? 'is react' : 'is not');
    }
    return true;
  }
);


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


//// Script printing util

function printAction(action: string): void {
  console.log(colors.bold('==> ' + action));
}

function printError(error: string): void {
  console.log(colors.red(error));
  process.exit();
}
