/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import {
  browserHistory,
} from 'react-router';

import PageHeader from './ui/PageHeader';
import PageTitle from './ui/PageTitle';
import FixedWidthPageContainer from './ui/FixedWidthPageContainer';
import Spacing from '../common/ui/Spacing';
import InputField from '../common/ui/InputField';
import ButtonWithAction from '../common/ui/ButtonWithAction';
import AddRepositoryMutation from '../newRepository/mutations/AddRepositoryMutation';

class NewRepositoryPage extends React.Component<*> {
  render(): React$Node {
    return (
      <div>
        <PageHeader />
        <FixedWidthPageContainer wide={false}>
          <PageTitle className={Spacing.margin.bottom.n20}>
            Add New Repository
          </PageTitle>
          <div>
            <InputField ref="name" placeholder="Name" /><br />
            <InputField ref="githubUser" placeholder="GitHub Username" /><br />
            <InputField ref="githubRepo" placeholder="GitHub Repo" /><br />
            <InputField ref="githubToken" placeholder="GitHub Token" /><br />
            RootCSS: <br />
            <textarea ref="rootCSS" /><br />
            <ButtonWithAction onClick={this._addRepo} ref="addButton">
              Add New Repository
            </ButtonWithAction>
          </div>
        </FixedWidthPageContainer>
      </div>
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

const NewRepositoryPageContainer = Relay.createContainer(
  NewRepositoryPage,
  {
    fragments: {
    },
  },
);

NewRepositoryPageContainer.queries = {
};

export default NewRepositoryPageContainer;
