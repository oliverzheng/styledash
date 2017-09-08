/** @flow */

import BaseEnt, { type EntConfig } from './BaseEnt';
import EntComponent from './EntComponent';

export default class EntRepository extends BaseEnt {
  static _getEntConfig(): EntConfig {
    return {
      tableName: 'repository',
      defaultColumnNames: [
        'id',
        'name',
        'external_css_url',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
      ],
      typeName: 'repository',
    };
  }

  getName(): string {
    return this._getStringData('name');
  }

  getExternalCSSUrl(): string {
    return this._getStringData('external_css_url');
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
  components() { return this.genComponents(); }
}
