/** @flow */

import request from 'request-promise-native';

export const GITHUB_SCOPE = 'repo write:repo_hook';

const GITHUB_USER_AGENT = 'styledash';

function transformGitHubRequestToIncludeScope(
  body,
  response,
  resolveWithFullResponse,
) {
  const scope = response.headers['x-oauth-scopes'];
  return {
    scope,
    body,
  };
}

export async function genGitHubRequest(
  path: string,
  accessToken: string,
  method: string = 'GET',
  params: ?Object = null,
): Promise<{scope: string, body: Object}> {
  return await request({
    url: 'https://api.github.com' + path,
    method,
    headers: {
      'Authorization': 'token ' + accessToken,
      'User-Agent': GITHUB_USER_AGENT,
    },
    json: true,
    body: params,
    transform: transformGitHubRequestToIncludeScope,
  });
}
