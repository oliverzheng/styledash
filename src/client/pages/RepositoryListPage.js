/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import FixedWidthPageContainer from './ui/FixedWidthPageContainer';
import PageTitle from './ui/PageTitle';
import RepositoryListGridWithData from '../repositoryList/RepositoryListGridWithData';
import Spacing from '../common/ui/Spacing';

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
        <FixedWidthPageContainer>
          <PageTitle className={Spacing.margin.bottom.n28}>
            Repositories
          </PageTitle>
          <RepositoryListGridWithData viewer={viewer} />
        </FixedWidthPageContainer>
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
