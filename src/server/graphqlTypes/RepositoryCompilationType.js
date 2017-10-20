/** @flow */

import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} from 'graphql';

import EntRepositoryCompilation from '../../entity/EntRepositoryCompilation';
import { makeID } from './idUtil';
import NodeType from './NodeType';

export const REPOSITORY_COMPILATION_ID_PREFIX = 'repositorycompilation';

const RepositoryCompilationType = new GraphQLObjectType({
  name: 'RepositoryCompilation',
  interfaces: () => [NodeType],
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(compilation: EntRepositoryCompilation) {
        return makeID(REPOSITORY_COMPILATION_ID_PREFIX, compilation.getID());
      },
    },
    commitHash: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(compilation: EntRepositoryCompilation) {
        return compilation.getCommitHash();
      },
    },
    addedTimestamp: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve(compilation: EntRepositoryCompilation) {
        return compilation.getAddedTimestamp();
      },
    },
    compiledBundleURI: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(compilation: EntRepositoryCompilation) {
        return compilation.getCompiledBundleURI();
      },
    },
  }),
});

export default RepositoryCompilationType;
