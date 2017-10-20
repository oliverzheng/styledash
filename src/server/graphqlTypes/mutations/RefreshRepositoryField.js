/** @flow */

import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import { genEnqueueRepoCompilation } from '../../../compile/compileRepoQueue';
import type { Context } from '../Context';
import RepositoryType from '../RepositoryType';
import EntRepository from '../../../entity/EntRepository';

const RefreshRepositoryInput = new GraphQLInputObjectType({
  name: 'RefreshRepositoryInput',
  fields: {
    clientMutationId: { type: GraphQLString },
    repositoryID: { type: new GraphQLNonNull(GraphQLID) },
  },
});

const RefreshRepositoryPayload = new GraphQLObjectType({
  name: 'RefreshRepositoryPayload',
  fields: {
    clientMutationId: {
      type: GraphQLString,
      resolve: o => o.clientMutationId,
    },
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: o => o.success,
    },
    repository: {
      type: new GraphQLNonNull(RepositoryType),
      resolve: o => o.repository,
    },
  },
});

const field = {
  type: RefreshRepositoryPayload,
  args: { input: { type: RefreshRepositoryInput } },
  async resolve(
    _: mixed,
    args: {
      input: {
        repositoryID: string,
        clientMutationId: ?string,
      },
    },
    context: Context,
  ) {
    const {
      repositoryID,
      clientMutationId,
    } = args.input;

    const repo = await EntRepository.genEnforce(context.vc, repositoryID);
    await genEnqueueRepoCompilation(repo);
    return {
      clientMutationId,
      success: true,
    };
  },
};

export default field;
