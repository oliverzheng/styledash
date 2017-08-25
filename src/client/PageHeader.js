/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

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
            <a href="/">
              Go home
            </a>
          </div>
          <div>
            <a href="/repository/17/">
              Go to repo #17
            </a>
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

