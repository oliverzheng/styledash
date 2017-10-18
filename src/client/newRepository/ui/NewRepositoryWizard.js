/** @flow */

import React from 'react';
import classnames from 'classnames';
import invariant from 'invariant';

import CardWizard from '../../common/ui/CardWizard';
import PageTitle from '../../pages/ui/PageTitle';
import FixedWidthPageContainer from '../../pages/ui/FixedWidthPageContainer';
import Spacing from '../../common/ui/Spacing';
import Paragraph from '../../common/ui/Paragraph';
import Button from '../../common/ui/Button';
import Select, { Option } from '../../common/ui/Select';

import './NewRepositoryWizard.css';

type PropType = {
  github: ?{
    username: string,
    repositories: Array<{
      repoID: number,
      name: string,
    }>,
  },
};

type StateType = {
  selectedGitHubRepoID: ?number,
};

export default class NewRepositoryWizard extends React.Component<PropType, StateType> {
  state = {
    selectedGitHubRepoID: null,
  };

  render(): React$Node {
    return (
      <FixedWidthPageContainer
        className="NewRepositoryWizard-root"
        width="narrow">
        <PageTitle className={Spacing.margin.bottom.n36}>
          Add New Repository
        </PageTitle>
        <CardWizard
          pages={[{
            name: 'Select Repository',
            content: this._renderFirstPage(),
            canGoToNextPage: true,
          }, {
            name: 'Edit Details',
            content: this._renderSecondPage(),
            canGoToNextPage: true,
          }]}
          onComplete={() => {}}
        />
      </FixedWidthPageContainer>
    );
  }

  _renderFirstPage() {
    const {github} = this.props;

    let connectButton;
    let selectRepoButton;
    if (github) {
      connectButton = (
        <Button glyph="github">
          Connected as {github.username}
        </Button>
      );
      selectRepoButton = (
        <Select
          className={classnames(
            'NewRepositoryWizard-repositorySelect',
            Spacing.margin.left.n16,
          )}
          onChange={this._onGitHubRepoChange}
          placeholder="Select a repository">
          {
            github.repositories.map(repo =>
              <Option
                key={repo.repoID}
                value={repo.repoID}
                selected={repo.repoID === this.state.selectedGitHubRepoID}>
                {repo.name}
              </Option>
            )
          }
        </Select>
      );
    } else {
      connectButton = (
        <Button glyph="github">
          Connect to GitHub
        </Button>
      );
      selectRepoButton = (
        <Select
          className={Spacing.margin.left.n16}
          disabled={true}
          placeholder="Select a repository"
        />
      );
    }

    return (
      <div
        className={
          classnames(Spacing.padding.horiz.n4, Spacing.padding.vert.n8)
        }>
        <Paragraph>
          Styledash parses a GitHub repository and identifies React components.
          The list of components is automatically updated whenever there is an
          update to the repository.
        </Paragraph>
        <Paragraph>
          Connect to your GitHub account and select a repository to get started.
        </Paragraph>

        <div className="NewRepositoryWizard-actionButtons">
          {connectButton}
          {selectRepoButton}
        </div>
      </div>
    );
  }

  _onGitHubRepoChange = (repoID: mixed) => {
    invariant(typeof repoID === 'number', 'flow');
    this.setState({
      selectedGitHubRepoID: repoID,
    });
  }

  _renderSecondPage() {
    return <div>Edit stuff</div>;
  }
}
