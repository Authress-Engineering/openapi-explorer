import { LitElement } from 'lit';
import { checkForAuthToken } from './templates/security-scheme-template.js';

export default class OpenapiExplorerOauthHandler extends LitElement {
  connectedCallback() {
    checkForAuthToken(true);
  }
}

if (!customElements.get('openapi-explorer-oauth-handler')) {
  customElements.define('openapi-explorer-oauth-handler', OpenapiExplorerOauthHandler);
}
