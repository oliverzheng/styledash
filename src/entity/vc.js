/** @flow */

import type {
  Connection,
} from '../storage/mysql';

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

  getUserID(): ?string {
    return this._userID;
  }

  getDatabaseConnection(): Connection {
    return this._conn;
  }
}
