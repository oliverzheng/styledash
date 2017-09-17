/** @flow */

import React from 'react';

import invariant from 'invariant';
import nullthrows from 'nullthrows';

import ComponentRenderIFrame from './ComponentRenderIFrame';
import defaultPropValue from '../../../defaultPropValue';
import PageWithMenu from '../../pages/ui/PageWithMenu';
import CodeEditor from './CodeEditor';

import './ComponentPageWithMenu.css'

type ComponentProps = {
  [propName: string]: {
    typeName: string,
    defaultValue: mixed,
    required: boolean,
  }
};

type PropType = {
  component: {
    componentID: string,
    name: string,
    repository: {
      name: string,
      externalCSSURI: ?string,
    },
    filepath: string,
    compiledBundleURI: string,
    reactDoc: string,
    overrideReactDoc: ?string,
  },
  updateComponentOverrideReactDoc: (override: string) => any,
};

type StateType = {
  overrideReactDocModified: boolean,
};

export default class ComponentPageWithMenu extends React.Component<PropType, StateType> {
  state = {
    overrideReactDocModified: false,
  };

  _onIFrameReady = (iframe: ComponentRenderIFrame) => {
    iframe.sendMessage({
      type: 'renderComponent',
      compiledBundleURI: this.props.component.compiledBundleURI,
      externalCSSURI: this.props.component.repository.externalCSSURI,
    });
  }

  render(): ?React$Element<*> {
    const {component} = this.props;

    const defaultPropValues = this._getDefaultComponentPropValues(
      this._getComponentProps(
        this._getReactDocJSON(),
      ),
    );

    const stuff = (
      <div>
        <ComponentRenderIFrame
          ref="iframe"
          title="example"
          onReady={this._onIFrameReady}
        />
        <CodeEditor onCodeChange={(transformedCode) => console.log(transformedCode)} />
        <p>Example:</p>
        <div key="example-defaultValues">
          <p>Default props:</p>
          <pre>
            {JSON.stringify(defaultPropValues, null, '  ')}
          </pre>
        </div>
        <p>Location: {component.filepath}</p>
        <p>Prop types:</p>
        <pre className="ComponentPage-propTypes">
          {JSON.stringify(this._getReactDocJSON().props, null, '  ')}
        </pre>
        <p>Override Prop types:</p>
        <textarea
          className="ComponentPage-overrideReactDoc"
          defaultValue={component.overrideReactDoc}
          ref="overrideReactDocTextarea"
          onChange={this._onOverrideReactDocTextareaChange}
        />
        <br />
        <button
          onClick={this._onOverrideReactDocButtonClick}
          disabled={!this.state.overrideReactDocModified}>
          Save
        </button>
      </div>
    );

    return (
      <div>
        <PageWithMenu
          pageTitle={component.name}
          sections={[{
            menuTitle: 'Stuff',
            sectionTitle: 'Stuff',
            children: stuff,
          }]}
          wide={true}
        />
      </div>
    );
  }

  _onOverrideReactDocTextareaChange = () => {
    this.setState({
      overrideReactDocModified: true,
    });
  }

  _onOverrideReactDocButtonClick = () => {
    this.setState({
      overrideReactDocModified: false,
    });

    this.props.updateComponentOverrideReactDoc(
      this.refs.overrideReactDocTextarea.value,
    );
  }

  _getDefaultComponentPropValues(
    componentProps: ComponentProps,
  ): { [propName: string]: mixed } {
    const defaultValues = {};
    Object.keys(componentProps).forEach(propName => {
      defaultValues[propName] = componentProps[propName].defaultValue;
    });
    return defaultValues;
  }

  _getReactDocJSON(): Object /* TODO */{
    return JSON.parse(nullthrows(this.props.component).reactDoc);
  }

  _getComponentProps(reactDocJSON: Object): ComponentProps {
    const reactDoc = this._getReactDocJSON();
    const reactDocProps = reactDoc.props;
    if (!reactDocProps) {
      return {};
    }

    const props = {};
    Object.keys(reactDocProps).forEach(propName => {
      const reactDocProp = reactDocProps[propName];
      const reactType = reactDocProp.type;
      const flowType = reactDocProp.flowType;
      invariant(reactType || flowType, 'Must have at least 1 typing');

      const typeName = (reactType || flowType).name;
      const defaultValue = defaultPropValue(reactDocProp);
      if (defaultValue !== undefined) {
        props[propName] = {
          typeName,
          defaultValue,
        };
      }
    });

    return props;
  }
}
