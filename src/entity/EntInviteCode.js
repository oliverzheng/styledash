/** @flow */

import invariant from 'invariant';
import randomstring from 'randomstring';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntWaitlistEmail from './EntWaitlistEmail';
import EntUser from './EntUser';

const CODE_LENGTH = 10;

let inviteCodePrivacy;

export default class EntInviteCode extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'invite_code',
      defaultColumnNames: [
        'id',
        'code',
        'used_timestamp',
        'user_id',
        'assigned_waitlist_email_id',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
        'code',
      ],
      typeName: 'invite_code',
      foreignKeys: {
        'user_id': {
          referenceEnt: EntUser,
          onDelete: 'cascade',
        },
        // TODO onDelete: setNull
        /*
        'assigned_waitlist_email_id': {
          referenceEnt: EntWaitlistEmail,
          onDelete: 'setNull'
        },
        */
      },
      privacy: inviteCodePrivacy,
    };
  }

  static async genUnusedForWaitlistEmail(
    vc: ViewerContext,
    waitlistEmail: EntWaitlistEmail,
  ): Promise<?this> {
    const rows = await this.genWhereMulti(
      vc,
      {
        'used_timestamp': null,
        'assigned_waitlist_email_id': waitlistEmail.getID(),
      },
    );
    return rows[0];
  }

  static async genCreate(
    vc: ViewerContext,
    assignedWaitlistEmail: ?EntWaitlistEmail = null,
  ): Promise<this> {
    const code = randomstring.generate(CODE_LENGTH);
    const id = await this._genCreate(
      vc,
      {
        'code': code,
        'assigned_waitlist_email_id':
          assignedWaitlistEmail ? assignedWaitlistEmail.getID() : null,
      },
    );
    return await this.genEnforce(vc, id);
  }

  async genUse(
    user: EntUser,
  ): Promise<void> {
    invariant(!this.isUsed(), 'Cannot already be used');

    const usedTimestamp = Math.round((new Date()).getTime() / 1000);
    await this._genMutate(
      {
        'used_timestamp': usedTimestamp,
        'user_id': user.getID(),
      },
    );
    this._data['used_timestamp'] = usedTimestamp;
    this._data['user_id'] = user.getID();
  }

  getCode(): string {
    return this._getStringData('code');
  }

  getUsedTimestamp(): ?number {
    return this._getNullableNumberData('used_timestamp');
  }

  isUsed(): boolean {
    return this.getUsedTimestamp() != null;
  }

  getUserID(): ?string {
    return this._getNullableIDData('user_id');
  }

  getAssignedWaitlistEmailID(): ?string {
    return this._getNullableIDData('assigned_waitlist_email_id');
  }

  async genAssignedWaitlistEmail(): Promise<?EntWaitlistEmail> {
    const id = this.getAssignedWaitlistEmailID();
    if (!id) {
      return null;
    }
    return await EntWaitlistEmail.genEnforce(this.getViewerContext(), id);
  }
}

BaseEnt.registerEnt(EntInviteCode);

inviteCodePrivacy = (({
  async genCanViewerSee(obj: EntInviteCode): Promise<boolean> {
    return true;
  },
  async genCanViewerMutate(obj: EntInviteCode): Promise<boolean> {
    return true;
  },
  async genCanViewerDelete(obj: EntInviteCode): Promise<boolean> {
    return false;
  },
  async genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    return vc.isAllPowerful();
  },
}): PrivacyType<EntInviteCode>);
