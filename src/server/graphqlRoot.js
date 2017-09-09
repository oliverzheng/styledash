/** @flow */

import ViewerContext from '../entity/vc';
import EntUser from '../entity/EntUser';
import EntRepository from '../entity/EntRepository';
import EntComponent from '../entity/EntComponent';
import Viewer from './Viewer';

// TODO this is currently broken. Need
// https://github.com/graphql/graphql-js/pull/947
// ... then why is this here? Has it never worked? Doesn't Relay need this?
// If it does end up working, make the enumeration of types automatic.
async function resolveNode(vc: ViewerContext, id: string): Promise<?Object> {
  const conn = vc.getDatabaseConnection();
  const separatorIndex = id.indexOf(':');
  const type = id.substr(0, separatorIndex);
  const objID = id.substr(separatorIndex + 1);

  switch (type) {
    case 'viewer':
      return new Viewer(vc);
    case 'repository':
      return await EntRepository.genNullable(vc, objID);
    case 'component':
      return await EntComponent.genNullable(vc, objID);
  }

  return null;
}

type Context = {
  vc: ViewerContext,
};

const root = {
  // Query
  node: async (args: {id: string}, context: Context) => {
    return await resolveNode(context.vc, args.id);
  },
  viewer: (args: mixed, context: Context) => {
    return new Viewer(context.vc);
  },
  user: async (args: {userID: string}, context: Context) => {
    return await EntUser.genNullable(context.vc, args.userID);
  },
  repository: async (args: {repositoryID: string}, context: Context) => {
    return await EntRepository.genNullable(context.vc, args.repositoryID);
  },
  component: async (args: {componentID: string}, context: Context) => {
    return await EntComponent.genNullable(context.vc, args.componentID);
  },

  // Mutation
  overrideComponentReactDoc: async (
    args: {
      input: {
        componentID: string,
        overrideReactDoc: string,
        clientMutationId: string,
      },
    },
    context: Context,
  ) => {
    const {
      componentID,
      overrideReactDoc,
      clientMutationId,
    } = args.input;

    const component = await EntComponent.genEnforce(context.vc, componentID);
    const success = await component.genSetOverrideReactDoc(overrideReactDoc);
    return {
      clientMutationId,
      success,
      component,
    };
  },
};

export default root;