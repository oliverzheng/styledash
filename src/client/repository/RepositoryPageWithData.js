/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import RepositoryComponentsPageWithMenu from './ui/RepositoryComponentsPageWithMenu';

type PropType = {
  repository: {
    repositoryID: string,
    name: string,
    components: Array<{
      componentID: string,
      name: string,
      filepath: string,
    }>,
  },
};

class RepositoryPageWithData extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {repository} = this.props;

    return (
      <RepositoryComponentsPageWithMenu
        repository={{
          id: repository.repositoryID,
          name: repository.name,
          components: repository.components.map(c => ({
            filepath: c.filepath,
            data: {
              componentID: c.componentID,
              name: c.name,
            },
          })),
        }}
      />
    );
  }
}

const RepositoryPageWithDataContainer = Relay.createContainer(
  RepositoryPageWithData,
  {
    fragments: {
      repository: () => Relay.QL`
        fragment on Repository {
          repositoryID
          name
          components {
            componentID
            name
            filepath
          }
        }
      `,
    },
  },
);

export default RepositoryPageWithDataContainer;
