/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageHeader from './PageHeader';

type PropType = {
  viewer: Object,
};

class HomePage extends React.Component<PropType> {
  render(): React$Element<*> {
    return (
      <div>
        <PageHeader viewer={this.props.viewer} />
        why herro
      </div>
    );
  }
}

export default Relay.createContainer(
  HomePage,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${PageHeader.getFragment('viewer')}
        }
      `,
    },
  },
);
