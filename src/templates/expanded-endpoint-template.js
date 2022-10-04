import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import { pathSecurityTemplate } from './security-scheme-template';
import codeSamplesTemplate from './code-samples-template';
import callbackTemplate from './callback-template';
import '../components/api-request';
import '../components/api-response';

/* eslint-disable indent */
export function expandedEndpointBodyTemplate(path, tagName = '') {
  const acceptContentTypes = new Set();
  for (const respStatus in path.responses) {
    for (const acceptContentType in path.responses[respStatus] && path.responses[respStatus].content) {
      acceptContentTypes.add(acceptContentType.trim());
    }
  }
  const accept = [...acceptContentTypes].join(', ');

  // Filter API Keys that are non-empty and are applicable to the the path
  const nonEmptyApiKeys = this.resolvedSpec.securitySchemes.filter((v) => (v.finalKeyValue && path.security && path.security.some((ps) => ps[v.apiKeyId]))) || [];

  const codeSampleTabPanel = path.xCodeSamples ? codeSamplesTemplate.call(this, path.xCodeSamples) : '';
  return html`
    ${this.renderStyle === 'read' ? html`<div class='divider' part="operation-divider"></div>` : ''}
    <div class='expanded-endpoint-body observe-me ${path.method}' part="section-operation ${path.elementId}" id='${path.elementId}'>
    ${(this.renderStyle === 'focused' && tagName && tagName !== 'General ⦂') ? html`<h3 class="upper" style="font-weight:bold"> ${tagName} </h3>` : ''}
    ${path.deprecated ? html`<div class="bold-text red-text"> DEPRECATED </div>` : ''}
    ${html`
      <h2> ${path.shortSummary || `${path.method.toUpperCase()} ${path.path}`}</h2>
      <div class='mono-font part="section-operation-url" regular-font-size' style='padding: 8px 0; color:var(--fg3)'> 
        ${path.isWebhook ? html`<span style="color:var(--primary-color)"> WEBHOOK </span>` : ''}
        <span part="label-operation-method" class='regular-font upper method-fg bold-text ${path.method}'>${path.method}</span> 
        <span part="label-operation-path">${path.path}</span>
      </div>`
    }
    ${path.description ? html`<div class="m-markdown"> ${unsafeHTML(marked(path.description))}</div>` : ''}
    <slot name="${path.elementId}"></slot>
    ${pathSecurityTemplate.call(this, path.security)}
    ${codeSampleTabPanel}
    <div class='expanded-req-resp-container'>
      <api-request class="request-panel"
        method = "${path.method}"
        path = "${path.path}"
        element-id = "${path.elementId}"
        .parameters = "${path.parameters}"
        .request_body = "${path.requestBody}"
        .api_keys = "${nonEmptyApiKeys}"
        .servers = "${path.servers}"
        server-url = "${path.servers?.[0]?.url || this.selectedServer?.computedUrl}"
        fill-defaults = "${this.fillRequestWithDefault}"
        display-nulls="${!!this.includeNulls}"
        enable-console = "${this.allowTry}"
        accept = "${accept}"
        render-style="${this.renderStyle}" 
        schema-style = "${this.displaySchemaAsTable ? 'table' : 'tree'}"
        active-schema-tab = "${this.defaultSchemaTab}"
        schema-expand-level = "${this.schemaExpandLevel}"
        schema-hide-read-only = "${this.schemaHideReadOnly}"
        fetch-credentials = "${this.fetchCredentials}"
        exportparts = "btn btn-fill btn-outline btn-try"
      > </api-request>

      ${path.callbacks ? callbackTemplate.call(this, path.callbacks) : ''}

      <api-response
        class = 'response-panel'
        .responses = "${path.responses}"
        display-nulls="${!!this.includeNulls}"
        render-style = "${this.renderStyle}"
        schema-style = "${this.displaySchemaAsTable ? 'table' : 'tree'}"
        active-schema-tab = "${this.defaultSchemaTab}"
        schema-expand-level = "${this.schemaExpandLevel}"
        schema-hide-write-only = "${this.schemaHideWriteOnly}"
        selected-status = "${Object.keys(path.responses || {})[0] || ''}"
        exportparts = "btn--resp btn-fill--resp btn-outline--resp"
      > </api-response>
    </div>
  </div>
  `;
}

export function expandedTagTemplate(tagId, subsectionFullId) {
  const tag = (this.resolvedSpec.tags || []).find(t => t.elementId === tagId);
  const subsectionId = subsectionFullId.replace(`${tagId}--`, '');
  return html`
    <section id="${tag.elementId}" part="section-tag" class="regular-font section-gap--read-mode observe-me" style="">
      <div class="title tag" part="label-tag-title">${tag.name}</div>
      <slot name="${tag.elementId}"></slot>
      <slot name="${tag.elementId}--subsection--${subsectionId}">
        <div class="regular-font-size">
        ${
          unsafeHTML(`
            <div class="m-markdown regular-font">
            ${marked(tag.description || '')}
          </div>`)
        }
        </div>
      </slot>
    </section>`;
}
/* eslint-enable indent */
