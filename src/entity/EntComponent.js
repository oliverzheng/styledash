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
      ],
      extendedColumnNames: [
        'compiled_bundle',
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

  async genRepository(): Promise<EntRepository> {
    return await EntRepository.genEnforce(
      this.getViewerContext(),
      this.getRepositoryID(),
    );
  }

  getCompiledBundleURI(): string {
    return `/_componentBundle/${this.getID()}/bundle.js`;
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

  async genCompiledBundle(): Promise<string> {
    const bundle = await this._genExtendedColumnValue('compiled_bundle');
    invariant(typeof bundle === 'string', 'Must be a string');
    return bundle;
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
    compiledBundle: string,
    reactDoc: string,
  ): Promise<this> {
    const componentID = await this._genCreate(
      vc,
      {
        name,
        repository_id: repositoryID,
        filepath,
        compiled_bundle: compiledBundle,
        react_doc: reactDoc,
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
    bundle: string,
  ): Promise<boolean> {
    const res = await this._genMutate(
      {
        'react_doc': reactDoc,
        'compiled_bundle': bundle,
      },
    );

    if (res) {
      // TODO pull this into the mutator once we have object caching
      this._data['react_doc'] = reactDoc;
      this._data['compiled_bundle'] = bundle;
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
      { repository_id: repositoryID },
    );
    invariant(typeof count === 'number', 'Must be a number');
    return count;
  }

  static async genComponentInRepositoryWithFilepath(
    repo: EntRepository,
    filepath: string,
  ): Promise<?this> {
    const components = await this.genWhereMulti(
      repo.getViewerContext(),
      {
        'repository_id': repo.getID(),
        'filepath': filepath,
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
  compiledBundleURI() { return this.getCompiledBundleURI(); }
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
    return obj.getViewerContext().isAllPowerful();
  },

  async genCanViewerCreate(vc: ViewerContext): Promise<boolean> {
    return vc.isAllPowerful();
  },
}): PrivacyType<EntComponent>);
