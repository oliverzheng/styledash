/** @flow */

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

  getID(): string {
    return 'github-repo:' + this._repoID.toString();
  }

  getRepoID(): number {
    return this._repoID;
  }

  getOwner(): string {
    return this._owner;
  }

  getName(): string {
    return this._name;
  }

  // TODO GraphQL resolvers
  id() { return this.getID(); }
  repoID() { return this.getRepoID(); }
  repoOwner() { return this.getOwner(); }
  repoName() { return this.getName(); }
}
