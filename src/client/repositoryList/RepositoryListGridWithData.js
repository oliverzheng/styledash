/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import RepositoryListGrid from './ui/RepositoryListGrid';
import Button from '../common/ui/Button';
import Spacing from '../common/ui/Spacing';
import {
  NEW_REPOSITORY_PATH,
} from '../../clientserver/urlPaths';

class RepositoryListGridWithData extends React.Component<*> {
  render(): React$Element<*> {
    const {repositories} = this.props.viewer;
    return (
      <div>
        <RepositoryListGrid
          className={Spacing.margin.bottom.n28}
          repositories={
            repositories.map(r => ({
              name: r.name,
              id: r.repositoryID,
              componentsCount: r.componentsCount,
              lastUpdatedTimestamp: r.lastUpdatedTimestamp,
            }))
          }
        />
        <Button href={NEW_REPOSITORY_PATH} glyph="plus">
          Add Repository
        </Button>
      </div>
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
            componentsCount
            lastUpdatedTimestamp
          }
        }
      `,
    },
  },
);

export default RepositoryListGridWithDataContainer;
