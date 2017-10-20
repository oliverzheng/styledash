/** @flow */

import React from 'react';
import classnames from 'classnames';
import Portal from 'react-portal';

import Card, { CardSection } from './Card';
import Button from './Button';
import Spacing from './Spacing';

import './ModalDialog.css';

type PropType = {
  body: React$Node,
  // eslint-disable-next-line no-use-before-define
  renderSecondaryButton: (modal: ModalDialog) => React$Element<*>,
  // eslint-disable-next-line no-use-before-define
  renderPrimaryButton: (modal: ModalDialog) => React$Element<*>,
};

type StateType = {
  visible: boolean,
};

export default class ModalDialog extends React.Component<PropType, StateType> {
  static defaultProps = {
    renderSecondaryButton:
      modal =>
        <Button onClick={() => modal.hide()} purpose="secondary">
          Cancel
        </Button>,
  };

  _container: ?HTMLDivElement;

  state = {
    visible: false,
  };

  show = () => {
    this.setState({visible: true});
  }

  hide = () => {
    this.setState({visible: false});
  }

  render(): React$Node {
    if (!this.state.visible) {
      return null;
    }

    const primaryButton = this.props.renderPrimaryButton(this);
    let secondaryButton = this.props.renderSecondaryButton(this);

    const {className: secondaryButtonClassName} = secondaryButton.props;
    secondaryButton = React.cloneElement(
      secondaryButton,
      {
        className:
          classnames(secondaryButtonClassName, Spacing.margin.right.n16)
      },
    );

    return (
      <Portal isOpened={this.state.visible} closeOnEsc>
        <div
          className="ModalDialog-container"
          onClick={this._onContainerClick}
          ref={c => this._container = c}>
          <Card className="ModalDialog-dialog">
            <CardSection>
              {this.props.body}
            </CardSection>
            <CardSection align="right">
              {secondaryButton}
              {primaryButton}
            </CardSection>
          </Card>
        </div>
      </Portal>
    );
  }

  _onContainerClick = (e: SyntheticInputEvent<*>) => {
    if (e.target === this._container) {
      this.setState({
        visible: false,
      });
    }
  }
}
