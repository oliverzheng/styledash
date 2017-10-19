/** @flow */

import invariant from 'invariant';

import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';
import EntGitHubToken from '../entity/EntGitHubToken';
import EntGitHubRepositoryToken from '../entity/EntGitHubRepositoryToken';
import { genEnqueueRepoCompilation } from '../compile/compileRepoQueue';
import { genSetWebhookOnGitHubRepo } from '../server/githubWebhook';

export default async function genAddRepository(
  vc: ViewerContext,
  req: Object,
  name: string,
  githubRepoID: number,
  githubRepoOwner: string,
  githubRepoName: string,
  rootCSS: ?string,
): Promise<EntRepository> {
  const entToken = await EntGitHubToken.genForViewer(vc);
  invariant(entToken != null, 'User must have a GitHub token');

  // Create repo first
  const repo = await EntRepository.genCreate(
    vc,
    name,
    githubRepoID,
    githubRepoOwner,
    githubRepoName,
    rootCSS,
  );

  // Add token for the repo
  const repoTokens = await
    EntGitHubRepositoryToken.genRepositoryTokensForGitHubRepoID(
      vc,
      githubRepoID,
    );
  // Only add one if this github repo doesn't yet have the user's token
  // associated with it. It could already have if the user adds the repo twice.
  // This only returns tokens the user can see.
  if (repoTokens.length === 0) {
    await EntGitHubRepositoryToken.genCreate(githubRepoID, entToken);
  }

  // Add github hook
  await genSetWebhookOnGitHubRepo(
    req,
    entToken.getToken(),
    githubRepoOwner,
    githubRepoName,
  );

  // Invoke initial compilation
  await genEnqueueRepoCompilation(repo);

  return repo;
}
