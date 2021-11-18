import { checkForAuthToken } from './templates/security-scheme-template';

export default class OpenapiExplorerOauthHandler extends HTMLElement {
  connectedCallback() {
    checkForAuthToken(true);
  }
}
customElements.define('openapi-explorer-oauth-handler', OpenapiExplorerOauthHandler);
