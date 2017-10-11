/** @flow */

import process from 'process';
import os from 'os';

import filesize from 'filesize';

import envConfig from '../envConfig';
import ViewerContext from '../entity/vc';
import EntUser from '../entity/EntUser';
import {
  connectToMySQL,
  cleanupMySQLConnection,
} from '../storage/mysql';
import {
  genConnectToServer,
  genDisconnectFromServer,
} from '../storage/queue';
import EntRepository from '../entity/EntRepository';
import {
  printAction,
  printActionResult,
  printError,
} from '../consoleUtil';
import {
  genHeadCommitHash,
  genVerifyPackageJSON,
  parseComponents,
  genCompileParsedComponents,
  getCompiledComponentsLOC,
} from '../compile/genCompileRepo';
import genSaveCompiledRepo from '../compile/genSaveCompiledRepo';


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

  const userID = process.argv[4];
  if (!userID) {
    throw new Error(
      'Need to specify a userID to grant permissions of new repo to.',
    );
  }

  printAction('Connecting to MySQL...');
  const mysqlConnection = await connectToMySQL(envConfig.dbURL);
  printActionResult('Connected.');

  printAction('Connecting to RabbitMQ...');
  const queueConn = await genConnectToServer(envConfig.queueURL);
  printActionResult('Connected.');

  const vc = new ViewerContext(mysqlConnection, queueConn, userID);

  const user = await EntUser.genNullable(vc, userID);
  if (!user) {
    throw new Error('Invalid user ID');
  }

  try {
    printAction('Getting git commit hash...');
    const commitHash = await genHeadCommitHash(directory);
    printActionResult(`Operating on commit ${commitHash}`);

    printAction('Parsing directory...');
    const components = parseComponents(directory);
    printActionResult(`Parsed ${components.length} components.`);

    printAction(
      `Compiling components with ${PROMISE_POOL_SIZE} concurrent processes...`
    );
    const compiledBundle = await genCompileParsedComponents(
      directory,
      packageJSON,
      components,
      {
        libraryName: 'repositoryBundle',
      },
    );

    const {totalLOC, totalBytes} =
      getCompiledComponentsLOC(compiledBundle);
    printActionResult(
      `Produced a total of ${totalLOC} lines of code, ${filesize(totalBytes)}.`
    );

    printAction('Saving new repo to database...');
    const repo = await EntRepository.genCreate(vc, repoName, 0, null, null);
    const repoID = repo.getID();
    printActionResult(`Saved as repo #${repoID}.`);

    printAction('Saving compiled components to database...');
    await genSaveCompiledRepo(
      repo,
      commitHash,
      components,
      compiledBundle,
      {
        concurrency: PROMISE_POOL_SIZE,
        deleteOldComponents: true, // doesn't matter, it's a new repo
        onComponentSaved: component =>
          printActionResult(
            `Saved ${component.getFilepath()} as component ID #${component.getID()}`
          ),
      },
    );

    printActionResult('Saved.');
  }
  finally {
    cleanupMySQLConnection(mysqlConnection);
    await genDisconnectFromServer(queueConn);
  }
}

main().catch(err => printError(err));
