/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import nullthrows from 'nullthrows';

import PageWithMenu from '../pages/ui/PageWithMenu';
import ButtonWithAction from '../common/ui/ButtonWithAction';
import RefreshRepositoryMutation from './mutations/RefreshRepositoryMutation';

type PropType = {
  repository: {
    repositoryID: string,
    name: string,
  },
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
        }]}
        wide={false}
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
        }
      `,
    },
  },
);

export default RepositorySettingsPageWithDataContainer;
