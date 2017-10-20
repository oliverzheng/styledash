/** @flow */

import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import EntExample from '../../entity/EntExample';
import { makeID } from './idUtil';
import NodeType from './NodeType';
import ComponentType from './ComponentType';

export const EXAMPLE_ID_PREFIX = 'example';

const ExampleType = new GraphQLObjectType({
  name: 'Example',
  interfaces: () => [NodeType],
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(example: EntExample) {
        return makeID(EXAMPLE_ID_PREFIX, example.getID());
      },
    },
    exampleID: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(example: EntExample) {
        return example.getID();
      },
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(example: EntExample) {
        return example.getName();
      },
    },
    component: {
      type: new GraphQLNonNull(ComponentType),
      resolve(example: EntExample) {
        return example.genComponent();
      },
    },
    code: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(example: EntExample) {
        return example.getCode();
      },
    },
    serializedElement: {
      type: GraphQLString,
      resolve(example: EntExample) {
        return example.getSerializedElement();
      },
    },
  }),
});

export default ExampleType;
