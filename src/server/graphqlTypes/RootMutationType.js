/** @flow */

import {
  GraphQLObjectType,
} from 'graphql';

import SetExampleCodeField from './mutations/SetExampleCodeField';
import AddExampleCodeField from './mutations/AddExampleCodeField';
import RefreshRepositoryField from './mutations/RefreshRepositoryField';
import AddRepositoryField from './mutations/AddRepositoryField';
import DeleteRepositoryField from './mutations/DeleteRepositoryField';

const RootMutationType = new GraphQLObjectType({
  name: 'RootMutationType',
  fields: {
    setExampleCode: SetExampleCodeField,
    addExampleCode: AddExampleCodeField,
    refreshRepository: RefreshRepositoryField,
    addRepository: AddRepositoryField,
    deleteRepository: DeleteRepositoryField,
  },
});

export default RootMutationType;
