/** @flow */

import request from 'request-promise-native';
import invariant from 'invariant';

import GitHubRepo from '../entity/GitHubRepo';

export const GITHUB_SCOPE = 'repo write:repo_hook';

const GITHUB_USER_AGENT = 'styledash';

function transformGitHubRequestToIncludeScope(
  body,
  response,
  resolveWithFullResponse,
) {
  const scope = response.headers['x-oauth-scopes'];
  const link = response.headers['link'];
  return {
    scope,
    link,
    body,
  };
}

function getNextLink(header: ?string): ?string {
  if (!header) {
    return null;
  }

  // In the format of
  // <https://api.github.com/user/repos?page=2>; rel="next", <https://api.github.com/user/repos?page=2>; rel="last"

  const links = header.split(',').map(l => l.trim());
  for (let i = 0; i < links.length; ++i) {
    const link = links[i];
    const [firstPart, secondPart] = link.split(';').map(s => s.trim());
    if (secondPart === 'rel="next"') {
      return firstPart.substring(1, firstPart.length - 1);
    }
  }

  return null;
}

export async function genGitHubRequest(
  path: string,
  accessToken: string,
  method: string = 'GET',
  params: ?Object = null,
  followNextLinks: boolean = false,
): Promise<{scope: string, body: Object | Array<Object>}> {
  let nextLink = 'https://api.github.com' + path;
  let result;
  do {
    const currentResult = await request({
      url: nextLink,
      method,
      headers: {
        'Authorization': 'token ' + accessToken,
        'User-Agent': GITHUB_USER_AGENT,
      },
      json: true,
      body: params,
      transform: transformGitHubRequestToIncludeScope,
    });
    nextLink = getNextLink(currentResult.link);

    if (result || nextLink) {
      if (!result) {
        result = {
          scope: currentResult.scope,
          body: [],
        };
      }

      const body = currentResult.body;
      invariant(Array.isArray(body), 'Body must be array to have next links');
      result.body.push(...body);

    } else {
      result = currentResult;
    }
  } while (nextLink && followNextLinks);

  return result;
}

export async function genGitHubUserRepos(
  accessToken: string,
): Promise<Array<GitHubRepo>> {
  const {body} = await genGitHubRequest(
    '/user/repos',
    accessToken,
    'GET',
    null,
    true, // followNextLinks
  );
  return body.map(
    item => new GitHubRepo(item.id, item.owner.login, item.name)
  );
}
