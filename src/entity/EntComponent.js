/** @flow */

import invariant from 'invariant';
import SQL from 'sql-template-strings';

import ViewerContext from './vc';
import BaseEnt, {
  type EntConfig,
  type PrivacyType,
} from './BaseEnt';
import EntRepository from './EntRepository';
import EntRepositoryPermission from './EntRepositoryPermission';
import EntExample from './EntExample';

let componentPrivacy;

export default class EntComponent extends BaseEnt {
  static _getEntConfig(): EntConfig<this> {
    return {
      tableName: 'component',
      defaultColumnNames: [
        'id',
        'name',
        'repository_id',
        'filepath',
        'is_named_export',
      ],
      extendedColumnNames: [
        'react_doc',
        'override_react_doc',
      ],
      immutableColumnNames: [
        'id',
        'repository_id',
      ],
      foreignKeys: {
        'repository_id': {
          referenceEnt: EntRepository,
          onDelete: 'cascade',
        },
      },
      typeName: 'component',
      privacy: componentPrivacy,
    };
  }

  getName(): string {
    return this._getStringData('name');
  }

  getRepositoryID(): string {
    return this._getIDData('repository_id');
  }

  getFilepath(): string {
    return this._getStringData('filepath');
  }

  getIsNamedExport(): boolean {
    return this._getBooleanData('is_named_export');
  }

  async genRepository(): Promise<EntRepository> {
    return await EntRepository.genEnforce(
      this.getViewerContext(),
      this.getRepositoryID(),
    );
  }

  async genReactDoc(): Promise<string> {
    const doc = await this._genExtendedColumnValue('react_doc');
    invariant(typeof doc === 'string', 'Must be a string');
    return doc;
  }

  async genOverrideReactDoc(): Promise<?string> {
    const doc = await this._genExtendedColumnValue('override_react_doc');
    if (doc == null) {
      return doc;
    }
    invariant(typeof doc === 'string', 'Must be a string');
    return doc;
  }

  async genExamples(): Promise<Array<EntExample>> {
    return await EntExample.genExamplesForComponent(this);
  }

  async genGitHubURL(): Promise<?string> {
    const repository = await this.genRepository();
    const user = repository.getGitHubUsername();
    const repo = repository.getGitHubRepo();
    const branch = repository.getGitHubBranch();
    if (!user || !repo || !branch) {
      return null;
    }

    return `https://github.com/${user}/${repo}/blob/${branch}${this.getFilepath()}`;
  }

  // Mutations

  static async genCreate(
    vc: ViewerContext,
    name: string,
    repositoryID: string,
    filepath: string,
    isNamedExport: boolean,
    reactDoc: string,
  ): Promise<this> {
    const componentID = await this._genCreate(
      vc,
      {
        'name': name,
        'repository_id': repositoryID,
        'filepath': filepath,
        'is_named_export': isNamedExport,
        'react_doc': reactDoc,
      },
    );
    return await this.genEnforce(vc, componentID);
  }

  async genSetOverrideReactDoc(override: string): Promise<boolean> {
    const res = await this._genMutate(
      {override_react_doc: override},
    );

    // TODO pull this into the mutator once we have object caching
    this._data['override_react_doc'] = override;

    return res;
  }

  async genUpdateComponent(
    reactDoc: string,
  ): Promise<boolean> {
    const res = await this._genMutate(
      {
        'react_doc': reactDoc,
      },
    );

    if (res) {
      // TODO pull this into the mutator once we have object caching
      this._data['react_doc'] = reactDoc;
    }

    return res;
  }

  // Static helpers

  static async genComponentsCountForRepository(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<number> {
    const count = await this.genAggregateSQLWithoutPrivacy(
      vc,
      SQL`count(1)`,
      {
        'repository_id': repositoryID,
        'is_named_export': false,
      },
    );
    invariant(typeof count === 'number', 'Must be a number');
    return count;
  }

  static async genDefaultExportComponentsInRepository(
    vc: ViewerContext,
    repositoryID: string,
  ): Promise<Array<this>> {
    return await EntComponent.genWhereMulti(
      vc,
      {
        'repository_id': repositoryID,
        'is_named_export': false,
      },
    );
  };

  static async genComponentInRepositoryWithFilepath(
    repo: EntRepository,
    filepath: string,
    name: string,
    isNamedExport: boolean,
  ): Promise<?this> {
    const components = await this.genWhereMulti(
      repo.getViewerContext(),
      {
        'repository_id': repo.getID(),
        'filepath': filepath,
        'name': name,
        'is_named_export': isNamedExport,
      },
    );
    invariant(
      components.length <= 1,
      `Multiple components for repo ${repo.getID()} at filepath ${filepath}`,
    );
    return components[0];
  }

  /* TODO (graphql resolver) */
  name() { return this.getName(); }
  componentID() { return this.getID(); }
  filepath() { return this.getFilepath(); }
  repository() { return this.genRepository(); }
  isNamedExport() { return this.getIsNamedExport(); }
  reactDoc() { return this.genReactDoc(); }
  overrideReactDoc() { return this.genOverrideReactDoc(); }
  examples() { return this.genExamples(); }
  githubURL() { return this.genGitHubURL(); }
}

BaseEnt.registerEnt(EntComponent);

componentPrivacy = (({
  async genCanViewerSee(obj: EntComponent): Promise<boolean> {
    return await EntRepositoryPermission.genCanViewerReadWrite(
      obj.getViewerContext(),
      obj.getRepositoryID(),
    );
  },

  async genCanViewerMutate(obj: EntComponent): Promise<boolean> {
    return await EntRepositoryPermission.genCanViewerReadWrite(
      obj.getViewerContext(),
      obj.getRepositoryID(),
    );
  },

  async genCanViewerDelete(obj: EntComponent): Promise<boolean> {
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
}): PrivacyType<EntComponent>);
