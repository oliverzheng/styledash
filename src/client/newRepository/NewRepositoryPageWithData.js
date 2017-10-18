/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import {
  browserHistory,
} from 'react-router';

import AddRepositoryMutation from '../newRepository/mutations/AddRepositoryMutation';
import NewRepositoryWizard from './ui/NewRepositoryWizard';

type PropType = {
  viewer: {
    githubAccess: ?{
      user: string,
    },
  },
  relay: Object,
};

class NewRepositoryPageWithData extends React.Component<PropType> {
  render(): React$Node {
    const {githubAccess} = this.props.viewer;

    let github = null;
    if (githubAccess) {
      github = {
        username: githubAccess.user,
        repositories: [{
          repoID: 1,
          name: 'derp',
        }, {
          repoID: 2,
          name: 'herp',
        }, {
          repoID: 3,
          name: 'nerp',
        }, {
          repoID: 4,
          name: 'berp',
        }, {
          repoID: 5,
          name: 'berp',
        }, {
          repoID: 6,
          name: 'berp',
        }, {
          repoID: 7,
          name: 'berp',
        }],
      };
    }
    return (
      <NewRepositoryWizard github={github} />
    );
  }

  _addRepo = () => {
    const name = this.refs.name.getElement().value;
    const githubUser = this.refs.githubUser.getElement().value;
    const githubRepo = this.refs.githubRepo.getElement().value;
    const githubToken = this.refs.githubToken.getElement().value;
    const rootCSS = this.refs.rootCSS.value;

    if (!name || !githubUser || !githubRepo || !githubToken) {
      this.refs.addButton.resetClick();
      return;
    }

    this.props.relay.commitUpdate(
      new AddRepositoryMutation({
        name,
        githubUser,
        githubRepo,
        githubToken,
        rootCSS,
      }),
      {
        onSuccess: response => {
          const repoID =
            AddRepositoryMutation.getRepositoryIDFromResponse(response);
          if (repoID) {
            browserHistory.push(`/repository/${repoID}`);
          } else {
            // TODO whelp
          }
        },
      },
    );
  }
}

const NewRepositoryPageWithDataContainer = Relay.createContainer(
  NewRepositoryPageWithData,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          githubAccess {
            user
          }
        }
      `,
    },
  },
);

export default NewRepositoryPageWithDataContainer;
