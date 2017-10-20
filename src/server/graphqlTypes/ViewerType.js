/** @flow */

import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';

import ViewerContext from '../../entity/vc';
import EntRepository from '../../entity/EntRepository';
import NodeType from './NodeType';
import UserType from './UserType';
import GitHubAccessType from './GitHubAccessType';
import EntGitHubToken from '../../entity/EntGitHubToken';
import RepositoryType from './RepositoryType';

export const VIEWER_ID_PREFIX = 'viewer';

const ViewerType = new GraphQLObjectType({
  name: 'Viewer',
  interfaces: () => [NodeType],
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(vc: ViewerContext) {
        return VIEWER_ID_PREFIX;
      },
    },
    user: {
      type: new GraphQLNonNull(UserType),
      resolve(vc: ViewerContext) {
        return vc.genUser();
      }
    },
    githubAccess: {
      type: GitHubAccessType,
      resolve(vc: ViewerContext) {
        return EntGitHubToken.genForViewer(vc);
      }
    },
    repositories: {
      type: new GraphQLNonNull(new GraphQLList(RepositoryType)),
      resolve(vc: ViewerContext) {
        return EntRepository.genForViewer(vc);
      }
    },
  },
});

export default ViewerType;
