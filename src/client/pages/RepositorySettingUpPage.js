/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import RepositorySettingUpPageWithData from '../newRepository/RepositorySettingUpPageWithData';

type PropType = {
  repository: ?Object,
};

class RepositorySettingUpPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {repository} = this.props;
    if (!repository) {
      // TODO 404 page. Use React error boundaries
      return null;
    }

    return (
      <div>
        <PageHeader />
        <RepositorySettingUpPageWithData
          repository={repository}
        />
      </div>
    );
  }
}

const RepositorySettingUpPageContainer = Relay.createContainer(
  RepositorySettingUpPage,
  {
    fragments: {
      repository: () => Relay.QL`
        fragment on Repository {
          ${RepositorySettingUpPageWithData.getFragment('repository')}
        }
      `,
    },
  },
);

RepositorySettingUpPageContainer.queries = {
  repository: () => Relay.QL`
    query {
      repository(repositoryID: $repositoryID)
    }
  `,
};

export default RepositorySettingUpPageContainer;
