/** @flow */

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntRepositoryPermission from './EntRepositoryPermission';
import EntComponent from './EntComponent';

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
        'github_username',
        'github_repo',
        'github_branch',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
      ],
      typeName: 'repository',
      privacy: repoPrivacy,
    };
  }

  static async genCreate(
    vc: ViewerContext,
    name: string,
    githubUsername: ?string,
    githubRepo: ?string,
  ): Promise<EntRepository> {
    const repoID = await this._genCreate(
      vc,
      {
        name,
        github_username: githubUsername,
        github_repo: githubRepo,
        last_updated_timestamp: Math.round((new Date()).getTime() / 1000),
      },
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
    return await EntComponent.genWhere(
      this.getViewerContext(),
      'repository_id',
      this.getID(),
    );
  }

  /* TODO (graphql resolver) */
  name() { return this.getName(); }
  repositoryID() { return this.getID(); }
  externalCSSURI() { return this.getExternalCSSUrl(); }
  rootCSS() { return this.getRootCSS(); }
  componentsCount() { return this.genComponentsCount(); }
  components() { return this.genComponents(); }
  lastUpdatedTimestamp() { return this.getLastUpdatedTimestamp(); }
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
