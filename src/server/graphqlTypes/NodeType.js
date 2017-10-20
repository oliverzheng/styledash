/** @flow */

import invariant from 'invariant';
import {
  GraphQLInterfaceType,
  GraphQLID,
  GraphQLNonNull,
} from 'graphql';

import ViewerContext from '../../entity/vc';
import EntUser from '../../entity/EntUser';
import GitHubRepo from '../../entity/GitHubRepo';
import EntGitHubToken from '../../entity/EntGitHubToken';
import EntRepository from '../../entity/EntRepository';
import EntRepositoryCompilation from '../../entity/EntRepositoryCompilation';
import EntComponent from '../../entity/EntComponent';
import EntExample from '../../entity/EntExample';

import ViewerType from './ViewerType';
import UserType from './UserType';
import GitHubRepoType from './GitHubRepoType';
import GitHubAccessType from './GitHubAccessType';
import RepositoryType from './RepositoryType';
import RepositoryCompilationType from './RepositoryCompilationType';
import ComponentType from './ComponentType';
import ExampleType from './ExampleType';

const NodeType = new GraphQLInterfaceType({
  name: 'Node',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  resolveType(obj) {
    if (obj instanceof ViewerContext) {
      return ViewerType;
    } else if (obj instanceof EntUser) {
      return UserType;
    } else if (obj instanceof GitHubRepo) {
      return GitHubRepoType;
    } else if (obj instanceof EntGitHubToken) {
      return GitHubAccessType;
    } else if (obj instanceof EntRepository) {
      return RepositoryType;
    } else if (obj instanceof EntRepositoryCompilation) {
      return RepositoryCompilationType;
    } else if (obj instanceof EntComponent) {
      return ComponentType;
    } else if (obj instanceof EntExample) {
      return ExampleType;
    }
    invariant(false, 'Cannot resolve type for obj');
  },
});

export default NodeType;
