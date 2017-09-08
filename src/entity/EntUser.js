/** @flow */

import invariant from 'invariant';
import bcrypt from 'bcryptjs';
import SQL from 'sql-template-strings';

import ViewerContext from '../core/vc';
import BaseEnt, { type EntConfig } from './BaseEnt';

export default class EntUser extends BaseEnt {
  static _getEntConfig(): EntConfig {
    return {
      tableName: 'user',
      defaultColumnNames: [
        'id',
        'email',
        'password',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
      ],
      typeName: 'user',
    };
  }

  static async genCreate(
    vc: ViewerContext,
    email: string,
    password: string,
  ): Promise<EntUser> {
    const hash = bcrypt.hashSync(password, 10);
    const userID = await this._genCreate(
      vc,
      {
        email,
        password: hash,
      },
    );
    return await this.genEnforce(vc, userID);
  }

  // Returns a user ID if successful. Null otherwise.
  static async genVerifyLogin(
    vc: ViewerContext,
    email: string,
    password: string,
  ): Promise<?string> {
    const row = await this._genColumnValues(
      vc,
      ['id', 'password'],
      email,
      'email',
    );
    if (!row) {
      return null;
    }
    const hash = row['password'];
    const verified = bcrypt.compareSync(password, hash);

    if (verified) {
      const intID = row['id'];
      invariant(typeof intID === 'number', 'ID must be a number');
      return intID.toString();
    } else {
      return null;
    }
  }

  getEmail(): string {
    return this._getStringData('email');
  }

  /* TODO (graphql resolver) */
  userID() { return this.getUserID(); }
  email() { return this.getEmail(); }
}

