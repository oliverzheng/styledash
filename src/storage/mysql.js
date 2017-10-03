/** @flow */

import nullthrows from 'nullthrows';
import mysql from 'mysql';
import {SQLStatement} from 'sql-template-strings';

export opaque type MySQLConnection = Object;

export async function connectToMySQL(
  dbURL: string,
): Promise<MySQLConnection> {
  return await new Promise((resolve, reject) => {
    const pool = mysql.createPool(`${dbURL}?acquireTimeout=null`);
    // We don't need to add additional logic to check to see the connection is
    // still alive (didn't timeout) when we fetch it later. The pool makes sure
    // each connection is still usable when we grab it from the pool. There's an
    // optimization to be done here though, where we grab a connection for each
    // request and assign it to the duration fo the request, so we don't ping
    // for every request. TODO

    // Verify we can create at least 1 connection.
    pool.getConnection((err, conn) => {
      if (err) {
        reject('Cannot connect to db: ' + err);
        return;
      }
      conn.release();
      resolve(pool);
    });
  });
}

export async function executeSQL(connection: MySQLConnection, sql: SQLStatement): Promise<Object> {
  if (!connection) {
    throw new Error('No connection to MySQL');
  }
  return await new Promise((resolve, reject) => {
    nullthrows(connection).query(sql, (error, results, fields) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
}

export async function executeSQLTransaction(
  connection: MySQLConnection,
  sqlStatementGenerators: Array<
    (previousResult: ?Object) =>
      { action: 'executeSQL', sql: SQLStatement } |
      { action: 'rollback' }
  >,
): Promise<?Object> {
  return await new Promise((resolve, reject) => {
    connection.getConnection((err, conn) => {
      if (err) {
        reject('Cannot connect to db: ' + err);
        return;
      }

      conn.beginTransaction(err => {
        if (err) {
          reject(err);
          return;
        }

        let previousResult = null;
        const sqlStatementGeneratorsLeft = sqlStatementGenerators.slice(0);

        function executeNextStatement() {
          if (sqlStatementGeneratorsLeft.length === 0) {
            conn.commit(error => {
              if (error) {
                conn.rollback(() => reject(error));
                return;
              }
              resolve(previousResult);
            });
            return;
          }

          const sqlGenerator = sqlStatementGeneratorsLeft.shift();
          const generated = sqlGenerator(previousResult);

          if (generated.action === 'rollback') {
            conn.rollback(() => resolve(null));

          } else if (generated.action === 'executeSQL') {
            conn.query(generated.sql, (error, results, fields) => {
              if (error) {
                conn.rollback(() => reject(error));
                return;
              }
              previousResult = results;
              executeNextStatement();
            });
          }
        }
        executeNextStatement();
      });
    });
  });
}

export function cleanupMySQLConnection(connection: ?MySQLConnection) {
  if (connection) {
    connection.end();
  }
}
