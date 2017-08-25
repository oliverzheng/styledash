/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './PageHeader';
import Link from './Link';

type PropType = {
  viewer: {
    repositories: Array<{
      repositoryID: string,
      name: string,
    }>,
  },
};

class HomePage extends React.Component<PropType> {
  render(): React$Element<*> {
    const {viewer} = this.props;
    return (
      <div>
        <PageHeader viewer={viewer} />
        <p>why herro</p>
        <p>here are some repos</p>
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
      </div>
    );
  }
}

const HomePageContainer = Relay.createContainer(
  HomePage,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${PageHeader.getFragment('viewer')}
          repositories {
            repositoryID
            name
          }
        }
      `,
    },
  },
);

HomePageContainer.queries = {
  viewer: () => Relay.QL`query { viewer }`,
};

export default HomePageContainer;
