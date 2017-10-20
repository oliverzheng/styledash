/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import {
  browserHistory,
} from 'react-router';

import RepositorySettingUpCard from './ui/RepositorySettingUpCard';

const CHECK_PERIOD = 5000;

type PropType = {
  repository: {
    repositoryID: string,
    name: string,
    currentCompilation: ?{
      id: string,
    },
  },
  relay: Object,
};

class RepositorySettingUpPageWithData extends React.Component<PropType> {
  _intervalToken: ?number;

  constructor(props: PropType) {
    super(props);

    this._redirectIfSetup(props);
  }

  componentWillReceiveProps(nextProps: PropType) {
    this._redirectIfSetup(nextProps);
  }

  componentDidMount() {
    this._intervalToken = setInterval(
      () => this.props.relay.forceFetch(),
      CHECK_PERIOD,
    );
  }

  componentWillUnmount() {
    if (this._intervalToken != null) {
      clearInterval(this._intervalToken);
      this._intervalToken = null;
    }
  }

  _redirectIfSetup(props: PropType) {
    if (props.repository.currentCompilation) {
      browserHistory.push(
        `/repository/${props.repository.repositoryID}`
      );
    }
  }

  render(): React$Node {
    return <RepositorySettingUpCard repoName={this.props.repository.name} />;
  }
}

const RepositorySettingUpPageWithDataContainer = Relay.createContainer(
  RepositorySettingUpPageWithData,
  {
    fragments: {
      repository: () => Relay.QL`
        fragment on Repository {
          repositoryID
          name
          currentCompilation {
            id
          }
        }
      `,
    },
  },
);

export default RepositorySettingUpPageWithDataContainer;
