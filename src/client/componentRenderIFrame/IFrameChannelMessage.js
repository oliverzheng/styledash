/** @flow */

export type Message = {
  type: 'iframeSetupDone',
} | {
  type: 'debugMessage',
  message: string,
} | {
  type: 'renderComponent',
  transformedCode: string,
  component: {
    name: string,
  },
  repository: {
    currentCompilation: {
      compiledBundleURI: string,
    },
    externalCSSURI: ?string,
    rootCSS: ?string,
  },
} | {
  type: 'componentRendered',
  serializedElement: string,
};

export type MessageWrapper = {
  isStyledashMessage: true,
  message: Message,
};
