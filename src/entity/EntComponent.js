/** @flow */

import invariant from 'invariant';

import BaseEnt, { type EntConfig } from './BaseEnt';
import EntRepository from './EntRepository';

export default class EntComponent extends BaseEnt {
  static _getEntConfig(): EntConfig {
    return {
      tableName: 'component',
      defaultColumnNames: [
        'id',
        'name',
        'repository_id',
        'filepath',
      ],
      extendedColumnNames: [
        'compiled_bundle',
        'react_doc',
        'override_react_doc',
      ],
      immutableColumnNames: [
        'id',
        'repository_id',
      ],
      typeName: 'component',
    };
  }

  getName(): string {
    return this._getStringData('name');
  }

  getRepositoryID(): string {
    return this._getIDData('repository_id');
  }

  getFilepath(): string {
    return this._getStringData('filepath');
  }

  async genRepository(): Promise<EntRepository> {
    return await EntRepository.genEnforce(
      this.getViewerContext(),
      this.getRepositoryID(),
    );
  }

  getCompiledBundleURI(): string {
    return `/component/${this.getID()}/bundle.js`;
  }

  async genReactDoc(): Promise<string> {
    const doc = await this._genExtendedColumnValue('react_doc');
    invariant(typeof doc === 'string', 'Must be a string');
    return doc;
  }

  async genOverrideReactDoc(): Promise<?string> {
    const doc = await this._genExtendedColumnValue('override_react_doc');
    if (doc == null) {
      return doc;
    }
    invariant(typeof doc === 'string', 'Must be a string');
    return doc;
  }

  async genCompiledBundle(): Promise<string> {
    const bundle = await this._genExtendedColumnValue('compiled_bundle');
    invariant(typeof bundle === 'string', 'Must be a string');
    return bundle;
  }

  // Mutations

  async genSetOverrideReactDoc(override: string): Promise<boolean> {
    const res = await this.constructor._genMutate(
      this.getViewerContext(),
      this.getID(),
      {override_react_doc: override},
    );

    // TODO pull this into the mutator once we have object caching
    this._data['override_react_doc'] = override;

    return res;
  }

  /* TODO (graphql resolver) */
  name() { return this.getName(); }
  componentID() { return this.getID(); }
  filepath() { return this.getFilepath(); }
  repository() { return this.genRepository(); }
  compiledBundleURI() { return this.getCompiledBundleURI(); }
  reactDoc() { return this.genReactDoc(); }
  overrideReactDoc() { return this.genOverrideReactDoc(); }
}
