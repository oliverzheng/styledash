/** @flow */

import React from 'react';
import classnames from 'classnames';
import {Link as RouterLink} from 'react-router';
import url from 'url';

import './Link.css';

export type VisualProps = {
  onHover?: {
    darken: boolean,
    underline: boolean,
  },
};

type PropType = VisualProps & {
  href: string,
  className?: ?string,
  children?: React$Node,
};

export const defaultVisualProps = {
  onHover: {
    darken: true,
    underline: true,
  },
};

export default class Link extends React.Component<PropType> {
  static defaultProps = {
    ...defaultVisualProps,
  };

  render(): React$Element<*> {
    const {
      href,
      onHover,
      children,
      className,
      ...rest
    } = this.props;
    const {darken, underline} = onHover || {};
    const joinedClassName = classnames(
      className,
      {
        'Link-root': true,
        'Link-root-darkenOnHover': darken,
        'Link-root-underlineOnHover': underline,
      },
    );
    if (url.parse(href).host == null) {
      return (
        <RouterLink
          to={href}
          className={joinedClassName}
          {...rest}>
          {children}
        </RouterLink>
      );
    } else {
      return (
        <a
          href={href}
          className={joinedClassName}
          {...rest}>
          {children}
        </a>
      );
    }
  }
}
