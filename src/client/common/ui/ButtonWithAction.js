/** @flow */

import React from 'react';

import Button, { type ButtonProps } from './Button';

type PropType = {
  onClick: (() => any),
} & ButtonProps;

type StateType = {
  didClick: boolean,
};

export default class ButtonWithAction extends React.Component<PropType, StateType> {
  state = {
    didClick: false,
  };

  render(): React$Node {
    const { onClick, ...rest } = this.props;
    return (
      <Button
        onClick={this._onClick}
        disabled={this.state.didClick}
        {...rest}
      />
    );
  }

  _onClick = () => {
    this.setState({
      didClick: true,
    }, this.props.onClick);
  }
}
