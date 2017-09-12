/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import FixedPageContainer from './ui/FixedPageContainer';
import PageTitle from './ui/PageTitle';
import RepositoryListGridWithData from '../repositoryList/RepositoryListGridWithData';

import '../common/ui/Spacing.css';

type PropType = {
  viewer: {
    repositories: Array<{
      repositoryID: string,
      name: string,
    }>,
  },
};

class RepositoryListPage extends React.Component<PropType> {
  render(): React$Element<*> {
    const {viewer} = this.props;
    return (
      <div>
        <PageHeader />
        <FixedPageContainer>
          <PageTitle className="Spacing-margin-bottom-28">
            Repositories
          </PageTitle>
          <RepositoryListGridWithData viewer={viewer} />
        </FixedPageContainer>
      </div>
    );
  }
}

const RepositoryListPageContainer = Relay.createContainer(
  RepositoryListPage,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${RepositoryListGridWithData.getFragment('viewer')}
        }
      `,
    },
  },
);

RepositoryListPageContainer.queries = {
  viewer: () => Relay.QL`query { viewer }`,
};

export default RepositoryListPageContainer;
