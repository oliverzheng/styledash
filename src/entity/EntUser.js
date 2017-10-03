/** @flow */

import invariant from 'invariant';
import bcrypt from 'bcryptjs';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import {isPasswordValid} from '../clientserver/authentication';

let userPrivacy;

export default class EntUser extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'user',
      defaultColumnNames: [
        'id',
        'first_name',
        'last_name',
        'email',
        'password',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
      ],
      typeName: 'user',
      privacy: userPrivacy,
    };
  }

  static async genCreate(
    vc: ViewerContext,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<EntUser> {
    // This can't be verified in the privacy, cause the password is already
    // hashed by then.
    invariant(isPasswordValid(password), 'Invalid password');

    const hash = bcrypt.hashSync(password, 10);
    const userID = await this._genCreate(
      vc,
      {
        email,
        password: hash,
        first_name: firstName,
        last_name: lastName,
      },
    );
    return await this.genEnforce(vc, userID);
  }

  static async genIsEmailAlreadyInUse(
    vc: ViewerContext,
    email: string,
  ): Promise<boolean> {
    const row = await this._genColumnValues(
      vc,
      ['id'],
      email,
      'email',
    );
    return row != null;
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

  getFirstName(): string {
    return this._getStringData('first_name');
  }

  getLastName(): string {
    return this._getStringData('last_name');
  }

  getFullName(): string {
    return `${this.getFirstName()} ${this.getLastName()}`;
  }

  getEmail(): string {
    return this._getStringData('email');
  }

  /* TODO (graphql resolver) */
  userID() { return this.getID(); }
  firstName() { return this.getFirstName(); }
  lastName() { return this.getLastName(); }
  fullName() { return this.getFullName(); }
  email() { return this.getEmail(); }
}

BaseEnt.registerEnt(EntUser);

userPrivacy = (({
  async genCanViewerSee(obj: EntUser): Promise<boolean> {
    // TODO This is janky for a few reasons:
    // There should be a concept of organizations, so it's not possible for
    // a user of one org to see the user of another org.
    // "See" here means all fields on an object. Password isn't exposed, but it
    // could be and the privacy would leak. There would need to be field-level
    // restrictions.
    return true;
  },
  async genCanViewerMutate(obj: EntUser): Promise<boolean> {
    // TODO make sure new password is valid
    return obj.getID() === obj.getViewerContext().getUserID();
  },
  async genCanViewerDelete(obj: EntUser): Promise<boolean> {
    return obj.getID() === obj.getViewerContext().getUserID();
  },
  async genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    // Logged in users can't create users. There isn't really any business logic
    // that prevents them from doing so, but it gets weird when the resulting
    // user has a VC of the current user.
    if (vc.isAuthenticated()) {
      return false;
    }

    const email = data['email'];
    invariant(typeof email === 'string', 'Email must be a string');

    if (await EntUser.genIsEmailAlreadyInUse(vc, email)) {
      return false;
    }

    return true;
  },
}): PrivacyType<EntUser>);
