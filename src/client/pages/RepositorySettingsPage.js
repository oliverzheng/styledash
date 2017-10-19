/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import RepositorySettingsPageWithData from '../repositorySettings/RepositorySettingsPageWithData';

type PropType = {
  repository: ?Object,
  viewer: Object,
};

class RepositorySettingsPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {repository, viewer} = this.props;
    if (!repository) {
      // TODO 404 page. Use React error boundaries
      return null;
    }

    return (
      <div>
        <PageHeader />
        <RepositorySettingsPageWithData
          repository={repository}
          viewer={viewer}
        />
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
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${RepositorySettingsPageWithData.getFragment('viewer')}
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
  viewer: () => Relay.QL`
    query {
      viewer
    }
  `,
};

export default RepositorySettingsPageContainer;
