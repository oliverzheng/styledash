/** @flow */

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

  // Requires isAuthenticated to be true
  getUserID(): string {
    return nullthrows(this._userID);
  }

  async genUser(): Promise<?EntUser> {
    if (!this.isAuthenticated()) {
      return null;
    }
    return await EntUser.genEnforce(this, this.getUserID());
  }

  getDatabaseConnection(): MySQLConnection {
    return this._dbConn;
  }

  getQueueConnection(): QueueConnection {
    return this._queueConn;
  }

  isDev(): boolean {
    // TODO make is dev environment
    return true;
  }
}
