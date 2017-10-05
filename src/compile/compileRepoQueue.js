/** @flow */

import {
  genSendMessageToQueue,
  genAddListenerToQueue,
  genRemoveListenerFromQueue,
} from '../storage/queue';
import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';
import {
  printError,
} from '../consoleUtil';

// Be careful when modifying this. When code is deployed, existing messages in
// the queue are not updated. This needs to be backwards compatible.
export type CompileRepoQueueListenerParams = {
  repo: EntRepository,
  messageProcessedCallback: () => any,
};

// Returns a function to stop listening
export async function genListenToRepoCompilationQueueMessages(
  vc: ViewerContext,
  listener: (params: CompileRepoQueueListenerParams) => any,
): Promise<() => void> {
  const listenerToken = await genAddListenerToQueue(
    vc.getQueueConnection(),
    'compileRepo',
    async (msg, done) => {
      const repoID = msg.repositoryID;
      if (typeof repoID !== 'string') {
        // Can't do anything about this. Dropping it.
        printError(
          `Compile repo message invalid - no repoID: ${JSON.stringify(msg)}`
        );
        return done();
      }

      const repo = await EntRepository.genNullable(vc, repoID);
      if (!repo) {
        printError(`Trying to compile repo ${repoID} that cannot be genned`);
        return done();
      }

      listener({
        repo,
        messageProcessedCallback: done,
      });
    },
  );

  return () => {
    genRemoveListenerFromQueue(vc.getQueueConnection(), listenerToken);
  };
}

export async function genEnqueueRepoCompilation(
  repo: EntRepository,
): Promise<void> {
  await genSendMessageToQueue(
    repo.getViewerContext().getQueueConnection(),
    'compileRepo',
    {
      repositoryID: repo.getID(),
    },
  );
}
