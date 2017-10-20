/** @flow */

import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} from 'graphql';

import { printError } from '../../../consoleUtil';
import genAddRepository from '../../genAddRepository';
import type { Context } from '../Context';
import RepositoryType from '../RepositoryType';
import ViewerType from '../ViewerType';

const AddRepositoryInput = new GraphQLInputObjectType({
  name: 'AddRepositoryInput',
  fields: {
    clientMutationId: { type: GraphQLString },
    name: { type: new GraphQLNonNull(GraphQLString) },
    githubRepoID: { type: new GraphQLNonNull(GraphQLInt) },
    githubRepoOwner: { type: new GraphQLNonNull(GraphQLString) },
    githubRepoName: { type: new GraphQLNonNull(GraphQLString) },
    rootCSS: { type: GraphQLString },
  },
});

const AddRepositoryPayload = new GraphQLObjectType({
  name: 'AddRepositoryPayload',
  fields: {
    clientMutationId: {
      type: GraphQLString,
      resolve: o => o.clientMutationId,
    },
    repository: {
      type: RepositoryType,
      resolve: o => o.repository,
    },
    viewer: {
      type: new GraphQLNonNull(ViewerType),
      resolve: o => o.viewer,
    },
  },
});

const field = {
  type: AddRepositoryPayload,
  args: { input: { type: AddRepositoryInput } },
  async resolve(
    _: mixed,
    args: {
      input: {
        clientMutationId: ?string,
        name: string,
        githubRepoID: number,
        githubRepoOwner: string,
        githubRepoName: string,
        rootCSS: ?string,
      },
    },
    context: Context,
  ) {
    const {
      name,
      githubRepoID,
      githubRepoOwner,
      githubRepoName,
      rootCSS,
      clientMutationId,
    } = args.input;

    try {
      const repo = await genAddRepository(
        context.vc,
        context.req,
        name,
        githubRepoID,
        githubRepoOwner,
        githubRepoName,
        rootCSS,
      );

      return {
        clientMutationId,
        repository: repo,
        viewer: context.vc,
      };
    }
    catch (err) {
      printError(err);
      return {
        clientMutationId,
        repository: null,
        viewer: context.vc,
      };
    }
  },
};

export default field;
