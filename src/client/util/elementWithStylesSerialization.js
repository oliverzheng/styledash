/** @flow */

import React from 'react';
import invariant from 'invariant';
import document from 'global/document';
import camelcase from 'camelcase';

// TODO
// THIS WHOLE THING IS TERRIBLE. It gets the used styles for some attributes,
// like dimensions, which could totally depend on font rendering and would
// render differently in another browser.
// The right way to do this is to get a DOM dump, and scope the css classes in
// the bundle somehow, so that adding the CSS would not affect the main app.

// Taken from
// https://stackoverflow.com/questions/6209161/extract-the-current-dom-and-print-it-as-a-string-with-styles-intact

// Styles inherited from style sheets will not be rendered for elements with these tag names
const noStyleTags = {
  'BASE': true,
  'HEAD': true,
  'HTML': true,
  'META': true,
  'NOFRAME': true,
  'NOSCRIPT': true,
  'PARAM': true,
  'SCRIPT': true,
  'STYLE': true,
  'TITLE': true,
};

export type SerializedElement = {
  tagName: string,
  nodeAttrs: { [attrName: string]: string },
  styles: { [attrName: string]: string },
  children: Array<string | SerializedElement>,
};

export function renderSerializedElementWithStyles(
  serialized: SerializedElement,
): React$Node {
  const Component = serialized.tagName;
  // TODO nodeAttrs
  const styles = {};
  Object.keys(serialized.styles).forEach(styleAttrName => {
    let camelCaseName = camelcase(styleAttrName);
    if (camelCaseName.startsWith('webkit')) {
      // React likes 'em capitalized :/
      camelCaseName = camelCaseName.replace('webkit', 'Webkit');
    }
    styles[camelCaseName] = serialized.styles[styleAttrName];
  });
  const children = serialized.children.map(child => {
    if (typeof child === 'string') {
      return child;
    } else {
      return renderSerializedElementWithStyles(child);
    }
  });
  return (
    <Component style={styles}>
      {children}
    </Component>
  );
}

export function serializeElementWithStyles(
  element: HTMLElement,
): SerializedElement {
  const styles = {};
  if (!noStyleTags[element.tagName]) {
    // TODO pseudo elements
    const computedStyle = getComputedStyle(element);
    const defaultStyle = getDefaultStyleByTagName(element.tagName);
    for (let i = 0; i < computedStyle.length; i++) {
      const cssPropName = computedStyle[i];
      if (computedStyle[cssPropName] !== defaultStyle[cssPropName]) {
        styles[cssPropName] = computedStyle[cssPropName];
      }
    }
  }

  const children: Array<string | SerializedElement> = [];
  for (let i = 0; i < element.childNodes.length; ++i) {
    const child = element.childNodes[i];

    if (child.nodeType === Node.TEXT_NODE) {
      children.push(child.textContent);

    } else if (child.nodeType === Node.ELEMENT_NODE) {
      invariant(child instanceof HTMLElement, 'flow');
      children.push(serializeElementWithStyles(child));
    }
  }

  return {
    tagName: element.tagName,
    nodeAttrs: {}, // TODO node attrs, for things like input / buttons
    styles,
    children,
  };
}

// Cache
const defaultStylesByTagName = {};
function getDefaultStyleByTagName(tagName: string) {
  tagName = tagName.toUpperCase();
  if (!defaultStylesByTagName[tagName]) {
    defaultStylesByTagName[tagName] = computeDefaultStyleByTagName(tagName);
  }
  return defaultStylesByTagName[tagName];
}

function computeDefaultStyleByTagName(
  tagName: string,
): {[attrName: string]: string} {
  const defaultStyle = {};
  const element = document.body.appendChild(document.createElement(tagName));
  const computedStyle = getComputedStyle(element);
  for (let i = 0; i < computedStyle.length; i++) {
    defaultStyle[computedStyle[i]] = computedStyle[computedStyle[i]];
  }
  document.body.removeChild(element); 
  return defaultStyle;
}
