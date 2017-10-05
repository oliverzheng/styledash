/** @flow */

import invariant from 'invariant';
import SQL, {SQLStatement} from 'sql-template-strings';

import ViewerContext from './vc';
import {executeSQL, executeSQLTransaction} from '../storage/mysql';

// in the future, support restrict, set null, no action.
type ForeignKeyPropagation =
  'cascade';

export type EntConfig<EntType> = {
  tableName: string,
  defaultColumnNames: Array<string>,
  extendedColumnNames: Array<string>,
  immutableColumnNames: Array<string>,
  // Foreign keys are supported at the application level instead of at the db
  // layer because Skeema doesn't support that.
  // See https://github.com/skeema/skeema/issues/11
  foreignKeys?: ?{
    [columnName: string]: {
      referenceEnt: Class<BaseEnt>,
      onDelete: ForeignKeyPropagation,
      // onUpdate not supported for now since ids are assumed to be immutable.
    },
  },
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

export function genDeferCanSeePrivacyTo<EntType: BaseEnt>(
  obj: EntType,
): Promise<boolean> {
  return obj.constructor._getEntConfig().privacy.genCanViewerSee(obj);
}

export function genDeferCanMutatePrivacyTo<EntType: BaseEnt>(
  obj: EntType,
): Promise<boolean> {
  return obj.constructor._getEntConfig().privacy.genCanViewerMutate(obj);
}

export function genDeferCanDeletePrivacyTo<EntType: BaseEnt>(
  obj: EntType,
): Promise<boolean> {
  return obj.constructor._getEntConfig().privacy.genCanViewerDelete(obj);
}

export function genDeferCanCreatePrivacyTo<EntType: BaseEnt>(
  vc: ViewerContext,
  obj: EntType,
  data: {[columnName: string]: mixed},
): Promise<boolean> {
  return obj.constructor._getEntConfig().privacy.genCanViewerCreate(vc, data);
}


export default class BaseEnt {
  static _allEntClasses: Array<Class<BaseEnt>> = [];

  static getAllEntClasses(): Array<Class<BaseEnt>> {
    return this._allEntClasses;
  }

  static registerEnt(entClass: Class<BaseEnt>): void {
    invariant(
      this._allEntClasses.indexOf(entClass) === -1,
      'Already registered',
    );
    this._allEntClasses.push(entClass);
  }

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

  _getNullableStringData(columnName: string): ?string {
    if (this._getData(columnName) == null) {
      return null;
    }
    return this._getStringData(columnName);
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
    orders: Array<{
      columnName: string,
      ascending: boolean,
    }> = [],
  ): Promise<Array<this>> {
    const {
      defaultColumnNames,
      tableName,
      privacy,
    } = this._getEntConfig();

    const sql = SQL`SELECT `
      .append(defaultColumnNames.join(', '))
      .append(SQL` FROM `)
      .append(tableName)
      .append(SQL` WHERE `);

    this._addWhereToSQL(sql, where);
    this._addOrderByToSQL(sql, orders);

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

  static async genAggregateSQLWithoutPrivacy(
    vc: ViewerContext,
    aggregation: SQLStatement,
    where: {[columnName: string]: mixed/*columnValues*/},
  ): Promise<mixed> {
    const {tableName} = this._getEntConfig();

    // Must have the column be in the default, so that when it's fetched, it'll
    // be in the ent's data. Not sure why that property would be useful, but it
    // seems like it'd be good.
    const sql = SQL`SELECT `
      .append(aggregation)
      .append(SQL` as aggregate FROM `)
      .append(tableName)
      .append(SQL` WHERE `);

    this._addWhereToSQL(sql, where);

    const res = await executeSQL(vc.getDatabaseConnection(), sql);
    return res[0].aggregate;
  }

  static _addWhereToSQL(
    sql: SQLStatement,
    where: {[columnName: string]: mixed/*columnValues*/},
  ): void {
    const {defaultColumnNames} = this._getEntConfig();

    Object.keys(where).forEach(columnName =>
      invariant(
        defaultColumnNames.indexOf(columnName) !== -1,
        'Must have %s as a default column',
        columnName,
      )
    );

    Object.keys(where).forEach((columnName, i) => {
      if (i !== 0) {
        sql.append(SQL` AND `);
      }
      sql.append(columnName);
      const columnValue = where[columnName];
      if (Array.isArray(columnValue)) {
        sql.append(SQL` IN (${columnValue})`);
      } else {
        sql.append(SQL` = ${columnValue}`);
      }
    });
  }

  static _addOrderByToSQL(
    sql: SQLStatement,
    orders: Array<{
      columnName: string,
      ascending: boolean,
    }> = [],
  ): void {
    if (orders.length === 0) {
      return;
    }

    const {defaultColumnNames} = this._getEntConfig();

    orders.forEach(order =>
      invariant(
        defaultColumnNames.indexOf(order.columnName) !== -1,
        'Must have %s as a default column',
        order.columnName,
      )
    );

    orders.forEach((order, i) => {
      if (i === 0) {
        sql.append(SQL` ORDER BY `);
      } else {
        sql.append(SQL`, `);
      }
      sql
        .append(order.columnName)
        .append(order.ascending ? SQL` ASC` : SQL` DESC`);
    });
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


  //// MUTATIONS

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

    await this.constructor._genExecuteCreateOrUpdateSQL(
      this.getViewerContext(),
      data,
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
      typeName,
    } = this._getEntConfig();

    invariant(
      await privacy.genCanViewerCreate(vc, data),
      'Viewer cannot create obj of type %s',
      typeName,
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

    const res = await this._genExecuteCreateOrUpdateSQL(vc, data, sql);
    return res.insertId.toString();
  }

  // Ensures foreign keys are valid
  // TODO add some god damn tests for this please
  static async _genExecuteCreateOrUpdateSQL(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
    sql: SQLStatement,
  ): Promise<Object> {
    const {foreignKeys} = this._getEntConfig();

    const foreignKeyChecks: Array<{
      ent: Class<BaseEnt>,
      id: string,
    }> = [];

    if (foreignKeys) {
      Object.keys(data).forEach(columnName => {
        const foreignKey = foreignKeys[columnName];
        if (foreignKey) {
          const foreignID = data[columnName];
          invariant(
            typeof foreignID === 'string',
            'Foreign id must be a string',
          );
          foreignKeyChecks.push({
            ent: foreignKey.referenceEnt,
            id: foreignID,
          });
        }
      });
    }

    if (foreignKeyChecks.length === 0) {
      return await executeSQL(vc.getDatabaseConnection(), sql);
    } else {
      const statements = foreignKeyChecks.map((check, i) => {
        return previousResult => {
          if (
            i !== 0 &&
            (!previousResult || previousResult.length === 0)
          ) {
            return { action: 'rollback' };
          }

          const entConfig = check.ent._getEntConfig();
          return {
            action: 'executeSQL',
            sql: SQL`SELECT id from `
              .append(entConfig.tableName)
              // Lock the row so it must exist after this mutation. Whatever
              // deletes it will cascade the changes.
              .append(SQL` WHERE id = ${check.id} FOR UPDATE`),
          };
        }
      });
      statements.push(previousResult => {
        if (!previousResult || previousResult.length === 0) {
          return { action: 'rollback' };
        }
        return { action: 'executeSQL', sql };
      });

      const result = await
        executeSQLTransaction(vc.getDatabaseConnection(), statements);
      if (!result) {
        throw new Error('Tranaction failed');
      }
      return result;
    }
  }

  // TODO what about deadlocks - can a delete's select-for-updates be
  // interweaved between another delete's select-for-updates in a way that makes
  // them deadlock each other?
  async genDelete(): Promise<void> {
    const dependents = genForeignKeyDependentsRecursively(this.constructor);

    type Deletion = {
      ent: Class<BaseEnt>,
      qualifier:
        string /* this ent's id */ |
        {
          // column name of this foreign ent
          columnName: string,
          dependency: Deletion,
        },
      sqlSelectForUpdateQuery: SQLStatement,
      sqlDeleteQuery: SQLStatement,
    };

    function createSQLSubQueryForDeletion(
      ent: Class<BaseEnt>,
      qualifier:
        string |
        {
          columnName: string,
          dependency: Deletion,
        },
    ): { selectForUpdate: SQLStatement, delete: SQLStatement } {
      const entConfig = ent._getEntConfig();

      if (typeof qualifier === 'string') {
        return {
          selectForUpdate:
            SQL`SELECT id FROM `
              .append(entConfig.tableName)
              .append(SQL` WHERE id = ${qualifier} FOR UPDATE`),
          delete:
            SQL`DELETE FROM `
              .append(entConfig.tableName)
              .append(SQL` WHERE id = ${qualifier}`),
        };
      }

      return {
        selectForUpdate:
          SQL`SELECT id FROM `
            .append(entConfig.tableName)
            .append(SQL` WHERE `)
            .append(qualifier.columnName)
            .append(SQL` IN ( `)
            .append(qualifier.dependency.sqlSelectForUpdateQuery)
            .append(SQL` ) FOR UPDATE`),
        delete:
          SQL`DELETE FROM `
            .append(entConfig.tableName)
            .append(SQL` WHERE `)
            .append(qualifier.columnName)
            .append(SQL` IN ( `)
            .append(qualifier.dependency.sqlSelectForUpdateQuery)
            .append(SQL` )`),
      };
    }

    function constructDeletionsForDependent(
      dependency: Deletion,
      dependent: ForeignKeyDependent,
    ): Array<Deletion> {
      const deletions = [];

      if (dependent.onDelete === 'cascade') {
        const {
          selectForUpdate: sqlSelectForUpdateQuery,
          delete: sqlDeleteQuery,
        } = createSQLSubQueryForDeletion(
          dependent.entClass,
          {
            columnName: dependent.columnName,
            dependency,
          },
        );
        const deletionForDependent = {
          ent: dependent.entClass,
          qualifier: {
            columnName: dependent.columnName,
            dependency,
          },
          sqlSelectForUpdateQuery,
          sqlDeleteQuery,
        };

        dependent.subDependents
          .map(
            subDependent =>
              constructDeletionsForDependent(deletionForDependent, subDependent)
          )
          .forEach(deletions => allDeletions.push(...deletions));

        // Push this after dependents get pushed, because if the deletion for
        // a dependency runs first, then when we do a select, nothing will show
        // cause we've already deleted it.
        deletions.push(deletionForDependent);

        // It's okay if we have a dependency tree where it's like:
        //   A
        //  / \
        // B   C
        //    /
        //   B
        //
        // Because A will trigger B and C, and C will trigger B. If A's
        // B executes first, then it simply won't exist by the time we to C's B.
        // It's not possible for any dependents of C'B to be dangling, because
        // we'd have discovered that at A's B.
        //
        // TODO: add a test for this
      } else {
        invariant(false, 'Unsupported onDelete scheme');
      }

      return deletions;
    }

    const allDeletions: Array<Deletion> = [];
    const {
      selectForUpdate: sqlSelectForUpdateQuery,
      delete: sqlDeleteQuery,
    } = createSQLSubQueryForDeletion(this.constructor, this.getID());
    const deletionForSelf: Deletion = {
      ent: this.constructor,
      qualifier: this.getID(),
      sqlSelectForUpdateQuery,
      sqlDeleteQuery,
    };

    dependents
      .map(
        dependent => constructDeletionsForDependent(deletionForSelf, dependent)
      )
      .forEach(deletions => allDeletions.push(...deletions));

    // Same deal as earlier - this must happen after dependents are inserted
    allDeletions.push(deletionForSelf);

    const sqlStatements = [];

    // First, do a select on all the dependents to lock the rows.
    allDeletions.forEach(deletion =>
      sqlStatements.push(() => ({
        action: 'executeSQL',
        sql: deletion.sqlSelectForUpdateQuery,
      }))
    );

    // Then do the actual delete.
    allDeletions.forEach(deletion =>
      sqlStatements.push(() => ({
        action: 'executeSQL',
        sql: deletion.sqlDeleteQuery,
      }))
    );

    await executeSQLTransaction(
      this.getViewerContext().getDatabaseConnection(),
      sqlStatements,
    );
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

type ForeignKeyDependent = {
  entClass: Class<BaseEnt>,
  columnName: string,
  onDelete: ForeignKeyPropagation,
  subDependents: Array<ForeignKeyDependent>,
};

function genForeignKeyDependentsRecursively(
  entClass: Class<BaseEnt>,
): Array<ForeignKeyDependent> {
  const deps = [];

  BaseEnt.getAllEntClasses().forEach(entClass2 => {
    const foreignKeys = entClass2._getEntConfig().foreignKeys;
    if (!foreignKeys) {
      return;
    }

    Object.keys(foreignKeys).forEach(columnName => {
      if (foreignKeys[columnName].referenceEnt === entClass) {
        deps.push({
          entClass: entClass2,
          columnName,
          onDelete: foreignKeys[columnName].onDelete,
          subDependents: genForeignKeyDependentsRecursively(entClass2),
        });
      }
    });
  });

  return deps;
}
