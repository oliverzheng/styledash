/** @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import invariant from 'invariant';
import nullthrows from 'nullthrows';

import Button from './Button';
import Contextual from './Contextual';
import Icon from './Icon';

import './Select.css';

type OptionProps = {
  selected: boolean,
  value: mixed,
  onClick?: (value: mixed) => void,
  children: React$Node,
};

export class Option extends React.Component<OptionProps> {
  static defaultProps = {
    selected: false,
  };

  render(): React$Node {
    let selectedIcon;
    if (this.props.selected) {
      selectedIcon = (
        <Icon className="Select-Option-checkmark" glyph="checkmark" />
      );
    }

    return (
      <div className="Select-Option" onClick={this._onClick}>
        {selectedIcon}
        {this.props.children}
      </div>
    );
  }

  _onClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.props.value);
    }
  }
}

type SelectProps = {
  placeholder: string,
  onChange?: (value: mixed) => void,
  disabled: boolean,
  className?: ?string,
  children?: React$Node,
};

type SelectState = {
  isOpen: boolean,
};

export default class Select extends React.Component<SelectProps, SelectState> {
  static defaultProps = {
    disabled: false,
  };

  _button: ?Button;

  state = {
    isOpen: false,
  };

  render(): React$Node {
    const {className, children} = this.props;

    let selectedText = null;
    if (children) {
      React.Children.forEach(children, child => {
        invariant(
          typeof child === 'object' && child.type === Option,
          'Each child must be Option',
        );
        const childProps = (child: any).props;
        if (childProps.selected) {
          invariant(
            selectedText == null,
            'Cannot have more than 1 selected option',
          );
          selectedText = childProps.children;
        }
      });
    }
    if (!selectedText) {
      selectedText = this.props.placeholder;
    }

    return (
      <Contextual
        relativeTo={
          <Button
            className={classnames(
              className,
              'Select-root',
              { 'Select-root-isOpen': this.state.isOpen },
            )}
            onClick={this._onButtonClick}
            glyph="chevron-down"
            glyphPlacement="right"
            disabled={this.props.disabled}
            ref={c => this._button = c}>
            {selectedText}
          </Button>
        }
        renderContext={
          contextRect => this._renderDropdown(contextRect.width)
        }
        isOpen={this.state.isOpen}
        horizontalAlign="left"
        verticalPosition="below"
        onChange={this._onContextualChange}
        closeOnEsc
        closeOnOutsideClick
        isElementOutside={this._isElementOutside}
      />
    );
  }

  _renderDropdown(buttonWidth: number) {
    return (
      <div
        className="Select-dropdown"
        style={{width: buttonWidth}}>
        {
          React.Children.map(this.props.children, child => {
            invariant(
              typeof child === 'object' && child.type === Option,
              'Children must all be Options',
            );
            return React.cloneElement(
              (child: any),
              {
                onClick: this._onSelectValue,
              },
            );
          })
        }
      </div>
    );
  }

  _onButtonClick = () => {
    this.setState({
      isOpen: !this.state.isOpen,
    });
  }

  _onContextualChange = (isOpen: boolean) => {
    this.setState({
      isOpen,
    });
  }

  _isElementOutside = (element: HTMLElement) => {
    const buttonEl = ReactDOM.findDOMNode(nullthrows(this._button));
    return !nullthrows(buttonEl).contains(element);
  }

  _onSelectValue = (value: mixed) => {
    this.setState({
      isOpen: false,
    });

    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }
}
