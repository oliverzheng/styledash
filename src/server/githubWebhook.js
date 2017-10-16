/** @flow */

import invariant from 'invariant';

import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';
import { genEnqueueRepoCompilation } from '../compile/compileRepoQueue';
import { printAction, printError } from '../consoleUtil';

export default function githubWebhook() {
  return (req: Object, res: Object) => {
    const vc = req.vc;
    invariant(vc instanceof ViewerContext, 'No VC');

    const {body} = req;
    invariant(body != null, 'No body');

    const repository = body.repository;
    invariant(repository != null, 'No repository');

    const repositoryID = repository.id;
    invariant(typeof repositoryID === 'number', 'No repository ID');

    (async () => {
      const repos = await EntRepository.genFromGitHubRepoID(vc, repositoryID);

      const repoIDs = repos.map(r => ('#' + r.getID())).join(', ');
      printAction(
        `Webhook for GitHub repo #${repositoryID}, affecting repos: ${repoIDs}`
      );

      await Promise.all(
        repos.map(repo => genEnqueueRepoCompilation(repo))
      );
    })()
      .then(() => res.send())
      .catch(err => {
        printError(err);
        res.status(500).send();
      });
  };
}
