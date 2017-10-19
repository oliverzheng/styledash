/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import nullthrows from 'nullthrows';
import {
  browserHistory,
} from 'react-router';

import PageWithMenu from '../pages/ui/PageWithMenu';
import ButtonWithAction from '../common/ui/ButtonWithAction';
import Paragraph from '../common/ui/Paragraph';
import RefreshRepositoryMutation from './mutations/RefreshRepositoryMutation';
import DeleteRepositoryMutation from './mutations/DeleteRepositoryMutation';
import {
  REPOSITORY_LIST_PATH,
} from '../../clientserver/urlPaths';

type PropType = {
  repository: {
    repositoryID: string,
    name: string,
  },
  viewer: Object,
  relay: Object,
};

class RepositorySettingsPageWithData extends React.Component<PropType> {
  _refreshButton: ?ButtonWithAction;

  render(): ?React$Element<*> {
    const {repository} = this.props;

    return (
      <PageWithMenu
        pageTitle={repository.name + ' Settings'}
        sections={[{
          menuTitle: 'General',
          sectionTitle: 'General Settings',
          children: (
            <div>
              <ButtonWithAction
                ref={c => this._refreshButton = c}
                onClick={this._onRefreshRepoClick}>
                Refresh repository
              </ButtonWithAction>
            </div>
          ),
        }, {
          menuTitle: 'Delete Repository',
          sectionTitle: 'Delete Repository',
          children: (
            <div>
              <Paragraph>
                This deletes this repository on Styledash along with all its
                components and examples.
              </Paragraph>
              <Paragraph>
                This cannot be undone.
              </Paragraph>
              <ButtonWithAction
                purpose="warning"
                onClick={this._onDeleteRepoClick}>
                Delete repository
              </ButtonWithAction>
            </div>
          ),
        }]}
        width="normal"
      />
    );
  }

  _onRefreshRepoClick = () => {
    this.props.relay.commitUpdate(
      new RefreshRepositoryMutation({
        repository: this.props.repository,
      }),
      {
        onSuccess: () => {
          nullthrows(this._refreshButton).resetClick();
        },
      },
    );
  }

  _onDeleteRepoClick = () => {
    this.props.relay.commitUpdate(
      new DeleteRepositoryMutation({
        repository: this.props.repository,
        viewer: this.props.viewer,
      }),
      {
        onSuccess: () => {
          browserHistory.push(REPOSITORY_LIST_PATH);
        },
      },
    );
  }
}

const RepositorySettingsPageWithDataContainer = Relay.createContainer(
  RepositorySettingsPageWithData,
  {
    fragments: {
      repository: () => Relay.QL`
        fragment on Repository {
          repositoryID
          name
          ${RefreshRepositoryMutation.getFragment('repository')}
          ${DeleteRepositoryMutation.getFragment('repository')}
        }
      `,
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${DeleteRepositoryMutation.getFragment('viewer')}
        }
      `,
    },
  },
);

export default RepositorySettingsPageWithDataContainer;
