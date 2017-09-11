/** @flow */

import invariant from 'invariant';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';

// This is an enum in the db.
const READ_WRITE_PERMISSION = 'read_write';
const ADMIN_PERMISSION = 'admin';

type AnyPermission =
  typeof READ_WRITE_PERMISSION |
  typeof ADMIN_PERMISSION;

const repositoryPermissionPrivacy: PrivacyType<EntRepositoryPermission> = {
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

    // An admin can do whatever, but a user can only add readWrite permissions.
    const allPerms = await EntRepositoryPermission.genAllPermissions(
      vc,
      ((repositoryID: any): string),
      vc.getUserID(),
    );
    const isAdmin = allPerms.some(perm => perm.isAdmin());
    const hasAnyPerms = allPerms.length > 0;

    if (isAdmin) {
      return true;
    } else if (permission === EntRepositoryPermission.ADMIN) {
      return false;
    } else if (permission === EntRepositoryPermission.READ_WRITE) {
      return hasAnyPerms;
    } else {
      invariant(false, 'NYI');
    }
  },
};

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
      typeName: 'repository_permission',
      privacy: repositoryPermissionPrivacy,
    };
  }

  static async genIsViewerAdmin(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<boolean> {
    const perm = await EntRepositoryPermission.genPermission(
      vc,
      repositoryID,
      vc.getUserID(),
      EntRepositoryPermission.ADMIN,
    );
    return perm != null;
  }

  static async genCanViewerReadWrite(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<boolean> {
    const perm = await EntRepositoryPermission.genPermission(
      vc,
      repositoryID,
      vc.getUserID(),
      EntRepositoryPermission.READ_WRITE,
    );
    return perm != null;
  }

  static async genDoesViewerHaveAnyPermission(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<boolean> {
    const perms = await EntRepositoryPermission.genAllPermissions(
      vc,
      repositoryID,
      vc.getUserID(),
    );
    return perms.length > 0;
  }

  static async genPermission(
    vc: ViewerContext,
    repositoryID: string,
    userID: string,
    permission: AnyPermission,
  ): Promise<?this> {
    const perms = await this.genWhereMulti(
      vc,
      {
        repository_id: repositoryID,
        user_id: userID,
        permission,
      },
    );
    return perms[0];
  }

  static async genAllPermissions(
    vc: ViewerContext,
    repositoryID: string,
    userID: string,
  ): Promise<Array<this>> {
    return await this.genWhereMulti(
      vc,
      {
        repository_id: repositoryID,
        user_id: userID,
      },
    );
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
    permission: AnyPermission,
  ): Promise<Array<this>> {
    return await this.genWhereMulti(
      vc,
      {
        permission,
        user_id: vc.getUserID(),
      },
    );
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
