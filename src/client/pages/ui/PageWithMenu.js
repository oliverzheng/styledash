/** @flow */

import React from 'react';
import classnames from 'classnames';
import nullthrows from 'nullthrows';

import PageHeader from './PageHeader';
import SectionHeader from '../../common/ui/SectionHeader';
import FullWidthPageContainer from './FullWidthPageContainer';
import PageTitle from './PageTitle';
import Spacing from '../../common/ui/Spacing';
import ElementScrollPositionTracker from '../../common/ui/ElementScrollPositionTracker';
import MenuScrollHighlighter from './MenuScrollHighlighter';
import PageMenu, { PageMenuItem } from './PageMenu';

import './PageWithMenu.css';

export type Section = {
  title: string,
  children: React$Element<*>,
  subSections?: ?Array<Section>,
};

type PropType = {
  pageTitle: string,
  sections: Array<Section>,
};

export default class PageWithMenu extends React.Component<PropType> {
  _scrollTracker: ?ElementScrollPositionTracker;

  componentWillMount() {
    this._scrollTracker = new ElementScrollPositionTracker();
  }

  componentDidMount() {
    this._registerRefsToTracker();
  }

  componentDidUpdate() {
    this._registerRefsToTracker();
  }

  _registerRefsToTracker() {
    const elements = {};
    Object.keys(this.refs).forEach(refKey => {
      elements[refKey] = this.refs[refKey];
    });
    nullthrows(this._scrollTracker).addElementsToTrack(elements);
  }

  componentWillReceiveNewProps(nextProps: PropType) {
    // This happens if our component is re-used for another page. We want to
    // start over. componentDidUpdate() will add those in.
    nullthrows(this._scrollTracker).removeElementsFromTracking(
      Object.keys(this.refs),
    );
  }

  componentWillUnmount() {
    nullthrows(this._scrollTracker).destroy();
    this._scrollTracker = null;
  }

  _renderMenuItem(
    key: string,
    section: Section,
    highlightedHeaderRefKey: ?string,
  ): React$Node {
    const {title, subSections} = section;
    let children = null;
    if (subSections && subSections.length > 0) {
      children = (
        <PageMenu>
          {
            subSections.map((subSection, i) =>
              this._renderMenuItem(
                key + '-' + i.toString(),
                subSection,
                highlightedHeaderRefKey,
              )
            )
          }
        </PageMenu>
      );
    }
    return (
      <PageMenuItem
        key={key}
        text={title}
        href="#"
        highlighted={key === highlightedHeaderRefKey}>
        {children}
      </PageMenuItem>
    );
  }

  _renderSectionContent(
    key: string,
    section: Section,
    marginBefore: boolean,
  ): Array<React$Node> {
    let content = [
      <SectionHeader
        key={key + '-header'}
        ref={key}
        className={classnames(
          Spacing.margin.bottom.n28,
          {
            [Spacing.margin.top.n28]: marginBefore,
          },
        )}>
        {section.title}
      </SectionHeader>,
      React.cloneElement(section.children, { key }),
    ];
    if (section.subSections) {
      const childrenContent = section.subSections.map(
        (subSection, i) => this._renderSectionContent(
          // Has to be the same as the menu item key
          key + '-' + i.toString(),
          subSection,
          true,
        )
      );
      content.push(...childrenContent);
    }
    return content;
  }

  render(): React$Element<*> {
    const {pageTitle, sections} = this.props;

    const menu = (
      <MenuScrollHighlighter
        tracker={nullthrows(this._scrollTracker)}
        render={highlightedKey =>
          <PageMenu className="PageWithMenu-menu">
            {
              sections.map(
                (section, i) =>
                  this._renderMenuItem(i.toString(), section, highlightedKey)
              )
            }
          </PageMenu>
        }
      />
    );

    const content = sections.map(
      (section, i) => this._renderSectionContent(i.toString(), section, i !== 0)
    );

    return (
      <div className="PageWithMenu-root">
        <PageHeader />
        <FullWidthPageContainer className="PageWithMenu-root">
          <PageTitle className={Spacing.margin.bottom.n28}>
            {pageTitle}
          </PageTitle>
          {menu}
          <div className="PageWithMenu-content">
            {content}
          </div>
        </FullWidthPageContainer>
      </div>
    );
  }
}
