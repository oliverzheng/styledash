/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import nullthrows from 'nullthrows';

import groupPaths, { type PathGroup } from '../util/groupPaths';

import Link from '../common/ui/Link';
import PageWithMenu, { type Section } from './ui/PageWithMenu';

type Component = {
  componentID: string,
  name: string,
  filepath: string,
};

type PropType = {
  repository: ?{
    name: string,
    components: Array<Component>,
  },
};

class RepositoryPage extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {repository} = this.props;
    if (!repository) {
      // TODO 404 page. Use React error boundaries
      return null;
    }

    const componentsGroup = groupPaths(
      repository.components.map(
        c => ({ path: c.filepath, content: c }),
      ),
    );
    const componentsGroupChildren = componentsGroup.children;

    let sections = [];
    if (componentsGroupChildren) {
      sections = Object.keys(componentsGroupChildren).map(path =>
        this._componentGroupToSection(path, componentsGroupChildren[path])
      );
    }

    return (
      <PageWithMenu
        pageTitle={repository.name}
        sections={sections}
      />
    );
  }

  _componentGroupToSection(
    header: string,
    group: PathGroup<Component>,
  ): Section {
    let componentsRender: ?React$Element<*> = null;
    let subSections;

    const children = group.children;
    if (children) {
      const childrenPaths = Object.keys(children);
      const components: Array<Component> =
        childrenPaths
          .map(childPath => nullthrows(children[childPath]).content)
          .filter(Boolean);
      componentsRender = this._renderSectionComponents(components);

      subSections =
        childrenPaths
          .filter(childPath => !nullthrows(children[childPath]).content)
          .map(
            childPath => this._componentGroupToSection(childPath, children[childPath])
          );
    }

    return {
      title: header,
      children: componentsRender,
      subSections: subSections,
    };
  }

  _renderSectionComponents(components: Array<Component>): React$Element<*> {
    return (
      <div>
        {
          components.map(c =>
            <li key={c.componentID}>
              <Link href={`/component/${c.componentID}/`}>
                {c.name}
              </Link>
              {' '}
              {c.filepath}
            </li>
          )
        }
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
            filepath
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
