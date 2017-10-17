/** @flow */

import request from 'request-promise-native';

export const GITHUB_SCOPE = 'repo write:repo_hook';

const GITHUB_USER_AGENT = 'styledash';

export type GitHubResponseTokenScope = {
  scope: string,
};

function transformGitHubRequestToIncludeScope(
  body,
  response,
  resolveWithFullResponse,
) {
  const scope = response.headers['x-oauth-scopes'];
  return {
    ...body,
    scope,
  };
}

export async function genGitHubRequest(
  path: string,
  accessToken: string,
): Promise<Object> {
  return await request({
    url: 'https://api.github.com' + path,
    headers: {
      'Authorization': 'token ' + accessToken,
      'User-Agent': GITHUB_USER_AGENT,
    },
    json: true,
    transform: transformGitHubRequestToIncludeScope,
  });
}
