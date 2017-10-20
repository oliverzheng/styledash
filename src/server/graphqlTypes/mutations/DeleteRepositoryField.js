/** @flow */

import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import { printError } from '../../../consoleUtil';
import genDeleteRepository from '../../genDeleteRepository';
import type { Context } from '../Context';
import ViewerType from '../ViewerType';
import EntRepository from '../../../entity/EntRepository';

const DeleteRepositoryInput = new GraphQLInputObjectType({
  name: 'DeleteRepositoryInput',
  fields: {
    clientMutationId: { type: GraphQLString },
    repositoryID: { type: new GraphQLNonNull(GraphQLID) },
  },
});

const DeleteRepositoryPayload = new GraphQLObjectType({
  name: 'DeleteRepositoryPayload',
  fields: {
    clientMutationId: {
      type: GraphQLString,
      resolve: o => o.clientMutationId,
    },
    viewer: {
      type: new GraphQLNonNull(ViewerType),
      resolve: o => o.viewer,
    },
  },
});

const field = {
  type: DeleteRepositoryPayload,
  args: { input: { type: DeleteRepositoryInput } },
  async resolve(
    _: mixed,
    args: {
      input: {
        clientMutationId: ?string,
        repositoryID: string,
      },
    },
    context: Context,
  ) {
    const {
      repositoryID,
      clientMutationId,
    } = args.input;

    try {
      const repo = await EntRepository.genEnforce(context.vc, repositoryID);
      await genDeleteRepository(repo);

      return {
        clientMutationId,
        viewer: context.vc,
      };
    }
    catch (err) {
      printError(err);
      return {
        clientMutationId,
        viewer: context.vc,
      };
    }
  },
};

export default field;
