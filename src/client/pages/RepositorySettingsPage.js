/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import RepositorySettingsPageWithData from '../repositorySettings/RepositorySettingsPageWithData';

type PropType = {
  repository: ?Object,
};

class RepositorySettingsPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {repository} = this.props;
    if (!repository) {
      // TODO 404 page. Use React error boundaries
      return null;
    }

    return (
      <div>
        <PageHeader />
        <RepositorySettingsPageWithData repository={repository} />
      </div>
    );
  }
}

const RepositorySettingsPageContainer = Relay.createContainer(
  RepositorySettingsPage,
  {
    fragments: {
      repository: () => Relay.QL`
        fragment on Repository {
          ${RepositorySettingsPageWithData.getFragment('repository')}
        }
      `,
    },
  },
);

RepositorySettingsPageContainer.queries = {
  repository: () => Relay.QL`
    query {
      repository(repositoryID: $repositoryID)
    }
  `,
};

export default RepositorySettingsPageContainer;
