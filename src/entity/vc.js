/** @flow */

import process from 'process';
import nullthrows from 'nullthrows';

import type {
  MySQLConnection,
} from '../storage/mysql';
import type {
  QueueConnection,
} from '../storage/queue';
import EntUser from './EntUser';

export default class ViewerContext {
  _dbConn: MySQLConnection;
  _queueConn: QueueConnection;
  _userID: ?string;

  // Don't you dare instantiate this with a user ID if the user is not
  // authenticated
  constructor(
    dbConn: MySQLConnection,
    queueConn: QueueConnection,
    userID: ?string,
  ) {
    this._dbConn = dbConn;
    this._queueConn = queueConn;
    this._userID = userID;
  }

  isAuthenticated(): boolean {
    return this._userID != null;
  }

  // Returning null means it's not authenticated and there is no user associated
  // with this vc
  getUserID(): ?string {
    return this._userID;
  }

  getUserIDX(): string {
    return nullthrows(this._userID);
  }

  async genUser(): Promise<?EntUser> {
    const userID = this._userID;
    if (userID == null) {
      return null;
    }
    return await EntUser.genEnforce(this, userID);
  }

  getDatabaseConnection(): MySQLConnection {
    return this._dbConn;
  }

  getQueueConnection(): QueueConnection {
    return this._queueConn;
  }

  isDevEnvironment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}
