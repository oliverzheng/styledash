/** @flow */

import username from 'username';

import ViewerContext from '../entity/vc';
import EntRepository from '../entity/EntRepository';

export default class Viewer {
  _vc: ViewerContext;

  constructor(vc: ViewerContext) {
    this._vc = vc;
  }

  id(): string {
    // TODO
    return 'viewer:some_user_id';
  }

  async username(): Promise<string> {
    return await username();
  }

  async repositories(): Promise<Array<EntRepository>> {
    // TODO need users to do this
    const repo = await EntRepository.genEnforce(this._vc, '44');
    return [repo];
  }
}
