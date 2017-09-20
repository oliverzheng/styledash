/** @flow */

import fs from 'fs';
import path from 'path';
import {buildSchema} from 'graphql';
import graphqlHTTP from 'express-graphql';
import nullthrows from 'nullthrows';

import ViewerContext from '../entity/vc';
import EntUser from '../entity/EntUser';
import EntRepository from '../entity/EntRepository';
import EntComponent from '../entity/EntComponent';
import EntExample from '../entity/EntExample';
import Viewer from './Viewer';

const schema = buildSchema(
  fs.readFileSync(path.resolve(__dirname, './schema.graphql')).toString()
);

// TODO this is currently broken. Need
// https://github.com/graphql/graphql-js/pull/947
// ... then why is this here? Has it never worked? Doesn't Relay need this?
// If it does end up working, make the enumeration of types automatic.
async function resolveNode(vc: ViewerContext, id: string): Promise<?Object> {
  const conn = vc.getDatabaseConnection();
  const separatorIndex = id.indexOf(':');
  let type: string;
  let objID: ?string = null
  if (separatorIndex !== -1) {
    type = id.substr(0, separatorIndex);
    objID = id.substr(separatorIndex + 1);
  } else {
    type = id;
  }

  switch (type) {
    case 'viewer':
      return new Viewer(vc);
    case 'repository':
      return await EntRepository.genNullable(vc, nullthrows(objID));
    case 'component':
      return await EntComponent.genNullable(vc, nullthrows(objID));
    case 'example':
      return await EntExample.genNullable(vc, nullthrows(objID));
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
  example: async (args: {exampleID: string}, context: Context) => {
    return await EntExample.genNullable(context.vc, args.exampleID);
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

  setExampleCode: async (
    args: {
      input: {
        exampleID: string,
        code: string,
        serializedElement: ?string,
        clientMutationId: string,
      },
    },
    context: Context,
  ) => {
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

  addExampleCode: async (
    args: {
      input: {
        componentID: string,
        exampleName: string,
        code: string,
        serializedElement: ?string,
        clientMutationId: string,
      },
    },
    context: Context,
  ) => {
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

const graphQLHandlerOpts = {
  schema: schema,
  rootValue: root,
};

export function graphqlAPI() {
  return graphqlHTTP((req, res) => ({
    ...graphQLHandlerOpts,
    context: {
      vc: req.vc,
    },
    graphiql: false,
  }));
}

export function graphiql() {
  return graphqlHTTP((req, res) => ({
    ...graphQLHandlerOpts,
    context: {
      vc: req.vc,
    },
    graphiql: true,
  }));
}
