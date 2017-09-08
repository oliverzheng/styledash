/** @flow */

import invariant from 'invariant';
import SQL from 'sql-template-strings';

import ViewerContext from './vc';
import {executeSQL} from './mysql';


type EntConfig = {
  tableName: string,
  defaultColumnNames: Array<string>,
  extendedColumnNames: Array<string>,
  immutableColumnNames: Array<string>,
  // used across API boundaries, and thus possibly persistence. Don't change it.
  typeName: string,
};

export class BaseEnt {
  // Child needs to override
  static _getEntConfig(): EntConfig {
    invariant(false, 'NYI');
  }

  _vc: ViewerContext;
  _data: {[columnName: string]: mixed};

  constructor(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ) {
    this._vc = vc;
    this._data = data;
  }

  getViewerContext(): ViewerContext {
    return this._vc;
  }

  getGraphQLID(): string {
    return `${this.constructor.getEntType()}:${this._getIDData('id')}`;
  }

  // TODO (graphql resolver) - this is exposed for graphql. This PR adds custom
  // field resolvers for express graphql. Remove all this crap when it lands.
  // https://github.com/graphql/express-graphql/pull/382
  id(): string { return this.getGraphQLID(); }

  getID(): string {
    return this._getIDData('id');
  }

  _getData(columnName: string): mixed {
    const entConfig = this.constructor._getEntConfig();
    invariant(
      entConfig.defaultColumnNames.indexOf(columnName) !== -1,
      'Column %s is not in the default columns for %s',
      columnName,
      this.constructor.name,
    );
    return this._data[columnName];
  }

  _getStringData(columnName: string): string {
    const data = this._getData(columnName);
    invariant(
      typeof data === 'string',
      'Data for object type %s column %s is not a string',
      this.constructor.getEntType(),
      columnName,
    );
    return data;
  }

  _getNumberData(columnName: string): number {
    const data = this._getData(columnName);
    invariant(
      typeof data === 'number',
      'Data for object type %s column %s is not a number',
      this.constructor.getEntType(),
      columnName,
    );
    return data;
  }

  _getIDData(columnName: string): string {
    return this._getNumberData(columnName).toString();
  }

  // Do not persist this. It's a runtime identifier only, since the code gets
  // mangled.
  static getEntType(): string {
    return this._getEntConfig().typeName;
  }

  static async genWhere(
    vc: ViewerContext,
    columnName: string,
    columnValue: mixed,
  ): Promise<Array<this>> {
    const {
      defaultColumnNames,
      tableName,
    } = this._getEntConfig();

    // Must have the column be in the default, so that when it's fetched, it'll
    // be in the ent's data. Not sure why that property would be useful, but it
    // seems like it'd be good.
    invariant(
      defaultColumnNames.indexOf(columnName) !== -1,
      'Must have %s as a default column',
      columnName,
    );

    const res = await executeSQL(
      vc.getDatabaseConnection(),
      SQL`SELECT `
        .append(defaultColumnNames.join(', '))
        .append(SQL` FROM `)
        .append(tableName)
        .append(SQL` WHERE `)
        .append(columnName)
        .append(SQL`= ${columnValue}`)
    );
    return res.map(row => new this(vc, row));
  }

  static async genNullable(vc: ViewerContext, id: string): Promise<?this> {
    const res = await this.genWhere(vc, 'id', id);
    return res[0];
  }

  static async genEnforce(vc: ViewerContext, id: string): Promise<this> {
    const obj = await this.genNullable(vc, id);
    invariant(
      obj != null,
      'Cannot get Ent of type %s with ID %s',
      this.getEntType(),
      id,
    );
    return obj;
  }

  static async genMutate(
    vc: ViewerContext,
    id: string,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    const {
      tableName,
      defaultColumnNames,
      extendedColumnNames,
      immutableColumnNames,
    } = this._getEntConfig();

    const validMutationColumns = {};
    defaultColumnNames.forEach(c => {
      if (immutableColumnNames.indexOf(c) === -1) {
        validMutationColumns[c] = true;
      }
    });
    extendedColumnNames.forEach(c => {
      if (immutableColumnNames.indexOf(c) === -1) {
        validMutationColumns[c] = true;
      }
    });

    Object.keys(data).forEach(c => {
      invariant(
        validMutationColumns[c],
        'Mutation data for type %s id %s is not valid for column %s',
        this.getEntType(),
        id,
        c,
      );
    });

    const sql = SQL`UPDATE `
      .append(tableName)
      .append(SQL` SET `);
    Object.keys(data).forEach((column, i) => {
      if (i !== 0) {
        sql.append(SQL`,`);
      }
      const value = data[column];
      sql
        .append(column)
        .append(SQL` = ${value} `);
    });
    sql.append(SQL` WHERE id = ${id}`);

    const res = await executeSQL(vc.getDatabaseConnection(), sql);
    return true;
  }

  async _genExtendedColumnValue(columnName: string): Promise<mixed> {
    const {tableName} = this.constructor._getEntConfig();
    const res = await executeSQL(
      this.getViewerContext().getDatabaseConnection(),
      SQL`SELECT `
        .append(columnName)
        .append(SQL` FROM `)
        .append(tableName)
        .append(SQL` WHERE id = ${this.getID()}`)
    );
    invariant(
      res.length > 0,
      'Object of type %s and ID %s no longer exists',
      this.constructor.getEntType(),
      this.getID(),
    );
    return res[0][columnName];
  }
}

export class EntRepository extends BaseEnt {
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

export class EntComponent extends BaseEnt {
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
    const res = await this.constructor.genMutate(
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
