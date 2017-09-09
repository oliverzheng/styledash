/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import Link from './Link';

import './PageHeader.css';

type PropType = {
  viewer: {
    username: string,
  },
};

class PageHeader extends React.Component<PropType> {
  render(): React$Element<*> {
    return (
      <div>
        <div className="PageHeader-header">
          <Link href="/" className="PageHeader-homeLink">
            Go home
          </Link>
          <div className="PageHeader-user">
            {this.props.viewer.username}
            {' '}
            <Link href="/logout">Logout</Link>
          </div>
          <h2>Styledash</h2>
        </div>
      </div>
    );
  }
}

export default Relay.createContainer(
  PageHeader,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          username
        }
      `,
    },
  },
);

