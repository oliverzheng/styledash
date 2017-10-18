/** @flow */

import invariant from 'invariant';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntRepository from './EntRepository';
import EntUser from './EntUser';
import EntGitHubRepositoryToken from './EntGitHubRepositoryToken';
import { genGitHubUserRepos } from '../server/github';

let githubTokenPrivacy;

export default class EntGitHubToken extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'github_token',
      defaultColumnNames: [
        'id',
        'user_id',
        'github_user_id',
        'github_user',
        'token',
        'scopes',
        'added_timestamp',
        'modified_timestamp',
        'last_used_timestamp',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
        'user_id',
        'github_user_id',
      ],
      foreignKeys: {
        'user_id': {
          referenceEnt: EntUser,
          onDelete: 'cascade',
        },
      },
      typeName: 'github_token',
      privacy: githubTokenPrivacy,
    };
  }

  static async genForViewer(
    vc: ViewerContext,
  ): Promise<?this> {
    return (await this.genWhere(vc, 'user_id', vc.getUserIDX()))[0];
  }

  static async genCreateToken(
    vc: ViewerContext,
    githubUserID: number,
    githubUser: string,
    token: string,
    scope: string,
  ): Promise<EntGitHubToken> {
    const tokenID = await this._genCreate(
      vc,
      {
        'user_id': vc.getUserIDX(),
        'github_user_id': githubUserID,
        'github_user': githubUser,
        'token': token,
        'scopes': scope,
        'added_timestamp': Math.round((new Date()).getTime() / 1000),
        'modified_timestamp': Math.round((new Date()).getTime() / 1000),
      },
    );
    // TODO add repositoryTokens for all repos the user is a collab of
    return await this.genEnforce(vc, tokenID);
  }

  static async genSetTokenForUser(
    vc: ViewerContext,
    githubUserID: number,
    githubUser: string,
    token: string,
    scope: string,
  ): Promise<EntGitHubToken> {
    const existingToken =
      (await this.genWhere(vc, 'user_id', vc.getUserIDX()))[0];

    if (existingToken && existingToken.getGitHubUserID() === githubUserID) {
      await existingToken._genMutate(
        {
          'github_user': githubUser,
          'token': token,
          'scopes': scope,
        },
      );
      // TODO just put this into genMutate :|
      existingToken._data['github_user'] = githubUser;
      existingToken._data['token'] = token;
      existingToken._data['scopes'] = scope;
      return existingToken;

    } else {
      if (existingToken) {
        await existingToken.genDelete();
      }

      return this.genCreateToken(vc, githubUserID, githubUser, token, scope);
    }
  }

  static async genFindTokenForRepository(
    repo: EntRepository,
  ): Promise<?this> {
    const githubRepoID = repo.getGitHubRepoID();
    invariant(
      githubRepoID,
      'Must have a github repo ID to be able to get a github token',
    );

    const repoTokens = await
      EntGitHubRepositoryToken.genRepositoryTokensForGitHubRepoID(
        repo.getViewerContext(),
        githubRepoID,
      );
    // TODO how does token expiration work with this?
    const firstToken = repoTokens[0];
    if (!firstToken) {
      return null;
    }

    return await firstToken.genGitHubToken();
  }

  getUserID(): string {
    return this._getIDData('user_id');
  }

  getGitHubUserID(): number {
    return this._getNumberData('github_user_id');
  }

  getGitHubUser(): string {
    return this._getStringData('github_user');
  }

  getToken(): string {
    return this._getStringData('token');
  }

  // TODO graphql resolvers
  user() { return this.getGitHubUser(); }
  hasAllRequiredScope() { return true; /* TODO */ }
  githubRepos() { return genGitHubUserRepos(this.getToken()); }
}

BaseEnt.registerEnt(EntGitHubToken);

githubTokenPrivacy = (({
  async genCanViewerSee(obj: EntGitHubToken): Promise<boolean> {
    const vc = obj.getViewerContext();
    if (vc.isAllPowerful()) {
      return true;
    }
    return vc.getUserID() === obj.getUserID();
  },
  async genCanViewerMutate(obj: EntGitHubToken): Promise<boolean> {
    const vc = obj.getViewerContext();
    return vc.getUserID() === obj.getUserID();
  },
  async genCanViewerDelete(obj: EntGitHubToken): Promise<boolean> {
    const vc = obj.getViewerContext();
    return vc.getUserID() === obj.getUserID();
  },
  async genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    if (vc.isAllPowerful()) {
      return true;
    }
    return vc.getUserIDX() === data['user_id'];
  },
}): PrivacyType<EntGitHubToken>);
