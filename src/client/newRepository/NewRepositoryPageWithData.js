/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import {
  browserHistory,
} from 'react-router';

import CardWizard from '../common/ui/CardWizard';
import PageTitle from '../pages/ui/PageTitle';
import FixedWidthPageContainer from '../pages/ui/FixedWidthPageContainer';
import Spacing from '../common/ui/Spacing';
import InputField from '../common/ui/InputField';
import AddRepositoryMutation from '../newRepository/mutations/AddRepositoryMutation';

type PropType = {
  viewer: {
  },
  relay: Object,
};

class NewRepositoryPageWithData extends React.Component<PropType> {
  render(): React$Node {
    return (
      <FixedWidthPageContainer width="narrow">
        <PageTitle className={Spacing.margin.bottom.n36}>
          Add New Repository
        </PageTitle>
        <CardWizard
          pages={[{
            name: 'Select Repository',
            content: (
              <div>
                <InputField ref="name" placeholder="Name" /><br />
                <InputField ref="githubUser" placeholder="GitHub Username" /><br />
                <InputField ref="githubRepo" placeholder="GitHub Repo" /><br />
                <InputField ref="githubToken" placeholder="GitHub Token" /><br />
                RootCSS: <br />
                <textarea ref="rootCSS" /><br />
              </div>
            ),
            canGoToNextPage: true,
          }, {
            name: 'Edit Details',
            content: (
              <div>Edit stuff</div>
            ),
            canGoToNextPage: true,
          }]}
          onComplete={() => {}}
        />
      </FixedWidthPageContainer>
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
            id
          }
        }
      `,
    },
  },
);

export default NewRepositoryPageWithDataContainer;
