/** @flow */

import SQL from 'sql-template-strings';
import invariant from 'invariant';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntRepositoryPermission from './EntRepositoryPermission';
import EntComponent from './EntComponent';
import EntRepositoryCompilation from './EntRepositoryCompilation';

let repoPrivacy;

export default class EntRepository extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'repository',
      defaultColumnNames: [
        'id',
        'name',
        'external_css_url',
        'root_css',
        'last_updated_timestamp',
        'github_repo_id',
        'github_username',
        'github_repo',
        'github_branch',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
        'github_repo_id',
      ],
      typeName: 'repository',
      privacy: repoPrivacy,
    };
  }

  static async genCreate(
    vc: ViewerContext,
    name: string,
    githubRepoID: number,
    githubUsername: ?string,
    githubRepo: ?string,
    rootCSS: ?string,
  ): Promise<EntRepository> {
    const repoID = await this._genCreate(
      vc,
      {
        'name': name,
        'github_repo_id': githubRepoID,
        'github_username': githubUsername,
        'github_repo': githubRepo,
        'root_css': rootCSS,
        'last_updated_timestamp': Math.round((new Date()).getTime() / 1000),
      },
    );

    await EntRepositoryPermission.genCreate(
      vc,
      repoID,
      EntRepositoryPermission.ADMIN,
    );

    return await this.genEnforce(vc, repoID);
  }

  static async genForViewer(vc: ViewerContext): Promise<Array<this>> {
    const perms = await EntRepositoryPermission.genAllForViewer(
      vc,
      [
        EntRepositoryPermission.READ_WRITE,
        EntRepositoryPermission.ADMIN,
      ],
    );
    return await Promise.all(
      perms.map(
        perm => this.genEnforce(vc, perm.getRepositoryID())
      ),
    );
  }

  static async genFromGitHubRepoID(
    vc: ViewerContext,
    githubRepoID: number,
  ): Promise<Array<this>> {
    return await this.genWhere(vc, 'github_repo_id', githubRepoID);
  }

  static async genGitHubRepoIDCount(
    vc: ViewerContext,
    githubRepoID: number,
  ): Promise<number> {
    const count = await this.genAggregateSQLWithoutPrivacy(
      vc,
      SQL`count(1)`,
      { 'github_repo_id': githubRepoID },
    );
    invariant(typeof count === 'number', 'Must be a number');
    return count;
  }

  getName(): string {
    return this._getStringData('name');
  }

  getExternalCSSUrl(): ?string {
    return this._getNullableStringData('external_css_url');
  }

  getRootCSS(): ?string {
    return this._getNullableStringData('root_css');
  }

  getLastUpdatedTimestamp(): number {
    return this._getNumberData('last_updated_timestamp');
  }

  getGitHubRepoID(): ?number {
    return this._getNullableNumberData('github_repo_id');
  }

  getGitHubUsername(): ?string {
    return this._getNullableStringData('github_username');
  }

  getGitHubRepo(): ?string {
    return this._getNullableStringData('github_repo');
  }

  getGitHubBranch(): ?string {
    return this._getNullableStringData('github_branch');
  }

  // TODO at some point, make entquery
  async genComponentsCount(): Promise<number> {
    return await EntComponent.genComponentsCountForRepository(
      this.getViewerContext(),
      this.getID(),
    );
  }

  async genComponents(): Promise<Array<EntComponent>> {
    return await EntComponent.genDefaultExportComponentsInRepository(
      this.getViewerContext(),
      this.getID(),
    );
  }

  async genCurrentRepositoryCompilation(): Promise<?EntRepositoryCompilation> {
    return (await EntRepositoryCompilation.genForRepository(this))[0];
  }
}

BaseEnt.registerEnt(EntRepository);

repoPrivacy = (({
  async genCanViewerSee(obj: EntRepository): Promise<boolean> {
    return await EntRepositoryPermission.genDoesViewerHaveAnyPermission(
      obj.getViewerContext(),
      obj.getID(),
    );
  },

  async genCanViewerMutate(obj: EntRepository): Promise<boolean> {
    return await EntRepositoryPermission.genIsViewerAdmin(
      obj.getViewerContext(),
      obj.getID(),
    );
  },

  async genCanViewerDelete(obj: EntRepository): Promise<boolean> {
    return await EntRepositoryPermission.genIsViewerAdmin(
      obj.getViewerContext(),
      obj.getID(),
    );
  },

  async genCanViewerCreate(vc: ViewerContext): Promise<boolean> {
    // TODO this will depend on billing/pricing of some kind at some point
    return true;
  },
}): PrivacyType<EntRepository>);
