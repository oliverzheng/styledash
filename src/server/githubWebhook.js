/** @flow */

import invariant from 'invariant';

import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';
import getExternalHost from './getExternalHost';
import { genEnqueueRepoCompilation } from '../compile/compileRepoQueue';
import { printAction, printError } from '../consoleUtil';
import { SERVER_GITHUB_WEBHOOK_PATH } from '../clientserver/urlPaths';
import { genGitHubRequest } from './github';

const WEBHOOK_EVENTS = ['push'];

export async function genSetWebhookOnGitHubRepo(
  request: Object,
  accessToken: string,
  githubRepoOwner: string,
  githubRepoName: string,
): Promise<void> {
  const host = getExternalHost(request);
  const webhookUrl = `${host}${SERVER_GITHUB_WEBHOOK_PATH}`;

  const {body: allHooks} = await genGitHubRequest(
    `/repos/${githubRepoOwner}/${githubRepoName}/hooks`,
    accessToken,
  );
  const existingHook = allHooks.filter(
    h => h.config.url === webhookUrl && h.name === 'web'
  )[0];

  const params = {
    config: {
      url: webhookUrl,
      content_type: 'json',
    },
    active: true,
  };

  if (existingHook) {
    const patchParams = {
      ...params,
    };

    const addEvents = [];
    WEBHOOK_EVENTS.forEach(e => {
      if (!existingHook.events.includes(e)) {
        addEvents.push(e);
      }
    });
    if (addEvents.length > 0) {
      patchParams.add_events = addEvents;
    }

    const removeEvents = [];
    existingHook.events.forEach(e => {
      if (!WEBHOOK_EVENTS.includes(e)) {
        removeEvents.push(e);
      }
    });
    if (removeEvents.length > 0) {
      patchParams.remove_events = removeEvents;
    }

    await genGitHubRequest(
      `/repos/${githubRepoOwner}/${githubRepoName}/hooks/${existingHook.id}`,
      accessToken,
      'PATCH',
      patchParams,
    );

  } else {
    await genGitHubRequest(
      `/repos/${githubRepoOwner}/${githubRepoName}/hooks`,
      accessToken,
      'POST',
      {
        name: 'web',
        events: WEBHOOK_EVENTS,
        ...params,
      },
    );
  }
}

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
