import { checkForAuthToken } from './templates/security-scheme-template';

export default class OpenapiExplorerOauthHandler extends HTMLElement {
  connectedCallback() {
    checkForAuthToken(true);
  }
}

if (!customElements.get('openapi-explorer-oauth-handler')) {
  customElements.define('openapi-explorer-oauth-handler', OpenapiExplorerOauthHandler);
}
