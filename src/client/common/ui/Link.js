/** @flow */

import React from 'react';
import classnames from 'classnames';
import {Link as RouterLink} from 'react-router';
import url from 'url';
import {
  NON_ROUTER_SERVER_PATHS,
} from '../../../clientserver/urlPaths';

import './Link.css';

export type VisualProps = {
  onHover?: {
    darken: boolean,
    underline: boolean,
  },
};

type PropType = VisualProps & {
  href: string,
  plainLink: boolean, // no router
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
    plainLink: false,
  };

  render(): React$Element<*> {
    const {
      href,
      onHover,
      children,
      plainLink,
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
    if (
      !plainLink &&
      url.parse(href).host == null &&
      !NON_ROUTER_SERVER_PATHS.includes(href)
    ) {
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
