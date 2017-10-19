/** @flow */

import React from 'react';
import classnames from 'classnames';
import titleCase from 'title-case';
import invariant from 'invariant';
import nullthrows from 'nullthrows';

import CardWizard from '../../common/ui/CardWizard';
import PageTitle from '../../pages/ui/PageTitle';
import FixedWidthPageContainer from '../../pages/ui/FixedWidthPageContainer';
import Spacing from '../../common/ui/Spacing';
import Paragraph from '../../common/ui/Paragraph';
import Button from '../../common/ui/Button';
import InputField from '../../common/ui/InputField';
import Textarea from '../../common/ui/Textarea';
import Select, { Option } from '../../common/ui/Select';

import './NewRepositoryWizard.css';

type Repo = {
  repoID: number,
  repoOwner: string,
  repoName: string,
};

type PropType = {
  github: ?{
    username: string,
    repositories: Array<Repo>,
  },
  addRepo: (
    name: string,
    repoID: number,
    repoOwner: string,
    repoName: string,
    rootCSS: ?string,
  ) => void,
};

type StateType = {
  selectedGitHubRepoID: ?number,
  repoName: ?string,
  css: ?string,
};

export default class NewRepositoryWizard extends React.Component<PropType, StateType> {
  state = {
    selectedGitHubRepoID: null,
    repoName: null,
    css: null,
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
            renderContent: this._renderFirstPage,
            canGoToNextPage: this.state.selectedGitHubRepoID != null,
          }, {
            name: 'Edit Details',
            renderContent: this._renderSecondPage,
            onEnter: this._setDefaultRepoName,
            canGoToNextPage: !!this.state.repoName,
          }]}
          onComplete={this._onComplete}
        />
      </FixedWidthPageContainer>
    );
  }

  _renderFirstPage = () => {
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
                {
                  repo.repoOwner === github.username
                    ? repo.repoName
                    : `${repo.repoOwner}/${repo.repoName}`
                }
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

        <div
          className={classnames(
            Spacing.margin.top.n32,
            Spacing.margin.bottom.n24,
            'NewRepositoryWizard-userInput',
          )}>
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

  _getGitHubRepoByID(repoID: number): ?Repo {
    const {github} = this.props;
    if (!github) {
      return null;
    }

    return nullthrows(github.repositories.filter(r => r.repoID === repoID)[0]);
  }

  _renderSecondPage = () => {
    return (
      <div
        className={
          classnames(Spacing.padding.horiz.n4, Spacing.padding.vert.n8)
        }>
        <div className={Spacing.margin.bottom.n32}>
          <Paragraph>
            Select a name for the repo on Styledash.
          </Paragraph>
          <div className="NewRepositoryWizard-userInput">
            <InputField
              defaultValue={this.state.repoName}
              placeholder="Name on Styledash"
              onChange={this._onRepoNameChange}
            />
          </div>
        </div>
        <div className={Spacing.margin.bottom.n32}>
          <Paragraph>
            Optionally add any global CSS required for all components to render
            correctly, such as fonts, colors, backgrounds, etc. This is usually
            what's in the <code>body</code> selector.
          </Paragraph>
          <div className="NewRepositoryWizard-userInput">
            <Textarea
              className="NewRepositoryWizard-textarea"
              placeholder={
              `
@import url(http://fontcss)
body {
  color: #CCC;
  font-family: 'Special Font';
}
              `.trim()
              }
              code
              onChange={this._onCSSChange}
            />
          </div>
        </div>
        <div className={Spacing.margin.bottom.n12}>
          <Paragraph>
            You'll be able to edit these in the settings later too.
          </Paragraph>
        </div>
      </div>
    );
  }

  _setDefaultRepoName = () => {
    const {selectedGitHubRepoID} = this.state;
    invariant(selectedGitHubRepoID != null, 'Should have a repoID now');

    const repo = nullthrows(this._getGitHubRepoByID(selectedGitHubRepoID));
    this.setState({
      repoName: titleCase(repo.repoName),
    });
  }

  _onRepoNameChange = (e: SyntheticInputEvent<*>) => {
    this.setState({
      repoName: e.target.value,
    });
  }

  _onCSSChange = (e: SyntheticInputEvent<*>) => {
    this.setState({
      css: e.target.value,
    });
  }

  _onComplete = () => {
    const {selectedGitHubRepoID} = this.state;
    invariant(selectedGitHubRepoID != null, 'Should have a repoID now');
    const repo = nullthrows(this._getGitHubRepoByID(selectedGitHubRepoID));

    this.props.addRepo(
      nullthrows(this.state.repoName),
      repo.repoID,
      repo.repoOwner,
      repo.repoName,
      this.state.css,
    );
  }
}
