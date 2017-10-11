/** @flow */

import nullthrows from 'nullthrows';

import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';
import EntUser from '../entity/EntUser';
import EntGitHubToken from '../entity/EntGitHubToken';

export default class Viewer {
  _vc: ViewerContext;

  constructor(vc: ViewerContext) {
    this._vc = vc;
  }

  id(): string {
    return 'viewer';
  }

  async genUser(): Promise<EntUser> {
    return nullthrows(await this._vc.genUser());
  }

  async repositories(): Promise<Array<EntRepository>> {
    return await EntRepository.genForViewer(this._vc);
  }

  /* TODO (graphql resolver) */
  user() { return this.genUser(); }
  githubAccess() { return EntGitHubToken.genForViewer(this._vc); }
}
