/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './PageHeader';

type PropType = {
  repository: {
    id: string,
    name: string,
  },
  viewer: Object,
};

class RepositoryPage extends React.Component<PropType> {
  render(): React$Element<*> {
    return (
      <div>
        <PageHeader viewer={this.props.viewer} />
        repository name: {this.props.repository.name}
      </div>
    );
  }
}

export default Relay.createContainer(
  RepositoryPage,
  {
    fragments: {
      repository: () => Relay.QL`
        fragment on Repository {
          id
          name
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
