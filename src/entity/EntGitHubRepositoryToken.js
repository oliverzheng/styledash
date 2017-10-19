/** @flow */

import invariant from 'invariant';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
  genDeferCanSeePrivacyTo,
  genDeferCanMutatePrivacyTo,
} from './BaseEnt';
import EntGitHubToken from './EntGitHubToken';

let githubRepositoryTokenPrivacy;

export default class EntGitHubRepositoryToken extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'github_repository_token',
      defaultColumnNames: [
        'id',
        'github_repo_id',
        'github_token_id',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
        'github_repo_id',
        'github_token_id',
      ],
      foreignKeys: {
        'github_token_id': {
          referenceEnt: EntGitHubToken,
          onDelete: 'cascade',
        },
        // TODO also have this, so when a repo is deleted, all the rows for this
        // are deleted as well.
        /*
        'github_repo_id': {
          referenceEnt: EntRepository,
          onDelete: 'cascade',
          columnReferenceName: 'github_repo_id',
        },
        */
      },
      typeName: 'github_repository_token',
      privacy: githubRepositoryTokenPrivacy,
    };
  }

  // This is an external ID in the github API
  getGitHubRepoID(): number {
    return this._getNumberData('github_repo_id');
  }

  getGitHubTokenID(): string {
    return this._getIDData('github_token_id');
  }

  async genGitHubToken(): Promise<EntGitHubToken> {
    return await EntGitHubToken.genEnforce(
      this.getViewerContext(),
      this.getGitHubTokenID(),
    );
  }

  // Static helpers

  static async genRepositoryTokensForGitHubRepoID(
    vc: ViewerContext,
    githubRepoID: number,
  ): Promise<Array<this>> {
    return await this.genWhere(
      vc,
      'github_repo_id',
      githubRepoID,
    );
  }

  static async genCreate(
    githubRepoID: number,
    token: EntGitHubToken,
  ): Promise<this> {
    const id = await this._genCreate(
      token.getViewerContext(),
      {
        'github_repo_id': githubRepoID,
        'github_token_id': token.getID(),
      },
    );
    return await this.genEnforce(token.getViewerContext(), id);
  }
}

BaseEnt.registerEnt(EntGitHubRepositoryToken);

githubRepositoryTokenPrivacy = (({
  async genCanViewerSee(obj: EntGitHubRepositoryToken): Promise<boolean> {
    const entToken = await EntGitHubToken.genNullable(
      obj.getViewerContext(),
      obj.getGitHubTokenID(),
    );
    if (!entToken) {
      return false;
    }
    return await genDeferCanSeePrivacyTo(entToken);
  },

  async genCanViewerMutate(obj: EntGitHubRepositoryToken): Promise<boolean> {
    const entToken = await EntGitHubToken.genNullable(
      obj.getViewerContext(),
      obj.getGitHubTokenID(),
    );
    if (!entToken) {
      return false;
    }
    return await genDeferCanMutatePrivacyTo(entToken);
  },

  async genCanViewerDelete(obj: EntGitHubRepositoryToken): Promise<boolean> {
    const entToken = await EntGitHubToken.genNullable(
      obj.getViewerContext(),
      obj.getGitHubTokenID(),
    );
    if (!entToken) {
      return false;
    }
    return await genDeferCanMutatePrivacyTo(entToken);
  },

  async genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    const githubTokenID = data['github_token_id'];
    invariant(
      typeof githubTokenID === 'string',
      'githubTokenID must be a string',
    );

    const entToken = await EntGitHubToken.genNullable(vc, githubTokenID);
    if (!entToken) {
      return false;
    }
    return await genDeferCanMutatePrivacyTo(entToken);
  },
}): PrivacyType<EntGitHubRepositoryToken>);
