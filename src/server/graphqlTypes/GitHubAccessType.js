/** @flow */

import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';

import EntGitHubToken from '../../entity/EntGitHubToken';
import { genGitHubUserRepos } from '../github';
import { makeID } from './idUtil';
import NodeType from './NodeType';
import GitHubRepoType from './GitHubRepoType';

export const GITHUB_ACCESS_ID_PREFIX = 'githubaccess';

const GitHubAccessType = new GraphQLObjectType({
  name: 'GitHubAccess',
  interfaces: () => [NodeType],
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(token: EntGitHubToken) {
        return makeID(GITHUB_ACCESS_ID_PREFIX, token.getID());
      },
    },
    user: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(token: EntGitHubToken) {
        return token.getGitHubUser();
      },
    },
    hasAllRequiredScope: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve(token: EntGitHubToken) {
        return true; // TODO
      },
    },
    githubRepos: {
      type: new GraphQLNonNull(new GraphQLList(GitHubRepoType)),
      resolve(token: EntGitHubToken) {
        return genGitHubUserRepos(token.getToken());
      },
    },
  },
});

export default GitHubAccessType;
