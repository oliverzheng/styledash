/** @flow */

import React from 'react';
import classnames from 'classnames';

import Link,
{
  type VisualProps,
  defaultVisualProps,
} from './Link';
import Card from './Card';

import './LinkCard.css';

type LinkTextPropType = VisualProps & {
  className?: ?string,
  children: React$Element<*> | string,
};

class LinkText extends React.Component<LinkTextPropType> {
  static defaultProps = {
    ...defaultVisualProps,
  };

  render(): React$Element<*> {
    const {onHover, children} = this.props;
    const {darken, underline} = onHover || {};

    let child;
    let childClassName;
    if (typeof children === 'string') {
      child = <span>{children}</span>;
    } else {
      child = React.Children.only(children);
      childClassName = child.props.className;
    }
    return React.cloneElement(
      child,
      {
        className: classnames(
          childClassName,
          {
            'LinkCard-linkText-darken': darken,
            'LinkCard-linkText-underline': underline,
          }
        ),
      },
    );
  }
}

type PropType = {
  href: string,
  children: mixed,
  className?: ?string,
};

export default class LinkCard extends React.Component<PropType> {
  static LinkText = LinkText;

  render(): React$Element<*> {
    const {
      href,
      className,
      children,
      ...rest
    } = this.props;
    return (
      <Link
        className={classnames('LinkCard-root', className)}
        onHover={{darken: false, underline: false}}
        href={href}
        {...rest}>
        <Card className="LinkCard-card">
          {children}
        </Card>
      </Link>
    );
  }
}

