/** @flow */

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntRepository from './EntRepository';
import EntUser from './EntUser';

let githubTokenPrivacy;

export default class EntGitHubToken extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'github_token',
      defaultColumnNames: [
        'id',
        // TODO github access is granted for all of a user's repos. how does
        // this work then?
        'repository_id',
        'user_id',
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
        'repository_id',
        'user_id',
        'id',
      ],
      foreignKeys: {
        'repository_id': {
          referenceEnt: EntRepository,
          onDelete: 'cascade',
        },
        'user_id': {
          referenceEnt: EntUser,
          onDelete: 'cascade',
        },
      },
      typeName: 'github_token',
      privacy: githubTokenPrivacy,
    };
  }

  static async genTokenForRepository(
    repo: EntRepository,
  ): Promise<?string> {
    const tokens = await this.genWhere(
      repo.getViewerContext(),
      'repository_id',
      repo.getID(),
    );
    // TODO figure out which token is still valid
    if (tokens.length > 0) {
      return tokens[0].getToken();
    }
    return null;
  }

  static async genCreateToken(
    vc: ViewerContext,
    repo: EntRepository,
    githubUser: string,
    token: string,
  ): Promise<EntGitHubToken> {
    const tokenID = await this._genCreate(
      vc,
      {
        'repository_id': repo.getID(),
        'user_id': vc.getUserIDX(),
        'github_user': githubUser,
        'token': token,
        'added_timestamp': Math.round((new Date()).getTime() / 1000),
        'modified_timestamp': Math.round((new Date()).getTime() / 1000),
      },
    );
    return await this.genEnforce(vc, tokenID);
  }

  getRepositoryID(): string {
    return this._getIDData('repository_id');
  }

  getUserID(): string {
    return this._getIDData('user_id');
  }

  getGitHubUser(): string {
    return this._getStringData('github_user');
  }

  getToken(): string {
    return this._getStringData('token');
  }
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
