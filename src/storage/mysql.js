/** @flow */

import nullthrows from 'nullthrows';
import mysql from 'mysql';

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

export async function executeSQL(connection: MySQLConnection, sql: string): Promise<Object> {
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

export function cleanupMySQLConnection(connection: ?MySQLConnection) {
  if (connection) {
    connection.destroy();
  }
}
