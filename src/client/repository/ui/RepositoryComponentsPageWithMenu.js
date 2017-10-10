/** @flow */

import React from 'react';
import nullthrows from 'nullthrows';
import classnames from 'classnames';

import groupPaths, { type PathGroup } from '../../../util/groupPaths';

import PageWithMenu, { type Section } from '../../pages/ui/PageWithMenu';
import TextColor from '../../common/ui/TextColor';
import Button from '../../common/ui/Button';
import RepositoryComponentsGrid from './RepositoryComponentsGrid';
import { type RepositoryComponentsCardProps } from './RepositoryComponentsCard';

import './RepositoryComponentsPageWithMenu.css';

type PropType = {
  repository: {
    id: string,
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
        this._componentGroupToSection(path, path, componentsGroupChildren[path])
      );
    }

    return (
      <PageWithMenu
        pageTitle={repository.name}
        pageTitleAux={
          <Button glyph="gear" href={`/repository/${repository.id}/settings`}>
            Repository Settings
          </Button>
        }
        sections={sections}
        wide={true}
      />
    );
  }

  _componentGroupToSection(
    relativePath: string,
    fullPath: string,
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
              this._componentGroupToSection(
                childPath,
                fullPath + '/' + childPath,
                children[childPath],
              )
          );
    }

    return {
      menuTitle: relativePath,
      sectionTitle: this._renderSectionTitle(fullPath),
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

  _renderSectionTitle(fullPath: string): React$Node {
    const pieces = [];
    fullPath.split('/').forEach((s, i) => {
      if (i !== 0) {
        pieces.push(
          <span
            key={i}
            className={
              classnames(
                TextColor.reallyLight,
                'RepositoryComponentsPageWithMenu-sectionHeader',
              )
            }>
            /
          </span>
        );
      }
      pieces.push(s);
    });
    return pieces;
  }
}
