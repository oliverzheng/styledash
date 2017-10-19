/** @flow */

import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';
import EntGitHubRepositoryToken from '../entity/EntGitHubRepositoryToken';

async function genDeleteRepositoryToken(
  vc: ViewerContext,
  githubRepoID: number,
): Promise<void> {
  // TODO Manually remove token for the repo. This should be done as a cascading
  // delete in EntGitHubRepositoryToken
  // Only delete tokens where the token is the viewer's, and the viewer is not
  // part of any repo that uses this github repo.
  const otherRepos = await
    EntRepository.genFromGitHubRepoID(vc, githubRepoID);
  if (otherRepos.length > 0) {
    return;
  }

  const repoTokens =
    await EntGitHubRepositoryToken.genRepositoryTokensForGitHubRepoID(
      vc,
      githubRepoID,
    );
  const repoTokensWithTokens = await Promise.all(
    repoTokens.map(async (repoToken) => {
      const token = await repoToken.genGitHubToken();
      return {
        repoToken,
        token,
      };
    })
  );
  const userRepoTokens = repoTokensWithTokens.filter(
    t => t.token && t.token.getUserID() === vc.getUserIDX()
  );
  await Promise.all(
    userRepoTokens.map(t => t.repoToken.genDelete())
  );
}

async function genRemoveGitHubWebhook(
  vc: ViewerContext,
  githubRepoID: number,
): Promise<void> {
  // Remove github webhook if we are the last repo to be deleted
  const githubRepoCount =
    await EntRepository.genGitHubRepoIDCount(vc, githubRepoID);
  if (githubRepoCount > 0) {
    return;
  }

  // TODO
  // do we need need the admin:webhook github scope here?
}

export default async function genDeleteRepository(
  repo: EntRepository,
): Promise<void> {
  const vc = repo.getViewerContext();
  const githubRepoID = repo.getGitHubRepoID();

  // This will blow up if viewer does not have permissions
  await repo.genDelete();

  if (githubRepoID) {
    await Promise.all([
      genDeleteRepositoryToken(vc, githubRepoID),
      genRemoveGitHubWebhook(vc, githubRepoID),
    ]);
  }
}
