/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import RepositoryPageWithData from '../repository/RepositoryPageWithData';

type PropType = {
  repository: ?Object,
};

class RepositoryPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {repository} = this.props;
    if (!repository) {
      // TODO 404 page. Use React error boundaries
      return null;
    }

    return (
      <div>
        <PageHeader />
        <RepositoryPageWithData repository={repository} />
      </div>
    );
  }
}

const RepositoryPageContainer = Relay.createContainer(
  RepositoryPage,
  {
    fragments: {
      repository: () => Relay.QL`
        fragment on Repository {
          ${RepositoryPageWithData.getFragment('repository')}
        }
      `,
    },
  },
);

RepositoryPageContainer.queries = {
  repository: () => Relay.QL`
    query {
      repository(repositoryID: $repositoryID)
    }
  `,
};

export default RepositoryPageContainer;
