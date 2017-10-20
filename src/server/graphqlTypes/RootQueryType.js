/** @flow */

import invariant from 'invariant';
import nullthrows from 'nullthrows';
import {
  GraphQLObjectType,
  GraphQLID,
} from 'graphql';

import EntUser from '../../entity/EntUser';
import GitHubRepo from '../../entity/GitHubRepo';
import EntGitHubToken from '../../entity/EntGitHubToken';
import EntRepository from '../../entity/EntRepository';
import EntRepositoryCompilation from '../../entity/EntRepositoryCompilation';
import EntComponent from '../../entity/EntComponent';
import EntExample from '../../entity/EntExample';
import { splitID } from './idUtil';

import NodeType from './NodeType';
import UserType, { USER_ID_PREFIX } from './UserType';
import ViewerType, { VIEWER_ID_PREFIX } from './ViewerType';
import { GITHUB_REPO_ID_PREFIX } from './GitHubRepoType';
import { GITHUB_ACCESS_ID_PREFIX } from './GitHubAccessType';
import RepositoryType, { REPOSITORY_ID_PREFIX } from './RepositoryType';
import { REPOSITORY_COMPILATION_ID_PREFIX } from './RepositoryCompilationType';
import ComponentType, { COMPONENT_ID_PREFIX } from './ComponentType';
import ExampleType, { EXAMPLE_ID_PREFIX } from './ExampleType';

import type { Context } from './Context';

const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    node: {
      type: NodeType,
      args: {
        id: {
          type: GraphQLID,
        },
      },
      resolve(_, args: {id: string}, context: Context) {
        const {vc} = context;
        const {type, objID} = splitID(args.id);

        switch (type) {
          case VIEWER_ID_PREFIX:
            return context.vc;
          case USER_ID_PREFIX:
            return EntUser.genNullable(vc, nullthrows(objID));
          case GITHUB_REPO_ID_PREFIX:
            return GitHubRepo.deserialize(nullthrows(objID));
          case GITHUB_ACCESS_ID_PREFIX:
            return EntGitHubToken.genNullable(vc, nullthrows(objID));
          case REPOSITORY_ID_PREFIX:
            return EntRepository.genNullable(vc, nullthrows(objID));
          case REPOSITORY_COMPILATION_ID_PREFIX:
            return EntRepositoryCompilation.genNullable(vc, nullthrows(objID));
          case COMPONENT_ID_PREFIX:
            return EntComponent.genNullable(vc, nullthrows(objID));
          case EXAMPLE_ID_PREFIX:
            return EntExample.genNullable(vc, nullthrows(objID));
          default:
            invariant(false, 'Unexpected type %s', type);
        }
      },
    },
    viewer: {
      type: ViewerType,
      resolve(_, args, context: Context) {
        return context.vc;
      },
    },
    user: {
      type: UserType,
      args: {
        userID: {
          type: GraphQLID,
        },
      },
      resolve(_, args: {userID: string}, context: Context) {
        return EntUser.genNullable(context.vc, args.userID);
      },
    },
    repository: {
      type: RepositoryType,
      args: {
        repositoryID: {
          type: GraphQLID,
        },
      },
      resolve(_, args: {repositoryID: string}, context: Context) {
        return EntRepository.genNullable(context.vc, args.repositoryID);
      },
    },
    component: {
      type: ComponentType,
      args: {
        componentID: {
          type: GraphQLID,
        },
      },
      resolve(_, args: {componentID: string}, context: Context) {
        return EntComponent.genNullable(context.vc, args.componentID);
      },
    },
    example: {
      type: ExampleType,
      args: {
        exampleID: {
          type: GraphQLID,
        },
      },
      resolve(_, args: {exampleID: string}, context: Context) {
        return EntExample.genNullable(context.vc, args.exampleID);
      },
    },
  },
});

export default RootQueryType;
