/** @flow */

import React from 'react';
import nullthrows from 'nullthrows';

import groupPaths, { type PathGroup } from '../../util/groupPaths';

import PageWithMenu, { type Section } from '../../pages/ui/PageWithMenu';
import RepositoryComponentsGrid from './RepositoryComponentsGrid';
import { type RepositoryComponentsCardProps } from './RepositoryComponentsCard';

type PropType = {
  repository: {
    name: string,
    components: Array<{
      filepath: string,
      data: RepositoryComponentsCardProps,
    }>,
  }
};

export default class RepositoryComponentsPageWithMenu extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {repository} = this.props;
    const {components} = repository;

    const componentsGroup = groupPaths(
      components.map(
        c => ({ path: c.filepath, content: c.data }),
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
        wide={true}
      />
    );
  }

  _componentGroupToSection(
    header: string,
    group: PathGroup<RepositoryComponentsCardProps>,
  ): Section {
    let componentsRender: ?React$Element<*> = null;
    let subSections;

    const children = group.children;
    if (children) {
      const childrenPaths = Object.keys(children);
      const components =
        childrenPaths
          .map(childPath => nullthrows(children[childPath]).content)
          .filter(Boolean);
      componentsRender = this._renderSectionComponents(components);

      subSections =
        childrenPaths
          .filter(childPath => !nullthrows(children[childPath]).content)
          .map(
            childPath =>
              this._componentGroupToSection(childPath, children[childPath])
          );
    }

    return {
      title: header,
      children: componentsRender,
      subSections: subSections,
    };
  }

  _renderSectionComponents(
    components: Array<RepositoryComponentsCardProps>,
  ): React$Element<*> {
    return (
      <RepositoryComponentsGrid components={components} />
    );
  }
}
