/** @flow */

import process from 'process';
import os from 'os';

import filesize from 'filesize';

import envConfig from '../envConfig';
import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';
import {
  connectToMySQL,
  cleanupMySQLConnection,
} from '../storage/mysql';
import {
  genConnectToServer,
  genDisconnectFromServer,
} from '../storage/queue';
import {
  printAction,
  printActionResult,
  printError,
} from '../consoleUtil';
import genCompileRepo, {
  getCompiledComponentsLOC,
} from '../compile/genCompileRepo';
import genSaveCompiledRepo from '../compile/genSaveCompiledRepo';


const PROMISE_POOL_SIZE = os.cpus().length;

async function main(): Promise<*> {
  const repoID = process.argv[2];
  if (!repoID) {
    throw new Error('Need to specify a repo ID.');
  }

  printAction('Connecting to MySQL...');
  const dbConn = await connectToMySQL(envConfig.dbURL);
  printActionResult('Connected.');

  printAction('Connecting to RabbitMQ...');
  const queueConn = await genConnectToServer(envConfig.queueURL);
  printActionResult('Connected.');

  printAction(`Ensuring repo #${repoID} exists...`);
  const vc = ViewerContext.getScriptViewerContext(dbConn, queueConn);
  const repo = await EntRepository.genNullable(vc, repoID);
  if (!repo) {
    throw new Error(`Cannot fetch repo (id: ${repoID})`);
  }
  printActionResult('Indeed it does.');

  try {
    printAction('Cloning and compiling repo...');
    const {
      components: compiledComponents,
    } = await genCompileRepo(
      repo,
      {
        jsonpCallback: 'componentOnLoad',
        childSpawnPoolSize: PROMISE_POOL_SIZE,
        onComponentCompiledCallback: compiledComponent =>
          printActionResult(`Compiled ${compiledComponent.relativeFilepath}`),
      },
    );
    printActionResult(`Compiled ${compiledComponents.length} components.`);

    if (compiledComponents.length > 0) {
      const {totalLOC, totalBytes} =
        getCompiledComponentsLOC(compiledComponents);
      printActionResult(
        `Produced a total of ${totalLOC} lines of code, ${filesize(totalBytes)}.`
      );
    }

    printAction('Saving compiled components to database...');
    await genSaveCompiledRepo(
      repo,
      compiledComponents,
      {
        concurrency: PROMISE_POOL_SIZE,
        deleteOldComponents: true,
        onComponentSaved: (component, isNew) =>
          printActionResult(
            `Saved ${isNew ? 'new' : 'existing'} ${component.getFilepath()} as component ID #${component.getID()}`
          ),
        onComponentToBeDeleted: component =>
          printActionResult(
            `Deleting out-of-date component ${component.getID()}`
          ),
      },
    );

    printActionResult('Saved.');
  }
  finally {
    cleanupMySQLConnection(dbConn);
    await genDisconnectFromServer(queueConn);
  }
}

main().catch(err => printError(err));
