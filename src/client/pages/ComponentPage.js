/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import invariant from 'invariant';
import nullthrows from 'nullthrows';

import PageHeader from './ui/PageHeader';
import loadComponentBundle from '../util/loadComponentBundle';
import Frame from '../component/StaticIFrame';
import defaultPropValue from '../../defaultPropValue';

import OverrideComponentReactDocMutation from '../component/mutations/OverrideComponentReactDocMutation';

import {SERVER_ADDRESS} from '../../clientserver/serverConfig';

import './ComponentPage.css'

type ComponentProps = {
  [propName: string]: {
    typeName: string,
    defaultValue: mixed,
    required: boolean,
  }
};

type PropType = {
  component: ?{
    componentID: string,
    name: string,
    repository: {
      name: string,
    },
    filepath: string,
    compiledBundleURI: string,
    reactDoc: string,
    overrideReactDoc: ?string,
  },
  relay: Object,
};

type StateType = {
  bundledComponent: ?Class<React.Component<*>>,
  overrideReactDocModified: boolean,
};

class ComponentPage extends React.Component<PropType, StateType> {
  state = {
    bundledComponent: null,
    overrideReactDocModified: false,
  };

  componentDidMount(): void {
    const {component} = this.props;
    if (component) {
      this._loadComponentBundle(component.compiledBundleURI);
    }
  }

  componentWillReceiveProps(nextProps: PropType): void {
    const {component: nextComponent} = nextProps;
    const {component: curComponent} = this.props;
    if (!nextComponent || !curComponent) {
      return;
    }

    if (
      nextComponent.compiledBundleURI !== curComponent.compiledBundleURI
    ) {
      this._loadComponentBundle(nextComponent.compiledBundleURI);
    }
  }

  _loadComponentBundle(bundleURI: ?string): void {
    if (bundleURI == null) {
      this.setState({
        bundledComponent: null,
      });
    } else {
      loadComponentBundle(`${SERVER_ADDRESS}${bundleURI}`).then(Component => {
        this.setState({
          bundledComponent: Component,
        });
      });
    }
  }

  render(): ?React$Element<*> {
    const {component} = this.props;
    if (!component) {
      return null;
    }

    const BundledComponent = this.state.bundledComponent;
    let example = null;
    if (BundledComponent) {
      // TODO automatic props
      const defaultPropValues = this._getDefaultComponentPropValues(
        this._getComponentProps(
          this._getReactDocJSON(),
        ),
      );

      let externalCSSStyle = null;
      if (component.repository.externalCSSURI) {
        externalCSSStyle = (
          <link href={component.repository.externalCSSURI} rel="stylesheet" />
        );
      }

      example = [
        <p key="example-title">Example:</p>,
        <div key="example-defaultValues">
          <p>Default props:</p>
          <pre>
            {JSON.stringify(defaultPropValues, null, '  ')}
          </pre>
        </div>,

        // This iframe is used to encapsulate the external CSS so it doesn't
        // bleed onto the rest of the page.
        // TODO - this only renders static HTML. For interactive JS to execute
        // inside the iframe, we'd have to pass along JS.
        <Frame key="example-render" title="example">
          {externalCSSStyle}
          <div>
            <BundledComponent {...defaultPropValues} />
          </div>
        </Frame>
      ];
    }

    return (
      <div>
        <PageHeader />
        <h1>
          {component.repository.name} > {component.name}
        </h1>
        <p>Location: {component.filepath}</p>
        {example}
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

    this.props.relay.commitUpdate(
      new OverrideComponentReactDocMutation({
        component: this.props.component,
        overrideReactDoc: this.refs.overrideReactDocTextarea.value
      }),
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

const ComponentPageContainer = Relay.createContainer(
  ComponentPage,
  {
    fragments: {
      component: () => Relay.QL`
        fragment on Component {
          ${OverrideComponentReactDocMutation.getFragment('component')}
          componentID
          name
          repository {
            name
            externalCSSURI
          }
          filepath
          compiledBundleURI
          reactDoc
          overrideReactDoc
        }
      `,
    },
  },
);

ComponentPageContainer.queries = {
  component: () => Relay.QL`
    query {
      component(componentID: $componentID)
    }
  `,
};

export default ComponentPageContainer;
