/** @flow */

import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import EntUser from '../../entity/EntUser';
import { makeID } from './idUtil';
import NodeType from './NodeType';

export const USER_ID_PREFIX = 'user';

const UserType = new GraphQLObjectType({
  name: 'User',
  interfaces: () => [NodeType],
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(user: EntUser) {
        return makeID(USER_ID_PREFIX, user.getID());
      },
    },
    userID: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(user: EntUser) {
        return user.getID();
      },
    },
    firstName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(user: EntUser) {
        return user.getFirstName();
      },
    },
    lastName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(user: EntUser) {
        return user.getLastName();
      },
    },
    fullName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(user: EntUser) {
        return user.getFullName();
      },
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(user: EntUser) {
        return user.getEmail();
      },
    },
  },
});

export default UserType;
