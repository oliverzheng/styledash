/** @flow */

import invariant from 'invariant';
import SQL from 'sql-template-strings';

import ViewerContext from './vc';
import {executeSQL} from '../storage/mysql';

export type EntConfig<EntType> = {
  tableName: string,
  defaultColumnNames: Array<string>,
  extendedColumnNames: Array<string>,
  immutableColumnNames: Array<string>,
  // used across API boundaries, and thus possibly persistence. Don't change it.
  typeName: string,
  privacy: PrivacyType<EntType>,
};

export type PrivacyType<EntType> = {
  genCanViewerSee(obj: EntType): Promise<boolean>,
  genCanViewerMutate(obj: EntType): Promise<boolean>,
  // TODO use delete in mutators
  genCanViewerDelete(obj: EntType): Promise<boolean>,
  genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean>,
};

export default class BaseEnt {
  // Child needs to override
  static _getEntConfig(): EntConfig<this> {
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
    return await this.genWhereMulti(vc, {[columnName]: columnValue});
  }

  static async genWhereMulti(
    vc: ViewerContext,
    where: {[columnName: string]: mixed/*columnValues*/},
  ): Promise<Array<this>> {
    const {
      defaultColumnNames,
      tableName,
      privacy,
    } = this._getEntConfig();

    // Must have the column be in the default, so that when it's fetched, it'll
    // be in the ent's data. Not sure why that property would be useful, but it
    // seems like it'd be good.
    Object.keys(where).forEach(columnName =>
      invariant(
        defaultColumnNames.indexOf(columnName) !== -1,
        'Must have %s as a default column',
        columnName,
      )
    );

    const sql = SQL`SELECT `
      .append(defaultColumnNames.join(', '))
      .append(SQL` FROM `)
      .append(tableName)
      .append(SQL` WHERE `);

    Object.keys(where).forEach((columnName, i) => {
      if (i !== 0) {
        sql.append(SQL` AND `);
      }
      sql
        .append(columnName)
        .append(SQL`= ${where[columnName]}`);
    });

    const res = await executeSQL(vc.getDatabaseConnection(), sql);
    const entsWithoutPrivacy = res.map(row => new this(vc, row));
    const entsWithPrivacy = await Promise.all(
      entsWithoutPrivacy.map(
        async (ent) => {
          const canSee = await privacy.genCanViewerSee(ent);
          return canSee ? ent : null;
        },
      ),
    );
    return entsWithPrivacy.filter(ent => ent);
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

  async _genMutate(
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    const {
      tableName,
      defaultColumnNames,
      extendedColumnNames,
      immutableColumnNames,
      privacy,
    } = this.constructor._getEntConfig();

    invariant(
      await privacy.genCanViewerMutate(this),
      'Viewer cannot mutate obj',
    );

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
        this.constructor.getEntType(),
        this.getID(),
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
    sql.append(SQL` WHERE id = ${this.getID()}`);

    const res = await executeSQL(
      this.getViewerContext().getDatabaseConnection(),
      sql,
    );
    return true;
  }

  // Returns the new obj's ID
  static async _genCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<string> {
    const {
      tableName,
      defaultColumnNames,
      extendedColumnNames,
      privacy,
    } = this._getEntConfig();

    invariant(
      await privacy.genCanViewerCreate(vc, data),
      'Viewer cannot create obj',
    );

    const validMutationColumns = {};
    defaultColumnNames.forEach(c => validMutationColumns[c] = true);
    extendedColumnNames.forEach(c => validMutationColumns[c] = true);

    Object.keys(data).forEach(c => {
      invariant(
        validMutationColumns[c],
        'Creation data for type %s is not valid for column %s',
        this.getEntType(),
        c,
      );
    });

    const sql = SQL`INSERT INTO `
      .append(tableName)
      .append(SQL` (`);
    Object.keys(data).forEach((column, i) => {
      if (i !== 0) {
        sql.append(SQL`,`);
      }
      sql.append(column)
    });
    sql.append(SQL`) VALUES (`);
    Object.keys(data).forEach((column, i) => {
      if (i !== 0) {
        sql.append(SQL`,`);
      }
      const value = data[column];
      sql.append(SQL`${value}`);
    });
    sql.append(SQL`)`);

    const res = await executeSQL(vc.getDatabaseConnection(), sql);
    return res.insertId.toString();
  }

  static async _genColumnValues(
    vc: ViewerContext,
    columnNames: Array<string>,
    indexColumnValue: string,
    indexColumnName: string = 'id',
  ): Promise<?{[columnName: string]: mixed}> {
    const {tableName} = this._getEntConfig();

    const sql = SQL`SELECT `;
    columnNames.forEach((columnName, i) => {
      if (i !== 0) {
        sql.append(SQL`,`);
      }
      sql.append(columnName);
    });
    sql
      .append(SQL` FROM `)
      .append(tableName)
      .append(SQL` WHERE `)
      .append(indexColumnName)
      .append(SQL` = ${indexColumnValue}`);
    const res = await executeSQL(vc.getDatabaseConnection(), sql);
    if (res.length === 0) {
      return null;
    }
    return res[0];
  }

  async _genExtendedColumnValue(columnName: string): Promise<mixed> {
    const values = await this.constructor._genColumnValues(
      this.getViewerContext(),
      [columnName],
      this.getID(),
    );
    invariant(values, 'Object has been deleted in the db');
    return values[columnName];
  }
}
