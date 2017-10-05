/** @flow */

import os from 'os';

import envConfig from './envConfig';
import {
  connectToMySQL,
  cleanupMySQLConnection,
} from './storage/mysql';
import {
  genConnectToServer,
  genDisconnectFromServer,
} from './storage/queue';
import ViewerContext from './entity/vc';
import {
  genListenToRepoCompilationQueueMessages,
  type CompileRepoQueueListenerParams,
} from './compile/compileRepoQueue';
import genCompileRepo from './compile/genCompileRepo';
import genSaveCompiledRepo from './compile/genSaveCompiledRepo';
import {
  printAction,
  printActionResult,
  printError,
} from './consoleUtil';

const SPAWN_POOL_SIZE = os.cpus().length;

async function genProcessMessage(
  params: CompileRepoQueueListenerParams,
): Promise<void> {
  const {
    repo,
    messageProcessedCallback,
  } = params;

  const startTime = (new Date()).getTime();
  printAction(`Refreshing and compiling repo ${repo.getID()}.`);

  try {
    const {
      components,
      commitHash,
    } = await genCompileRepo(
      params.repo,
      {
        jsonpCallback: 'componentOnLoad',
        childSpawnPoolSize: SPAWN_POOL_SIZE,
      },
    );

    printActionResult('Saving compiled components to database.');
    await genSaveCompiledRepo(
      repo,
      commitHash,
      components,
      {
        concurrency: SPAWN_POOL_SIZE,
        deleteOldComponents: true,
      },
    );

    const endTime = (new Date()).getTime();
    printActionResult(`Completed in ${(endTime - startTime) / 1000} seconds`);
  }
  catch (err) {
    printError(err);
  }

  // Mark this as processed either way. If we couldn't get it this time, we
  // probably won't be able to on another try.
  messageProcessedCallback();
}

async function main() {
  printAction('Starting compile worker.');

  printAction('Connecting to MySQL...');
  const dbConn = await connectToMySQL(envConfig.dbURL);
  printActionResult('Connected.');

  printAction('Connecting to RabbitMQ...');
  const queueConn = await genConnectToServer(envConfig.queueURL);
  printActionResult('Connected.');

  const scriptVC = ViewerContext.getScriptViewerContext(dbConn, queueConn);

  let cancelListener = null;
  try {
    cancelListener = await genListenToRepoCompilationQueueMessages(
      scriptVC,
      genProcessMessage,
    );

    printAction('Queue listener setup. Awaiting message...');
  }
  catch (err) {
    printError(err);

    if (cancelListener) {
      cancelListener();
    }
    cleanupMySQLConnection(dbConn);
    await genDisconnectFromServer(queueConn);
  }
}

main();
