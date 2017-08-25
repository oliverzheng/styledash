/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './PageHeader';

type PropType = {
  repository: {
    name: string,
    components: Array<{
      componentID: string,
      name: string,
    }>,
  },
  viewer: Object,
};

class RepositoryPage extends React.Component<PropType> {
  render(): React$Element<*> {
    const {repository} = this.props;
    return (
      <div>
        <PageHeader viewer={this.props.viewer} />
        <p>repository name: {repository.name}</p>
        <p>Components:</p>
        <ul>
          {
            repository.components.map(c =>
              <li key={c.componentID}>
                <a href={`/component/${c.componentID}/`}>
                  {c.name}
                </a>
              </li>
            )
          }
        </ul>
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
