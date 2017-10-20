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
import ComponentType from '../ComponentType';
import EntExample from '../../../entity/EntExample';

const AddExampleCodeInput = new GraphQLInputObjectType({
  name: 'AddExampleCodeInput',
  fields: {
    clientMutationId: { type: GraphQLString },
    componentID: { type: new GraphQLNonNull(GraphQLID) },
    exampleName: { type: new GraphQLNonNull(GraphQLString) },
    code: { type: new GraphQLNonNull(GraphQLString) },
    serializedElement: { type: GraphQLString },
  },
});

const AddExampleCodePayload = new GraphQLObjectType({
  name: 'AddExampleCodePayload',
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
    component: {
      type: new GraphQLNonNull(ComponentType),
      resolve: o => o.component,
    },
  },
});

const field = {
  type: AddExampleCodePayload,
  args: { input: { type: AddExampleCodeInput } },
  async resolve(
    _: mixed,
    args: {
      input: {
        clientMutationId: ?string,
        componentID: string,
        exampleName: string,
        code: string,
        serializedElement: ?string,
      },
    },
    context: Context,
  ) {
    const {
      componentID,
      exampleName,
      code,
      serializedElement,
      clientMutationId,
    } = args.input;

    const example = await EntExample.genCreate(
      context.vc,
      componentID,
      exampleName,
      code,
      serializedElement,
    );
    const component = await example.genComponent();
    return {
      clientMutationId,
      success: true,
      component,
      example,
    };
  },
};

export default field;
