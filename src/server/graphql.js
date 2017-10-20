/** @flow */

import {
  GraphQLSchema,
} from 'graphql';
import graphqlHTTP from 'express-graphql';

import RootQueryType from './graphqlTypes/RootQueryType';
import RootMutationType from './graphqlTypes/RootMutationType';

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
});

const graphQLHandlerOpts = {
  schema: schema,
};

export function graphqlAPI() {
  return graphqlHTTP((req, res) => ({
    ...graphQLHandlerOpts,
    context: {
      req,
      vc: req.vc,
    },
    graphiql: false,
  }));
}

export function graphiql() {
  return graphqlHTTP((req, res) => ({
    ...graphQLHandlerOpts,
    context: {
      req,
      vc: req.vc,
    },
    graphiql: true,
  }));
}
