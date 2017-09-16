/** @flow */

export type Message = {
  type: 'iframeSetupDone',
} | {
  type: 'debugMessage',
  message: string,
} | {
  type: 'renderComponent',
  compiledBundleURI: string,
  externalCSSURI: ?string,
};

export type MessageWrapper = {
  isStyledashMessage: true,
  message: Message,
};
