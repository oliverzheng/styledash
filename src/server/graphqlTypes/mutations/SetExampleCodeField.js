/** @flow */

import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import type { Context } from '../Context';
import ExampleType from '../ExampleType';
import EntExample from '../../../entity/EntExample';

const SetExampleCodeInput = new GraphQLInputObjectType({
  name: 'SetExampleCodeInput',
  fields: {
    clientMutationId: { type: GraphQLString },
    exampleID: { type: new GraphQLNonNull(GraphQLID) },
    code: { type: new GraphQLNonNull(GraphQLString) },
    serializedElement: { type: GraphQLString },
  },
});

const SetExampleCodePayload = new GraphQLObjectType({
  name: 'SetExampleCodePayload',
  fields: {
    clientMutationId: {
      type: GraphQLString,
      resolve: o => o.clientMutationId,
    },
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: o => o.success,
    },
    example: {
      type: new GraphQLNonNull(ExampleType),
      resolve: o => o.example,
    },
  },
});

const field = {
  type: SetExampleCodePayload,
  args: { input: { type: SetExampleCodeInput } },
  async resolve(
    _: mixed,
    args: {
      input: {
        clientMutationId: ?string,
        exampleID: string,
        code: string,
        serializedElement: ?string,
      },
    },
    context: Context,
  ) {
    const {
      exampleID,
      code,
      serializedElement,
      clientMutationId,
    } = args.input;

    const example = await EntExample.genEnforce(context.vc, exampleID);
    const success = await example.genSetCode(code, serializedElement);
    return {
      clientMutationId,
      success,
      example,
    };
  },
};

export default field;
