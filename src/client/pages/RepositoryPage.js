/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import Link from '../common/ui/Link';
import PageWithMenu from './ui/PageWithMenu';

type PropType = {
  repository: ?{
    name: string,
    components: Array<{
      componentID: string,
      name: string,
    }>,
  },
};

class RepositoryPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {repository} = this.props;
    if (!repository) {
      // TODO 404 page. Use React error boundaries
      return null;
    }

    return (
      <PageWithMenu
        pageTitle={repository.name}
        sections={[{
          title: 'Header1',
          children: <div>header1</div>,
          subSections: [{
            title: 'Header1sub1',
            children: <div>sub1header1</div>,
          }],
        }, {
          title: 'Header2',
          children:
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
            </ul>,
        }]}
      />
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
