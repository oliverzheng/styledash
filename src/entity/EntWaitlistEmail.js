/** @flow */

import invariant from 'invariant';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import {isEmailValid} from '../clientserver/authentication';

let waitlistEmailPrivacy;

export default class EntWaitlistEmail extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'waitlist_email',
      defaultColumnNames: [
        'id',
        'email',
        'added_timestamp',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
      ],
      typeName: 'waitlist_email',
      privacy: waitlistEmailPrivacy,
    };
  }

  static async genWaitlist(
    vc: ViewerContext,
    email: string,
  ): Promise<void> {
    invariant(isEmailValid(email), 'Email must be valid');
    if (await this.genIsWaitlisted(vc, email)) {
      return;
    }
    await this._genCreate(
      vc,
      {
        email,
        added_timestamp: Math.round((new Date()).getTime() / 1000),
      },
    );
  }

  static async genIsWaitlisted(
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

  getEmail(): string {
    return this._getStringData('email');
  }
}

BaseEnt.registerEnt(EntWaitlistEmail);

waitlistEmailPrivacy = (({
  async genCanViewerSee(obj: EntWaitlistEmail): Promise<boolean> {
    return true;
  },
  async genCanViewerMutate(obj: EntWaitlistEmail): Promise<boolean> {
    return false;
  },
  async genCanViewerDelete(obj: EntWaitlistEmail): Promise<boolean> {
    return false;
  },
  async genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    return true;
  },
}): PrivacyType<EntWaitlistEmail>);
