/** @flow */

import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';

import EntComponent from '../../entity/EntComponent';
import { makeID } from './idUtil';
import NodeType from './NodeType';
import ExampleType from './ExampleType';
import RepositoryType from './RepositoryType';

export const COMPONENT_ID_PREFIX = 'component';

const ComponentType = new GraphQLObjectType({
  name: 'Component',
  interfaces: () => [NodeType],
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(component: EntComponent) {
        return makeID(COMPONENT_ID_PREFIX, component.getID());
      },
    },
    componentID: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(component: EntComponent) {
        return component.getID();
      },
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(component: EntComponent) {
        return component.getName();
      },
    },
    repository: {
      type: new GraphQLNonNull(RepositoryType),
      resolve(component: EntComponent) {
        return component.genRepository();
      },
    },
    filepath: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(component: EntComponent) {
        return component.getFilepath();
      },
    },
    reactDoc: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(component: EntComponent) {
        return component.genReactDoc();
      },
    },
    gthubURL: {
      type: GraphQLString,
      resolve(component: EntComponent) {
        return component.genGitHubURL();
      },
    },
    examples: {
      type: new GraphQLNonNull(new GraphQLList(ExampleType)),
      resolve(component: EntComponent) {
        return component.genExamples();
      },
    },
  }),
});

export default ComponentType;
