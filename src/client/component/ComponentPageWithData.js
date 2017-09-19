/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';
import nullthrows from 'nullthrows';
import classnames from 'classnames';

import PageWithMenu from '../pages/ui/PageWithMenu';
import ComponentExampleWithData from './ComponentExampleWithData';
import ComponentNewExampleWithData from './ComponentNewExampleWithData';
import ComponentProps from './ui/ComponentProps';
import SectionHeader from '../common/ui/SectionHeader';
import Button from '../common/ui/Button';
import Spacing from '../common/ui/Spacing';

type PropType = {
  component: ?{
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
    examples: Array<Object>,
  },
  relay: Object,
};

type StateType = {
  isAddingExample: boolean,
};

class ComponentPageWithData extends React.Component<PropType, StateType> {
  state = {
    isAddingExample: false,
  };

  render(): ?React$Element<*> {
    const {component} = this.props;
    if (!component) {
      // TODO 404
      return null;
    }

    const sections = [];

    if (component.examples.length > 0) {
      sections.push(
        ...component.examples.map((example, i) => {
          let children = <ComponentExampleWithData example={example} />;
          const isLast = i === component.examples.length - 1;
          if (isLast) {
            children = (
              <div>
                {children}
                {this._renderAddExampleSection()}
              </div>
            );
          }
          return {
            menuTitle: example.name,
            sectionTitle: example.name,
            children,
          };
        })
      );
    } else {
      sections.push({
        menuTitle: 'Add New Example',
        sectionTitle: 'Add New Example',
        children: this._renderFirstNewExampleSection(),
      });
    }

    sections.push({
      menuTitle: 'Props',
      sectionTitle: 'Component Props',
      children: (
        <ComponentProps
          reactDoc={component.reactDoc}
        />
      ),
    });

    return (
      <div>
        <PageWithMenu
          pageTitle={component.name}
          pageTitleAux={
            <Button glyph="github" href={this._getGithubLink()}>
              View on GitHub
            </Button>
          }
          sections={sections}
          wide={false}
        />
      </div>
    );
  }

  _getGithubLink(): string {
    // TODO
    return 'https://github.com';
  }

  _renderFirstNewExampleSection(): React$Element<*> {
    const newExampleName = this._getNewExampleName();
    return (
      <ComponentNewExampleWithData
        newExampleName={newExampleName}
        component={nullthrows(this.props.component)}
        onSave={this._onExampleSave}
      />
    );
  }

  _renderAddExampleSection(): React$Node {
    if (!this.state.isAddingExample) {
      return (
        <Button
          className={Spacing.margin.top.n36}
          glyph="pencil"
          onClick={this._onAddExampleClick}>
          Add Example
        </Button>
      );
    }

    const newExampleName = this._getNewExampleName();
    return (
      <div>
        <SectionHeader
          className={classnames(
            Spacing.margin.bottom.n28,
            Spacing.margin.top.n36,
          )}>
          {newExampleName}
        </SectionHeader>
        <ComponentNewExampleWithData
          newExampleName={newExampleName}
          component={nullthrows(this.props.component)}
          onSave={this._onExampleSave}
        />
      </div>
    );
  }

  _getNewExampleName(): string {
    const {examples} = nullthrows(this.props.component);
    let newIdx = examples.length;
    let newExampleName: string;
    do {
      newIdx++; // The first should be 'example 1'
      newExampleName = 'Example ' + newIdx;
    } while (
      // eslint-disable-next-line no-loop-func
      examples.some(example => example.name === newExampleName)
    );

    return newExampleName;
  }

  _onAddExampleClick = () => {
    this.setState({
      isAddingExample: true,
    });
  }

  _onExampleSave = () => {
    this.setState({
      isAddingExample: false,
    });
  }
}

const ComponentPageWithDataContainer = Relay.createContainer(
  ComponentPageWithData,
  {
    fragments: {
      component: () => Relay.QL`
        fragment on Component {
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
          examples {
            name
            ${ComponentExampleWithData.getFragment('example')}
          }
          ${ComponentNewExampleWithData.getFragment('component')}
        }
      `,
    },
  },
);

export default ComponentPageWithDataContainer;
