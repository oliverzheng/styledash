/** @flow */

import React from 'react';
import {Link as RouterLink} from 'react-router';

type PropType = {
  href: string,
  children: mixed,
};

export default class Link extends React.Component<PropType> {
  render(): React$Element<*> {
    const {href, children, ...rest} = this.props;
    return (
      <RouterLink to={href} {...rest}>
        {children}
      </RouterLink>
    );
  }
}
