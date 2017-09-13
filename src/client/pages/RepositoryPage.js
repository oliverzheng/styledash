/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import nullthrows from 'nullthrows';

import PageHeader from './ui/PageHeader';
import Link from '../common/ui/Link';
import FullWidthPageContainer from './ui/FullWidthPageContainer';
import PageTitle from './ui/PageTitle';
import Spacing from '../common/ui/Spacing';
import ElementScrollPositionTracker from '../common/ui/ElementScrollPositionTracker';
import MenuScrollHighlighter from './ui/MenuScrollHighlighter';

type PropType = {
  repository: ?{
    name: string,
    components: Array<{
      componentID: string,
      name: string,
    }>,
  },
};

class RepositoryPage extends React.Component<PropType> {
  _scrollTracker: ?ElementScrollPositionTracker;

  componentWillMount() {
    this._scrollTracker = new ElementScrollPositionTracker();
  }

  componentDidMount() {
    const keys = [
      'header-core',
      'header-second',
      'header-third',
      'header-fourth',
      'header-fifth',
    ];
    const elements = {};
    keys.forEach(key => {
      elements[key] = this.refs[key];
    });
    nullthrows(this._scrollTracker).addElementsToTrack(elements);
  }

  componentWillUnmount() {
    nullthrows(this._scrollTracker).destroy();
    this._scrollTracker = null;
  }

  render(): ?React$Element<*> {
    const {repository} = this.props;
    if (!repository) {
      // TODO 404 page. Use React error boundaries
      return null;
    }

    return (
      <div>
        <PageHeader />
        <FullWidthPageContainer>
          <PageTitle className={Spacing.margin.bottom.n28}>
            {repository.name}
          </PageTitle>
          <div ref="header-core">
            Core
            <p>
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
            </p>
          </div>
          <div ref="header-second">
            Second
            <p>
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
            </p>
          </div>
          <div ref="header-third">
            Third
            <p>
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
            </p>
          </div>
          <div ref="header-fourth">
            Fourth
            <p>
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
            </p>
          </div>
          <div ref="header-fifth">
            Fifth
            <p>
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
              some shit <br /> some shit<br />
            </p>
          </div>
          <MenuScrollHighlighter
            tracker={nullthrows(this._scrollTracker)}
            render={
              highlightedKey =>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                  }}>
                  key: {highlightedKey}
                </div>
            }
          />
          <ul>
            {
              repository.components.map(c =>
                <li key={c.componentID}>
                  <Link href={`/component/${c.componentID}/`}>
                    {c.name}
                  </Link>
                </li>
              )
            }
          </ul>
        </FullWidthPageContainer>
      </div>
    );
  }
}

const RepositoryPageContainer = Relay.createContainer(
  RepositoryPage,
  {
    fragments: {
      repository: () => Relay.QL`
        fragment on Repository {
          name
          components {
            componentID
            name
          }
        }
      `,
    },
  },
);

RepositoryPageContainer.queries = {
  repository: () => Relay.QL`
    query {
      repository(repositoryID: $repositoryID)
    }
  `,
};

export default RepositoryPageContainer;
