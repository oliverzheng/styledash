/** @flow */

import invariant from 'invariant';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntRepository from './EntRepository';
import EntRepositoryPermission from './EntRepositoryPermission';

let compilationPrivacy;

export default class EntRepositoryCompilation extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'repository_compilation',
      defaultColumnNames: [
        'id',
        'repository_id',
        'commit_hash',
        'added_timestamp',
      ],
      extendedColumnNames: [
        'compiled_bundle',
      ],
      immutableColumnNames: [
        'id',
        'repository_id',
        'commit_hash',
        'added_timestamp',
      ],
      foreignKeys: {
        'repository_id': {
          referenceEnt: EntRepository,
          onDelete: 'cascade',
        },
      },
      typeName: 'repository_compilation',
      privacy: compilationPrivacy,
    };
  }

  static async genForRepository(
    repo: EntRepository,
  ): Promise<Array<this>> {
    const compilations = await this.genWhereMulti(
      repo.getViewerContext(),
      {
        'repository_id': repo.getID(),
      },
      [{
        columnName: 'added_timestamp',
        ascending: false,
      }],
    );
    return compilations;
  }

  static async genCreate(
    repo: EntRepository,
    commit: string,
    compiledBundle: string,
  ): Promise<this> {
    const vc = repo.getViewerContext();
    const id = await this._genCreate(
      vc,
      {
        'repository_id': repo.getID(),
        'commit_hash': commit,
        'compiled_bundle': compiledBundle,
        'added_timestamp': Math.round((new Date()).getTime() / 1000),
      },
    );
    return await this.genEnforce(vc, id);
  }

  getRepositoryID(): string {
    return this._getIDData('repository_id');
  }

  getCommitHash(): string {
    return this._getStringData('commit_hash');
  }

  getAddedTimestamp(): number {
    return this._getNumberData('added_timestamp');
  }

  async genCompiledBundle(): Promise<string> {
    const bundle = await this._genExtendedColumnValue('compiled_bundle');
    invariant(typeof bundle === 'string', 'Must be a string');
    return bundle;
  }

  getCompiledBundleURI(): string {
    return `/_repositoryCompilation/bundle/${this.getID()}/bundle.js`;
  }
}

BaseEnt.registerEnt(EntRepositoryCompilation);

compilationPrivacy = (({
  async genCanViewerSee(obj: EntRepositoryCompilation): Promise<boolean> {
    return await EntRepositoryPermission.genCanViewerReadWrite(
      obj.getViewerContext(),
      obj.getRepositoryID(),
    );
  },
  async genCanViewerMutate(obj: EntRepositoryCompilation): Promise<boolean> {
    // This is immutable
    return false;
  },
  async genCanViewerDelete(obj: EntRepositoryCompilation): Promise<boolean> {
    return await EntRepositoryPermission.genCanViewerReadWrite(
      obj.getViewerContext(),
      obj.getRepositoryID(),
    );
  },
  async genCanViewerCreate(
    vc: ViewerContext,
    data: {[columnName: string]: mixed},
  ): Promise<boolean> {
    const repositoryID = data['repository_id'];
    invariant(typeof repositoryID === 'string', 'Must be a string');

    return await EntRepositoryPermission.genCanViewerReadWrite(
      vc,
      repositoryID,
    );
  },
}): PrivacyType<EntRepositoryCompilation>);
