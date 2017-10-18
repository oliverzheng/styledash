/** @flow */

import url from 'url';
import nullthrows from 'nullthrows';
import jwt from 'jsonwebtoken';
import invariant from 'invariant';
import GitHubOAuth from 'github-oauth';

import ViewerContext from '../entity/vc';
import EntGitHubToken from '../entity/EntGitHubToken';
import envConfig from '../envConfig';
import {printError} from '../consoleUtil';
import {
  genGitHubRequest,
  GITHUB_SCOPE,
} from './github';

function getGitHubOauth(
  req: Object,
  callbackURL: string,
  state: string,
) {
  return GitHubOAuth({
    githubClient: nullthrows(envConfig.github.clientID),
    githubSecret: nullthrows(envConfig.github.clientSecret),
    baseURL: url.format({
      protocol: req.protocol,
      host: req.get('host'),
    }),
    callbackURI: callbackURL,
    scope: GITHUB_SCOPE,
    state,
  });
}

async function genLoggedInGitHubUser(
  accessToken: string,
): Promise<{
  scope: string,
  userID: number,
  user: string,
}> {
  const res = await genGitHubRequest(
    '/user',
    accessToken,
  );

  const {body} = res;
  invariant(!Array.isArray(body), 'Must be object');

  return {
    userID: body.id,
    user: body.login,
    scope: res.scope,
  };
}

async function genSaveGitHubToken(
  vc: ViewerContext,
  accessToken: string,
): Promise<void> {
  const {userID, user, scope} = await genLoggedInGitHubUser(accessToken);
  await EntGitHubToken.genSetTokenForUser(
    vc,
    userID,
    user,
    accessToken,
    scope,
  );
}

export function githubLoginRedirect(callbackURL: string) {
  return (req: Object, res: Object) => {
    const vc = req.vc;
    invariant(vc instanceof ViewerContext, 'No VC');

    // Our token is different each time
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    const state = jwt.sign(
      { userID: vc.getUserIDX() },
      envConfig.server.cookieSecret,
    );
    const oauth = getGitHubOauth(req, callbackURL, state);
    return oauth.login(req, res);
  };
}

export function githubCallback(
  callbackURL: string,
  redirectURL: string,
) {
  return (req: Object, res: Object) => {
    const vc = req.vc;
    invariant(vc instanceof ViewerContext, 'No VC');

    const { state } = req.query;
    let userID;
    try {
      userID = jwt.verify(state, envConfig.server.cookieSecret).userID;
    } catch (err) {
      printError('Failed to verify JWT state in github oauth callback');
      printError(err);
      res.status(400).send();
      throw err;
    }
    invariant(typeof userID === 'string', 'User ID must be a string');
    invariant(
      userID === vc.getUserIDX(),
      'User ID must be equal to logged in user',
    );

    const oauth = getGitHubOauth(req, callbackURL, state);
    oauth.callback(req, res, (err, oauthBody) => {
      if (err) {
        printError('Failed to get github token: ' + JSON.stringify(err.body));
        res.status(400).send();
        return;
      }
      if (oauthBody.error) {
        printError(
          'Failed to get valid github token: '
            + oauthBody.error
            + ': '
            + oauthBody.error_description
        );
        res.status(400).send();
        return;
      }
      const {
        access_token: accessToken,
        token_type: tokenType,
      } = oauthBody;
      if (!accessToken || tokenType !== 'bearer') {
        printError(
          'Failed to get valid github access token: ' + JSON.stringify(oauthBody)
        );
        res.status(400).send();
        return;
      }

      genSaveGitHubToken(vc, accessToken).then(
        () => res.redirect(redirectURL),
      );
    });
  };
}
