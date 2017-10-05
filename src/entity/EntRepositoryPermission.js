/** @flow */

import invariant from 'invariant';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntRepository from './EntRepository';
import EntUser from './EntUser';
import SQL from 'sql-template-strings';

// This is an enum in the db.
const READ_WRITE_PERMISSION = 'read_write';
const ADMIN_PERMISSION = 'admin';

type AnyPermission =
  typeof READ_WRITE_PERMISSION |
  typeof ADMIN_PERMISSION;

let repositoryPermissionPrivacy;

export default class EntRepositoryPermission extends BaseEnt {

  static READ_WRITE = READ_WRITE_PERMISSION;
  static ADMIN = ADMIN_PERMISSION;

  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'repository_permission',
      defaultColumnNames: [
        'id',
        'repository_id',
        'user_id',
        'permission',
      ],
      extendedColumnNames: [
      ],
      immutableColumnNames: [
        'id',
      ],
      foreignKeys: {
        'repository_id': {
          referenceEnt: EntRepository,
          onDelete: 'cascade',
        },
        'user_id': {
          referenceEnt: EntUser,
          onDelete: 'cascade',
        },
      },
      typeName: 'repository_permission',
      privacy: repositoryPermissionPrivacy,
    };
  }

  static async genIsViewerAdmin(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<boolean> {
    if (vc.isAllPowerful()) {
      return true;
    }

    const perm = await EntRepositoryPermission._genPermission(
      vc,
      repositoryID,
    );
    return perm != null && perm.isAdmin();
  }

  static async genCanViewerReadWrite(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<boolean> {
    if (vc.isAllPowerful()) {
      return true;
    }

    const perm = await EntRepositoryPermission._genPermission(
      vc,
      repositoryID,
    );
    return perm != null;
  }

  static async genDoesViewerHaveAnyPermission(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<boolean> {
    return await this.genCanViewerReadWrite(vc, repositoryID);
  }

  // This is privacy agnostic. If a repo is new and no one has permissions yet,
  // all viewers would be able to see that. If a repo is not new and has
  // permissions, all viewer would be able to see that too.
  static async genHasAnyPermissions(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<boolean> {
    const count = await this.genAggregateSQLWithoutPrivacy(
      vc,
      SQL`count(1)`,
      { 'repository_id': repositoryID },
    );
    invariant(typeof count === 'number', 'Must be a number');
    return count > 0;
  }

  static async _genPermission(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<?this> {
    const userID = vc.getUserID();
    if (userID == null) {
      return null;
    }
    const perms = await this.genWhereMulti(
      vc,
      {
        repository_id: repositoryID,
        user_id: userID,
      },
    );
    return perms[0];
  }

  static async genPermissionsThatAre(
    vc: ViewerContext,
    repositoryID: string,
    permission: AnyPermission,
  ): Promise<Array<this>> {
    return await this.genWhereMulti(
      vc,
      {
        repository_id: repositoryID,
        permission,
      },
    );
  }

  static async genAllForViewer(
    vc: ViewerContext,
    permissions: Array<AnyPermission>,
  ): Promise<Array<this>> {
    return await this.genWhereMulti(
      vc,
      {
        'permission': permissions,
        'user_id': vc.getUserID(),
      },
    );
  }

  static async genCreate(
    vc: ViewerContext,
    repositoryID: string,
    permission: AnyPermission,
  ): Promise<EntRepositoryPermission> {
    // Only a user's vc can create this
    const userID = vc.getUserIDX();
    const permID = await this._genCreate(
      vc,
      {
        'repository_id': repositoryID,
        'permission': permission,
        'user_id': userID,
      },
    );
    return await this.genEnforce(vc, permID);
  }

  getRepositoryID(): string {
    return this._getIDData('repository_id');
  }

  getUserID(): string {
    return this._getIDData('user_id');
  }

  isReadWrite(): boolean {
    return this._getStringData('permission') === READ_WRITE_PERMISSION;
  }

  isAdmin(): boolean {
    return this._getStringData('permission') === ADMIN_PERMISSION;
  }
}

BaseEnt.registerEnt(EntRepositoryPermission);

repositoryPermissionPrivacy = (({
  async genCanViewerSee(obj: EntRepositoryPermission): Promise<boolean> {
    const vc = obj.getViewerContext();

    if (vc.getUserID() === obj.getUserID()) {
      return true;
    }

    // You can also see a permission if you have any permission for the repo
    return await EntRepositoryPermission.genDoesViewerHaveAnyPermission(
      vc,
      obj.getRepositoryID(),
    );
  },

  async genCanViewerMutate(obj: EntRepositoryPermission): Promise<boolean> {
    const vc = obj.getViewerContext();

    // A user cannot change their own permissions
    if (vc.getUserID() === obj.getUserID()) {
      return false;
    }

    // An admin for the repo can change it for others though
    return await EntRepositoryPermission.genIsViewerAdmin(
      vc,
      obj.getRepositoryID(),
    );
  },

  async genCanViewerDelete(obj: EntRepositoryPermission): Promise<boolean> {
    const vc = obj.getViewerContext();

    // A user can delete their own permissions, unless this permission is the
    // only admin one left for the project. At least someone needs to be the
    // admin.
    if (vc.getUserID() === obj.getUserID()) {
      if (obj.isReadWrite()) {
        return true;
      } else if (obj.isAdmin()) {
        const adminPerms = await EntRepositoryPermission.genPermissionsThatAre(
          vc,
          obj.getRepositoryID(),
          EntRepositoryPermission.ADMIN,
        );
        return adminPerms.length > 1;
      } else {
        invariant(false, 'NYI');
      }
    }

    // An admin for the repo can change it for others though
    return await EntRepositoryPermission.genIsViewerAdmin(
      vc,
      obj.getRepositoryID(),
    );
  },

  async genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    const repositoryID = data['repository_id'];
    const permission = data['permission'];

    // TODO make an "assert ID type" function of some sort
    invariant(typeof repositoryID === 'string', 'Must be a string');

    const [
      isAdmin,
      canReadWrite,
      hasAnyPermissions,
    ] = await Promise.all([
      EntRepositoryPermission.genIsViewerAdmin(vc, repositoryID),
      EntRepositoryPermission.genCanViewerReadWrite(vc, repositoryID),
      EntRepositoryPermission.genHasAnyPermissions(vc, repositoryID),
    ]);

    // An admin can do whatever, but a user can only add readWrite permissions.
    // A repo without any permissions means it's up for grabs for anybody
    if (isAdmin) {
      return true;
    } else if (!hasAnyPermissions) {
      // The first permission created has to be an admin perm. Otherwise, no new
      // admin permissions can be added.
      return permission === EntRepositoryPermission.ADMIN;
    } else if (permission === EntRepositoryPermission.ADMIN) {
      return false;
    } else if (permission === EntRepositoryPermission.READ_WRITE) {
      return canReadWrite;
    } else {
      invariant(false, 'NYI');
    }
  },
}): PrivacyType<EntRepositoryPermission>);
