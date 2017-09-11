/** @flow */

import nullthrows from 'nullthrows';

import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';
import EntUser from '../entity/EntUser';

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
}
