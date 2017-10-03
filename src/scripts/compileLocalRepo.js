/** @flow */

import process from 'process';
import os from 'os';

import SQL from 'sql-template-strings';
import filesize from 'filesize';
import nullthrows from 'nullthrows';
import PromisePool from 'es6-promise-pool';

import envConfig from '../envConfig';
import {
  connectToMySQL,
  executeSQL,
  cleanupMySQLConnection,
} from '../storage/mysql';
import {
  printAction,
  printActionResult,
  printError,
} from '../consoleUtil';
import {
  genVerifyPackageJSON,
  parseComponents,
  genCompileParsedComponents,
  getCompiledComponentsLOC,
} from '../compile/genCompileRepo';


const PROMISE_POOL_SIZE = os.cpus().length;

async function main(): Promise<*> {
  const directory = process.argv[2];
  if (!directory) {
    throw new Error('Need to specify a directory to process.');
  }
  const packageJSON = await genVerifyPackageJSON(directory);
  const repoName = process.argv[3];
  if (!repoName) {
    throw new Error('Need to specify a repository name for storage.');
  }

  printAction('Connecting to MySQL...');
  const mysqlConnection = await connectToMySQL(envConfig.dbURL);

  try {
    printAction('Parsing directory...');
    const components = parseComponents(directory);
    printActionResult(`Parsed ${components.length} components.`);

    printAction(
      `Compiling components with ${PROMISE_POOL_SIZE} concurrent processes...`
    );
    const compiledComponents = await genCompileParsedComponents(
      directory,
      packageJSON,
      components,
      {
        jsonpCallback: 'componentOnLoad',
        childSpawnPoolSize: PROMISE_POOL_SIZE,
        onComponentCompiledCallback: compiledComponent =>
          printActionResult(`Compiled ${compiledComponent.relativeFilepath}`),
      },
    );

    if (compiledComponents.length > 0) {
      const {totalLOC, totalBytes} =
        getCompiledComponentsLOC(compiledComponents);
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
              ${compiledComponent.relativeFilepath},
              ${compiledComponent.compiledBundle},
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
      printActionResult(
        `Saved ${component.relativeFilepath} as component ID #${insertID}`
      );
    });
    saveComponentPool.addEventListener('rejected', event => {
      const {component, error} = event.data.error;
      printError(`Error while saving ${component.relativeFilepath}: ${error}`);
    });
    await saveComponentPool.start();

    printActionResult('Saved.');
  }
  finally (err) {
    cleanupMySQLConnection(mysqlConnection);
  }
}

main().catch(err => printError(err));
