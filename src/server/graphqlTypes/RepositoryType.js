/** @flow */

import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';

import EntRepository from '../../entity/EntRepository';
import { makeID } from './idUtil';
import NodeType from './NodeType';
import ComponentType from './ComponentType';
import RepositoryCompilationType from './RepositoryCompilationType';

export const REPOSITORY_ID_PREFIX = 'repository';

const RepositoryType = new GraphQLObjectType({
  name: 'Repository',
  interfaces: () => [NodeType],
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(repository: EntRepository) {
        return makeID(REPOSITORY_ID_PREFIX, repository.getID());
      },
    },
    repositoryID: {
      type: new GraphQLNonNull(GraphQLID),
      resolve(repository: EntRepository) {
        return repository.getID();
      },
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(repository: EntRepository) {
        return repository.getName();
      },
    },
    externalCSSURI: {
      type: GraphQLString,
      resolve(repository: EntRepository) {
        return repository.getExternalCSSUrl();
      },
    },
    rootCSS: {
      type: GraphQLString,
      resolve(repository: EntRepository) {
        return repository.getRootCSS();
      },
    },
    lastUpdatedTimestamp: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve(repository: EntRepository) {
        return repository.getLastUpdatedTimestamp();
      },
    },
    componentsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve(repository: EntRepository) {
        return repository.genComponentsCount();
      },
    },
    components: {
      type: new GraphQLNonNull(new GraphQLList(ComponentType)),
      resolve(repository: EntRepository) {
        return repository.genComponents();
      },
    },
    currentCompilation: {
      type: RepositoryCompilationType,
      resolve(repository: EntRepository) {
        return repository.genCurrentRepositoryCompilation();
      },
    },
  }),
});

export default RepositoryType;
