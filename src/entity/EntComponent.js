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

const componentPrivacy: PrivacyType<EntComponent> = {
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
    // Let's say no for now...?
    return false;
  },

  async genCanViewerCreate(vc: ViewerContext): Promise<boolean> {
    // TODO Only scripts/background processes can create it. Need to open that
    // up here.
    return false;
  },
};

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
    return `/component/${this.getID()}/bundle.js`;
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

    return `https:\/\/github.com/${user}/${repo}/blob/${branch}${this.getFilepath()}`;
  }

  // Mutations

  async genSetOverrideReactDoc(override: string): Promise<boolean> {
    const res = await this._genMutate(
      {override_react_doc: override},
    );

    // TODO pull this into the mutator once we have object caching
    this._data['override_react_doc'] = override;

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
