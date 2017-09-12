/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './PageHeaderWithData';
import Link from '../common/ui/Link';

type PropType = {
  repository: ?{
    name: string,
    components: Array<{
      componentID: string,
      name: string,
    }>,
  },
  viewer: Object,
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
        <PageHeader viewer={this.props.viewer} />
        <p>repository name: {repository.name}</p>
        <p>Components:</p>
        <ul>
          {
            repository.components.map(c =>
              <li key={c.componentID}>
                <Link href={`/component/${c.componentID}/`}>
                  {c.name}
                </Link>
              </li>
            )
          }
        </ul>
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
          name
          components {
            componentID
            name
          }
        }
      `,
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${PageHeader.getFragment('viewer')}
        }
      `,
    },
  },
);

RepositoryPageContainer.queries = {
  viewer: () => Relay.QL`
    query {
      viewer
    }
  `,
  repository: () => Relay.QL`
    query {
      repository(repositoryID: $repositoryID)
    }
  `,
};

export default RepositoryPageContainer;
