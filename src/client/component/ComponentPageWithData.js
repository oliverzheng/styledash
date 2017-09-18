/** @flow */

import React from 'react';
import Relay from 'react-relay/classic';

import PageWithMenu from '../pages/ui/PageWithMenu';
import ComponentExampleWithData from './ComponentExampleWithData';
import ComponentProps from './ui/ComponentProps';

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

class ComponentPageWithData extends React.Component<PropType> {
  render(): ?React$Element<*> {
    const {component} = this.props;
    if (!component) {
      // TODO 404
      return null;
    }

    const sections = [];

    sections.push(
      ...component.examples.map(example => ({
        menuTitle: example.name,
        sectionTitle: example.name,
        children: (
          <ComponentExampleWithData example={example} />
        ),
      }))
    );

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
      <PageWithMenu
        pageTitle={component.name}
        sections={sections}
        wide={true}
      />
    );
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
        }
      `,
    },
  },
);

export default ComponentPageWithDataContainer;
