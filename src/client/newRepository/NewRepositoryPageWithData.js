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
      githubRepos: Array<{
        repoID: number,
        repoOwner: string,
        repoName: string,
      }>,
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
        repositories: githubAccess.githubRepos,
      };
    }
    return (
      <NewRepositoryWizard github={github} addRepo={this._addRepo} />
    );
  }

  _addRepo = (
    name: string,
    repoID: number,
    repoOwner: string,
    repoName: string,
    rootCSS: ?string,
  ) => {
    this.props.relay.commitUpdate(
      new AddRepositoryMutation({
        name,
        githubRepoID: repoID,
        githubRepoOwner: repoOwner,
        githubRepoName: repoName,
        rootCSS,
        viewer: this.props.viewer,
      }),
      {
        onSuccess: response => {
          const repoID =
            AddRepositoryMutation.getRepositoryIDFromResponse(response);
          if (repoID) {
            browserHistory.push(`/repository/${repoID}/settingUp`);
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
            githubRepos {
              repoID
              repoOwner
              repoName
            }
          }
          ${AddRepositoryMutation.getFragment('viewer')}
        }
      `,
    },
  },
);

export default NewRepositoryPageWithDataContainer;
