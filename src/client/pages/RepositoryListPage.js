/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './ui/PageHeader';
import FixedPageContainer from './ui/FixedPageContainer';
import PageTitle from './ui/PageTitle';
import Link from '../common/ui/Link';

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
          <PageTitle>
            Repositories
          </PageTitle>
          <ul>
            {
              viewer.repositories.map(repo =>
                <li key={repo.repositoryID}>
                  <Link href={`/repository/${repo.repositoryID}/`}>
                    {repo.name}
                  </Link>
                </li>
              )
            }
          </ul>
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
          repositories {
            repositoryID
            name
          }
        }
      `,
    },
  },
);

RepositoryListPageContainer.queries = {
  viewer: () => Relay.QL`query { viewer }`,
};

export default RepositoryListPageContainer;
