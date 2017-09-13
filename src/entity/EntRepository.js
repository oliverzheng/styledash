/** @flow */

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntRepositoryPermission from './EntRepositoryPermission';
import EntComponent from './EntComponent';

const repoPrivacy: PrivacyType<EntRepository> = {
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
};

export default class EntRepository extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'repository',
      defaultColumnNames: [
        'id',
        'name',
        'external_css_url',
        'last_updated_timestamp',
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

  static async genForViewer(vc: ViewerContext): Promise<Array<this>> {
    const perms = await EntRepositoryPermission.genAllForViewer(
      vc,
      EntRepositoryPermission.READ_WRITE,
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

  getExternalCSSUrl(): string {
    return this._getStringData('external_css_url');
  }

  getLastUpdatedTimestamp(): number {
    return this._getNumberData('last_updated_timestamp');
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
  externalCSSUrl() { return this.getExternalCSSUrl(); }
  componentsCount() { return this.genComponentsCount(); }
  components() { return this.genComponents(); }
  lastUpdatedTimestamp() { return this.getLastUpdatedTimestamp(); }
}
