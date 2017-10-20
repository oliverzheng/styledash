/** @flow */

import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} from 'graphql';

import GitHubRepo from '../../entity/GitHubRepo';
import { makeID } from './idUtil';
import NodeType from './NodeType';

export const GITHUB_REPO_ID_PREFIX = 'githubrepo';

const GitHubRepoType = new GraphQLObjectType({
  name: 'GitHubRepo',
  interfaces: () => [NodeType],
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(githubRepo: GitHubRepo) {
        return makeID(GITHUB_REPO_ID_PREFIX, githubRepo.serialize());
      },
    },
    repoID: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve(githubRepo: GitHubRepo) {
        return githubRepo.getID();
      },
    },
    repoOwner: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(githubRepo: GitHubRepo) {
        return githubRepo.getOwner();
      },
    },
    repoName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(githubRepo: GitHubRepo) {
        return githubRepo.getName();
      },
    },
  },
});

export default GitHubRepoType;
