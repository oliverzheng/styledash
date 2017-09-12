/** @flow */

import React from 'react';
import classnames from 'classnames';
import {Link as RouterLink} from 'react-router';

import './Link.css';

export type VisualProps = {
  onHover?: {
    darken: boolean,
    underline: boolean,
  },
};

type PropType = VisualProps & {
  href: string,
  children: mixed,
  className?: ?string,
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
    return (
      <RouterLink
        to={href}
        className={classnames(
          className,
          {
            'Link-root': true,
            'Link-root-darkenOnHover': darken,
            'Link-root-underlineOnHover': underline,
          },
        )}
        {...rest}>
        {children}
      </RouterLink>
    );
  }
}
