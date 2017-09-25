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

const serializeAttrsForNodeName = {
  'SVG': [
    'width',
    'height',
    'viewBox',
  ],
  'INPUT': [
    'type',
    'placeholder',
    'disabled',
    'checked',
    'selected',
  ],
};

export type SerializedElement = {
  tagName: string,
  nodeAttrs: { [attrName: string]: string },
  styles: { [attrName: string]: string },
  children: Array<string | SerializedElement>,
};

export function renderSerializedElementWithStyles(
  serialized: SerializedElement,
): React$Element<*> {
  const Component = serialized.tagName;

  const styles = {};
  Object.keys(serialized.styles).forEach(styleAttrName => {
    let camelCaseName = camelcase(styleAttrName);
    if (camelCaseName.startsWith('webkit')) {
      // React likes 'em capitalized :/
      camelCaseName = camelCaseName.replace('webkit', 'Webkit');
    }
    styles[camelCaseName] = serialized.styles[styleAttrName];
  });

  const attrs = {};
  Object.keys(serialized.nodeAttrs).forEach(attrName => {
    attrs[attrName] = serialized.nodeAttrs[attrName];
  });

  const children = serialized.children.map((child, i) => {
    if (typeof child === 'string') {
      return child;
    } else {
      return React.cloneElement(
        renderSerializedElementWithStyles(child),
        { key: i },
      );
    }
  });
  if (children.length === 0) {
    // Components like <input> can't have children, and React barfs if they do
    return <Component style={styles} {...attrs} />;
  } else {
    return (
      <Component style={styles} {...attrs} >
        {children}
      </Component>
    );
  }
}

export function serializeElementWithStyles(
  element: Element,
): SerializedElement {
  const tagName = element.tagName.toUpperCase();
  const styles = {};
  if (!noStyleTags[tagName]) {
    // TODO pseudo elements
    const computedStyle = getComputedStyle(element);
    const defaultStyle = getDefaultStyleByTagName(tagName);
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
      // Element is a base of SVGElement
      invariant(child instanceof Element, 'flow');
      children.push(serializeElementWithStyles(child));
    }
  }

  const nodeAttrs = {};
  const attrsToSerialize = serializeAttrsForNodeName[tagName];
  if (attrsToSerialize) {
    attrsToSerialize.forEach(attrName => {
      const attrValue = element.getAttribute(attrName);
      if (attrValue != null) {
        nodeAttrs[attrName] = attrValue;
      }
    });
  }

  return {
    tagName: element.tagName,
    nodeAttrs,
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
