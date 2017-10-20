/** @flow */

import invariant from 'invariant';

export default class GitHubRepo {
  _repoID: number;
  _owner: string;
  _name: string;

  constructor(
    repoID: number,
    owner: string,
    name: string,
  ) {
    this._repoID = repoID;
    this._owner = owner;
    this._name = name;
  }

  serialize(): string {
    return `${this._repoID}:${this._owner}:${this._name}`;
  }

  static deserialize(serialization: string): this {
    const split = serialization.split(':');
    invariant(split.length === 3, 'Invalid serialization %s', serialization);
    const repoID = parseInt(split[0], 10);
    invariant(typeof repoID === 'number', 'RepoID not a number: %s', split[0]);
    return new this(repoID, split[1], split[2]);
  }

  getID(): number {
    return this._repoID;
  }

  getOwner(): string {
    return this._owner;
  }

  getName(): string {
    return this._name;
  }
}
