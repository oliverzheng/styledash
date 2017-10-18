/** @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import nullthrows from 'nullthrows';
import window from 'global/window';
import Portal from 'react-portal';

import './Contextual.css';

type PropType = {
  relativeTo: React$Element<*>,
  renderContext: (
    contextRect: {
      top: number,
      left: number,
      width: number,
      height: number,
    },
  ) => React$Node,
  horizontalAlign: 'left', // TODO | 'center' | 'right',
  verticalPosition: 'below', // TODO 'above'
  closeOnEsc: boolean,
  closeOnOutsideClick: boolean,
  isOpen: boolean,
  onChange?: (isOpen: boolean) => any,
  isElementOutside?: ?((el: HTMLElement) => boolean),
};

type StateType = {
  contextRect: ?{
    top: number,
    left: number,
    width: number,
    height: number,
  },
};

export default class Contextual extends React.Component<PropType, StateType> {
  static defaultProps = {
    closeOnEsc: false,
    closeOnOutsideClick: false,
  };

  _relativeToElement = null;

  state = {
    contextRect: null,
  };

  componentDidMount() {
    this._calculateContextRect();
  }

  componentDidRender() {
    this._calculateContextRect();
  }

  _calculateContextRect() {
    let el = nullthrows(this._relativeToElement);

    if (!(el instanceof HTMLElement)) {
      el = ReactDOM.findDOMNode(el);
    }

    invariant(
      el instanceof HTMLElement,
      'relativeTo must be an HTMLElement or a Component, not just plain text',
    );

    const rect = el.getBoundingClientRect();
    const {top, left, width, height} = rect;
    const {pageXOffset, pageYOffset} = window;
    this.setState({
      contextRect: {
        top: top + pageYOffset,
        left: left + pageXOffset,
        width,
        height,
      },
    });
  }

  render(): React$Node {
    const {relativeTo} = this.props;
    const oldRef = relativeTo.ref;

    const context = this._renderContext();
    let portal;
    if (context) {
      portal = (
        <Portal
          isOpened={this.props.isOpen}
          closeOnEsc={this.props.closeOnEsc}
          closeOnOutsideClick={this.props.closeOnOutsideClick}
          isElementOutside={this.props.isElementOutside}
          onOpen={this._onOpen}
          onClose={this._onClose}>
          {context}
        </Portal>
      );
    }

    return (
      <span>
        {
          React.cloneElement(
            relativeTo,
            {
              ref: c => {
                if (oldRef) {
                  oldRef(c);
                }
                this._relativeToElement = c;
              },
            },
          )
        }
        {portal}
      </span>
    );
  }

  _renderContext() {
    const {contextRect} = this.state;
    if (!contextRect) {
      return null;
    }

    let wrapperStyle;
    if (
      this.props.horizontalAlign === 'left' &&
      this.props.verticalPosition === 'below'
    ) {
      wrapperStyle = {
        top: contextRect.top + contextRect.height,
        left: contextRect.left,
      };
    } else {
      invariant(false, 'NYI');
    }

    return (
      <div className="Contextual-context-root" style={wrapperStyle}>
        {this.props.renderContext(contextRect)}
      </div>
    );
  }

  _onOpen = () => {
    if (this.props.onChange) {
      this.props.onChange(true);
    }
  }

  _onClose = () => {
    if (this.props.onChange) {
      this.props.onChange(false);
    }
  }
}
