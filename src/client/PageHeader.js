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
          <div className="PageHeader-user">
            {this.props.viewer.username}
          </div>
          <h2>Styledash</h2>
        </div>
        <div className="PageHeader-menu">
          <div>
            <Link href="/">
              Go home
            </Link>
          </div>
          <div>
            <Link href="/repository/17/">
              Go to repo #17
            </Link>
          </div>
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

