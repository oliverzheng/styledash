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
    compiledBundleURI: string,
  },
  repository: {
    externalCSSURI: ?string,
  },
} | {
  type: 'componentRendered',
  serializedElement: string,
};

export type MessageWrapper = {
  isStyledashMessage: true,
  message: Message,
};
