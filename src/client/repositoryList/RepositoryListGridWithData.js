/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import RepositoryListGrid from './ui/RepositoryListGrid';

class RepositoryListGridWithData extends React.Component<*> {
  render(): React$Element<*> {
    const {repositories} = this.props.viewer;
    return (
      <RepositoryListGrid
        repositories={
          repositories.map(r => ({
            name: r.name,
            id: r.repositoryID,
          }))
        }
      />
    );
  }
}

const RepositoryListGridWithDataContainer = Relay.createContainer(
  RepositoryListGridWithData,
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

export default RepositoryListGridWithDataContainer;
