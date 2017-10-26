/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import nullthrows from 'nullthrows';

import Button from '../common/ui/Button';
import ButtonWithAction from '../common/ui/ButtonWithAction';
import Spacing from '../common/ui/Spacing';
import Paragraph from '../common/ui/Paragraph';
import PageWithMenu from '../pages/ui/PageWithMenu';
import ModalDialog from '../common/ui/ModalDialog';
import UnlinkGitHubMutation from './mutations/UnlinkGitHubMutation';
import {
  SERVER_GITHUB_OAUTH_LOGIN_ACCOUNT,
} from '../../clientserver/urlPaths';

type PropType = {
  viewer: {
    user: {
      firstName: string,
    },
    githubAccess: ?{
      user: string,
    },
  },
  relay: Object,
};

class AccountPageWithData extends React.Component<PropType> {
  _unlinkGitHubModalDialog: ?ModalDialog;

  render(): ?React$Element<*> {
    return (
      <PageWithMenu
        pageTitle="Account"
        sections={[{
          menuTitle: 'GitHub',
          sectionTitle: 'GitHub',
          children: this._renderGitHubSection(),
        }]}
        width="normal"
      />
    );
  }

  _renderGitHubSection(): React$Element<*> {
    const {githubAccess} = this.props.viewer;

    if (githubAccess) {
      return (
        <div>
          <Paragraph>
            Connected to GitHub as:<br />
            <Button glyph="github" className={Spacing.margin.top.n12}>
              {githubAccess.user}
            </Button>
          </Paragraph>
          <Paragraph>
            You can unlink your GitHub account from Styledash, but Styledash
            will not be able to access any of your repositories and will not
            receive updates to them.
          </Paragraph>
          <Paragraph>
            <Button purpose="warning" onClick={this._showUnlinkModal}>
              Unlink GitHub account
            </Button>
            <ModalDialog
              body={
                <Paragraph className={Spacing.margin.vert.n12}>
                  This will <strong>disconnect all your repositories</strong> on
                  Styledash. Do you really wish to continue?
                </Paragraph>
              }
              renderPrimaryButton={modal =>
                <ButtonWithAction
                  onClick={this._unlinkGitHub}
                  purpose="warning">
                  Really unlink GitHub account
                </ButtonWithAction>
              }
              ref={c => this._unlinkGitHubModalDialog = c}
            />
          </Paragraph>
        </div>
      );
    } else {
      return (
        <div>
          <Button glyph="github" href={SERVER_GITHUB_OAUTH_LOGIN_ACCOUNT}>
            Connect to GitHub
          </Button>
        </div>
      );
    }
  }

  _showUnlinkModal = () => {
    nullthrows(this._unlinkGitHubModalDialog).show();
  }

  _hideUnlinkModal = () => {
    nullthrows(this._unlinkGitHubModalDialog).hide();
  }

  _unlinkGitHub = () => {
    this.props.relay.commitUpdate(
      new UnlinkGitHubMutation({
        viewer: this.props.viewer,
      }),
      {
        onSuccess: this._hideUnlinkModal,
      },
    );
  }
}

const AccountPageWithDataContainer = Relay.createContainer(
  AccountPageWithData,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${UnlinkGitHubMutation.getFragment('viewer')}
          user {
            firstName
          }
          githubAccess {
            user
          }
        }
      `,
    },
  },
);

export default AccountPageWithDataContainer;
