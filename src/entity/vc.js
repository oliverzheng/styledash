/** @flow */

import nullthrows from 'nullthrows';

import type {
  Connection,
} from '../storage/mysql';
import EntUser from './EntUser';

export default class ViewerContext {
  _conn: Connection;
  _userID: ?string;

  // Don't you dare instantiate this with a user ID if the user is not
  // authenticated
  constructor(conn: Connection, userID: ?string) {
    this._conn = conn;
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

  getDatabaseConnection(): Connection {
    return this._conn;
  }

  isDev(): boolean {
    // TODO make is dev environment
    return true;
  }
}
