/** @flow */

import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import type { Context } from '../Context';
import ViewerType from '../ViewerType';
import EntGitHubToken from '../../../entity/EntGitHubToken';

const UnlinkGitHubInput = new GraphQLInputObjectType({
  name: 'UnlinkGitHubInput',
  fields: {
    clientMutationId: { type: GraphQLString },
  },
});

const UnlinkGitHubPayload = new GraphQLObjectType({
  name: 'UnlinkGitHubPayload',
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
  type: UnlinkGitHubPayload,
  args: { input: { type: UnlinkGitHubInput } },
  async resolve(
    _: mixed,
    args: {
      input: {
        clientMutationId: ?string,
      },
    },
    context: Context,
  ) {
    const {
      clientMutationId,
    } = args.input;

    const token = await EntGitHubToken.genForViewer(context.vc);
    if (token) {
      await token.genDelete();
    }

    return {
      clientMutationId,
      viewer: context.vc,
    };
  },
};

export default field;
