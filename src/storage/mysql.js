/** @flow */

import nullthrows from 'nullthrows';
import mysql from 'mysql';

export opaque type Connection = Object;

export async function connectToMySQL(
  dbURL: string,
): Promise<Connection> {
  return await new Promise((resolve, reject) => {
    const connection = mysql.createConnection(dbURL);
    connection.connect((err) => {
      if (err) {
        reject('Cannot connect to db: ' + err);
        return;
      }
      resolve(connection);
    });
  });
}

export async function executeSQL(connection: Connection, sql: string): Promise<Object> {
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

export function cleanupConnection(connection: ?Connection) {
  if (connection) {
    connection.destroy();
  }
}
