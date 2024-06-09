import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getSanitizedUrl, toMarkdown } from '../utils/common-utils.js';
import { pathSecurityTemplate } from './security-scheme-template.js';
import codeSamplesTemplate from './code-samples-template.js';
import callbackTemplate from './callback-template.js';
import '../components/api-request.js';
import '../components/api-response.js';

/* eslint-disable indent */
export function expandedEndpointBodyTemplate(path, tag) {
  // Filter API Keys that are non-empty and are applicable to the the path
  const nonEmptyApiKeys = this.resolvedSpec.securitySchemes.filter((v) => (v.finalKeyValue && path.security && path.security.some((ps) => ps[v.apiKeyId]))) || [];

  const codeSampleTabPanel = path.xCodeSamples ? codeSamplesTemplate.call(this, path.xCodeSamples) : '';
  return html`
    ${this.renderStyle === 'read' ? html`<div class='divider' part="operation-divider"></div>` : ''}
    <div class='expanded-endpoint-body observe-me ${path.method}' part="section-operation ${path.elementId}" id='${path.elementId}'>
      ${(this.renderStyle === 'focused' && tag && tag.name !== 'General ⦂')
        ? html`<div class="title tag-link" data-content-id="${tag.elementId}" @click="${(e) => this.scrollToEventTarget(e, false)}"> ${tag?.name} </h2>`
        : ''}
      <slot name="${tag.elementId}"></slot>

      <div style="display: flex; justify-content: space-between">
        <div style="flex-grow: 1">
          <h2 style="display: flex; align-items: center;">
            <div>${path.shortSummary || `${path.method.toUpperCase()} ${path.path}`}</div>
            <div>${path.deprecated ? html`<div>&nbsp;-<span class="bold-text red-text" style="font-size: var(--font-size-regular)"> DEPRECATED</small></div>` : ''}</div>
          </h2>
          <div class='mono-font part="section-operation-url" regular-font-size' style='padding: 8px 0; color:var(--fg3)'> 
            ${path.isWebhook ? html`<span style="color:var(--primary-color)"> WEBHOOK </span>` : ''}
            <span part="label-operation-method" class='regular-font upper method-fg bold-text ${path.method}'>${path.method}</span> 
            <span part="label-operation-path">${path.path}</span>
          </div>
        </div>
        ${path.externalDocs
          ? html`<div class="m-markdown" style="margin-top: 2rem; margin-bottom: 0.5rem; max-width: 300px">
              ${unsafeHTML(toMarkdown(path.externalDocs.description || ''))}
              <a href="${getSanitizedUrl(path.externalDocs.url)}">Navigate to documentation ↗</a>
            </div>`
          : ''}
      </div>
      <div class="m-markdown" style="margin-right: 2rem;"> ${unsafeHTML(toMarkdown(path.description || ''))}</div>
      <slot name="${path.elementId}"></slot>
      <slot name="path-details" data-method="${path.method}" data-path="${path.path}"></slot>
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
          fill-defaults = "${!this.hideDefaults}"
          display-nulls="${!!this.includeNulls}"
          enable-console = "${!this.hideExecution}"
          render-style="${this.renderStyle}" 
          schema-style = "${this.displaySchemaAsTree ? 'tree' : 'table'}"
          active-schema-tab = "${this.defaultSchemaTab}"
          schema-expand-level = "${this.schemaExpandLevel}"
          schema-hide-read-only = "${this.schemaHideReadOnly}"
          fetch-credentials = "${this.fetchCredentials}"
          @scrollToSchemaComponentByName=${v => this.scrollToSchemaComponentByName(v)}
          exportparts = "btn, btn-fill, btn-outline, btn-try, schema-key, schema-type, schema-description, schema-table-header"
        > </api-request>

        ${path.callbacks ? callbackTemplate.call(this, path.callbacks) : ''}

        <api-response
          class = 'response-panel'
          .responses = "${path.responses}"
          display-nulls="${!!this.includeNulls}"
          render-style = "${this.renderStyle}"
          schema-style = "${this.displaySchemaAsTree ? 'tree' : 'table'}"
          active-schema-tab = "${this.defaultSchemaTab}"
          schema-expand-level = "${this.schemaExpandLevel}"
          schema-hide-write-only = "${this.schemaHideWriteOnly}"
          selected-status = "${Object.keys(path.responses || {})[0] || ''}"
          @scrollToSchemaComponentByName=${v => this.scrollToSchemaComponentByName(v)}
          exportparts = "btn--resp, btn-fill--resp, btn-outline--resp, schema-key, schema-type, schema-description, schema-table-header"
        > </api-response>
      </div>
    </div>`;
}

export function expandedTagTemplate(tagId, subsectionFullId) {
  const tag = (this.resolvedSpec.tags || []).find(t => t.elementId === tagId);
  const subsectionId = subsectionFullId.replace(`${tagId}--`, '');
  return html`
    <section id="${tag.elementId}" part="section-tag" class="regular-font section-gap--read-mode observe-me" style="">
      <div class="title tag" part="label-tag-title">${tag.name}</div>
      <slot name="${tag.elementId}--subsection--${subsectionId}">
        <div class="regular-font-size">
        ${
          unsafeHTML(`
            <div class="m-markdown regular-font">
            ${toMarkdown(tag.description || '')}
          </div>`)
        }
        </div>
      </slot>
      <slot name="${tag.elementId}--body"></slot>

      <br>
      <strong>Operations</strong>

      <div class='nav-bar-paths-under-tag' style="max-width: 300px">
        ${tag.paths.map((p) => html`
        <div class='nav-bar-path ${this.usePathInNavBar ? 'small-font' : ''}'
          data-content-id='${p.elementId}' id='link-${p.elementId}' @click = '${(e) => { this.scrollToEventTarget(e, false); }}'>
          <span style="${p.deprecated ? 'filter:opacity(0.5)' : ''}">
            ${this.usePathInNavBar
              ? html`<div class='mono-font' style="display: flex; align-items: center;">
                  <div class="method ${p.method}"><span style="line-height: 1;">${p.method}</span></div> 
                  <div style="display: flex; flex-wrap: wrap;">${p.path.split('/').filter(t => t.trim()).map(t => html`<span>/${t}</span>`)}</div>
                </div>`
              : p.summary || p.shortSummary
            }
            ${p.isWebhook ? '(Webhook)' : ''}
          </span>
        </div>`)}
      </div>

      <slot name="${tag.elementId}--footer"></slot>
    </section>`;
}
/* eslint-enable indent */
