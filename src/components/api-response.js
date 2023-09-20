import { LitElement, html, css } from 'lit';
import { marked } from 'marked';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { schemaInObjectNotation, generateExample } from '../utils/schema-utils';
import { getI18nText } from '../utils/common-utils';
import FontStyles from '../styles/font-styles';
import FlexStyles from '../styles/flex-styles';
import TableStyles from '../styles/table-styles';
import InputStyles from '../styles/input-styles';
import TabStyles from '../styles/tab-styles';
import BorderStyles from '../styles/border-styles';
import SchemaStyles from '../styles/schema-styles';
import PrismStyles from '../styles/prism-styles';
import './schema-tree';
import './schema-table';
import './syntax-highlighter';

export default class ApiResponse extends LitElement {
  constructor() {
    super();
    this.selectedStatus = '';
    this.headersForEachRespStatus = {};
    this.mimeResponsesForEachStatus = {};
    this.activeSchemaTab = 'model';
  }

  static get properties() {
    return {
      callback: { type: String },
      responses: { type: Object },
      parser: { type: Object },
      includeNulls: { type: Boolean, attribute: 'display-nulls', converter(value) { return value === 'true'; } },
      schemaStyle: { type: String, attribute: 'schema-style' },
      renderStyle: { type: String, attribute: 'render-style' },
      selectedStatus: { type: String, attribute: 'selected-status' },
      selectedMimeType: { type: String, attribute: 'selected-mime-type' },
      activeSchemaTab: { type: String, attribute: 'active-schema-tab' },
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaHideWriteOnly: { type: String, attribute: 'schema-hide-write-only' },
    };
  }

  static finalizeStyles() {
    return [
      SchemaStyles,
      FontStyles,
      FlexStyles,
      TabStyles,
      TableStyles,
      InputStyles,
      BorderStyles,
      PrismStyles,
      css`
      .resp-head{
        vertical-align: middle;
        padding:16px 0 8px;
      }
      .resp-head.divider{
        border-top: 1px solid var(--border-color);
        margin-top:10px;
      }
      .resp-status{ 
        font-weight:bold;
        font-size:calc(var(--font-size-small) + 1px);
      }
      .resp-descr{
        font-size:calc(var(--font-size-small) + 1px);
      }
      .top-gap{margin-top:16px;}
      .example-panel{
        font-size:var(--font-size-small);
        margin:0;
      }
      .generic-tree {
        background: var(--bg2, rgb(51, 51, 51));
        color: var(--fg, white);
      }
      .example-panel.generic-tree {
        margin-top: 8px;
      }
      pre.generic-tree {
        border: none;
        padding: 8px 10px 10px;
      }
      .example-panel select {
        margin-left: 8px;
        padding-top: 8px;
        min-width: 100px;
        max-width: 100%
      }
      .example-panel .example {
        padding: 0 12px;
      }
      .focused-mode,
      .read-mode {
        padding-top:24px;
        margin-top:12px;
        border-top: 1px dashed var(--border-color);
      }`,
    ];
  }

  render() {
    return html`
    <div class="col regular-font response-panel ${this.renderStyle}-mode">
      <div class=" ${this.callback === 'true' ? 'tiny-title' : 'req-res-title'} "> 
        ${this.callback === 'true' ? 'CALLBACK RESPONSE' : getI18nText('operations.response')}
      </div>
      <div>
        ${this.responseTemplate()}
      <div>  
    </div>  
    `;
  }

  resetSelection() {
    this.selectedStatus = '';
    this.selectedMimeType = '';
  }

  /* eslint-disable indent */
  responseTemplate() {
    if (!this.responses) { return ''; }
    for (const statusCode in this.responses) {
      if (!this.selectedStatus) {
        this.selectedStatus = statusCode;
      }
      const allMimeResp = {};
      for (const mimeResp in (this.responses[statusCode] && this.responses[statusCode].content)) {
        const mimeRespObj = this.responses[statusCode].content[mimeResp];
        if (!this.selectedMimeType) {
          this.selectedMimeType = mimeResp;
        }
        // Generate Schema
        const schemaTree = schemaInObjectNotation(mimeRespObj.schema, { includeNulls: this.includeNulls });
        // Generate Example
        const respExamples = generateExample(
          (mimeRespObj.examples || ''),
          (mimeRespObj.example || ''),
          mimeRespObj.schema,
          mimeResp,
          true,
          false,
          mimeResp.includes('json') ? 'json' : 'text',
        );
        allMimeResp[mimeResp] = {
          description: this.responses[statusCode].description,
          examples: respExamples,
          selectedExample: respExamples[0] && respExamples[0].exampleId || '',
          schemaTree,
        };
      }
      // Headers for each response status
      const tempHeaders = [];
      for (const key in this.responses[statusCode] && this.responses[statusCode].headers) {
        tempHeaders.push({ name: key, ...this.responses[statusCode].headers[key] });
      }
      this.headersForEachRespStatus[statusCode] = tempHeaders;
      this.mimeResponsesForEachStatus[statusCode] = allMimeResp;
    }
    return html`<div class='row' style='flex-wrap:wrap'>
      ${Object.keys(this.responses).map((respStatus) => html`
        ${respStatus === '$$ref' // Swagger-Client parser creates '$$ref' object if JSON references are used to create responses - this should be ignored
          ? ''
          : html`
            <button 
              @click="${() => {
                this.selectedStatus = respStatus;
                if (this.responses[respStatus].content && Object.keys(this.responses[respStatus].content)[0]) {
                  this.selectedMimeType = Object.keys(this.responses[respStatus].content)[0];
                } else {
                  this.selectedMimeType = undefined;
                }
              }}"
              class='m-btn small ${this.selectedStatus === respStatus ? 'primary' : ''}'
              part="btn--resp ${this.selectedStatus === respStatus ? 'btn-fill--resp' : 'btn-outline--resp'} btn-response-status"
              style='margin: 8px 4px 0 0'> 
              ${respStatus}
            </button>`
          }`)
        }
      </div>

      ${Object.keys(this.responses).map((status) => html`
        <div style = 'display: ${status === this.selectedStatus ? 'block' : 'none'}' >
          <div class="top-gap">
            <span class="resp-descr m-markdown ">${unsafeHTML(marked(this.responses[status] && this.responses[status].description || ''))}</span>
            ${(this.headersForEachRespStatus[status] && this.headersForEachRespStatus[status].length > 0)
              ? html`${this.responseHeaderListTemplate(this.headersForEachRespStatus[status])}`
              : ''
            }
          </div>
          ${Object.keys(this.mimeResponsesForEachStatus[status]).length === 0
            ? ''
            : html`
              <div class="tab-panel col">
                <div class="tab-buttons row" @click="${(e) => { if (e.target.tagName.toLowerCase() === 'button') { this.activeSchemaTab = e.target.dataset.tab; } }}" >
                  <button class="tab-btn ${this.activeSchemaTab === 'model' ? 'active' : ''}" data-tab='model'>${getI18nText('operations.model')}</button>
                  <button class="tab-btn ${this.activeSchemaTab !== 'model' ? 'active' : ''}" data-tab='body'>${getI18nText('operations.example')}</button>
                  <div style="flex:1"></div>
                  ${Object.keys(this.mimeResponsesForEachStatus[status]).length === 1
                    ? html`<span class='small-font-size gray-text' style='align-self:center; margin-top:8px;'> ${Object.keys(this.mimeResponsesForEachStatus[status])[0]} </span>`
                    : html`${this.mimeTypeDropdownTemplate(Object.keys(this.mimeResponsesForEachStatus[status]))}`
                  }
                </div>
                ${this.activeSchemaTab === 'body'
                  ? html`<div class='tab-content col' style='flex:1;'>
                      ${this.mimeExampleTemplate(this.mimeResponsesForEachStatus[status][this.selectedMimeType])}
                    </div>`
                  : html`<div class='tab-content col' style='flex:1;'>
                      ${this.mimeSchemaTemplate(this.mimeResponsesForEachStatus[status][this.selectedMimeType])}
                    </div>`
                }
              </div>
            `
          }`)
        }
    `;
  }

  responseHeaderListTemplate(respHeaders) {
    return html`
      <div style="padding:16px 0 8px 0" class="resp-headers small-font-size bold-text">${getI18nText('operations.response-headers')}</div> 
      <table role="presentation" style="border-collapse: collapse; margin-bottom:16px; border:1px solid var(--border-color); border-radius: var(--border-radius)" class="small-font-size mono-font">
        ${respHeaders.map((v) => html`
          <tr>
            <td style="padding:8px; vertical-align: baseline; min-width:120px; border-top: 1px solid var(--light-border-color); text-overflow: ellipsis;">
              ${v.name || ''}
            </td> 
            <td style="vertical-align: top;">
              <div class="regular-font m-markdown m-markdown-small">${unsafeHTML(marked(v.description || ''))}</div>
            </td>
            <td style="padding:8px; vertical-align: baseline; border-top: 1px solid var(--light-border-color); text-overflow: ellipsis;">
              ${v.schema?.example || ''}
            </td>
          </tr>
        `)}
    </table>`;
  }

  mimeTypeDropdownTemplate(mimeTypes) {
    return html`
      <select aria-label='mime type' @change="${(e) => { this.selectedMimeType = e.target.value; }}" style='margin-bottom: -1px; z-index:1'>
        ${mimeTypes.map((mimeType) => html`<option value='${mimeType}' ?selected = '${mimeType === this.selectedMimeType}'> ${mimeType} </option>`)}
      </select>`;
  }

  onSelectExample(e) {
    const exampleContainerEl = e.target.closest('.example-panel');
    const exampleEls = [...exampleContainerEl.querySelectorAll('.example')];

    exampleEls.forEach((v) => {
      v.style.display = v.dataset.example === e.target.value ? 'block' : 'none';
    });
  }

  mimeExampleTemplate(mimeRespDetails) {
    if (!mimeRespDetails) {
      return html`
        <pre style='color:var(--red)' class = 'example-panel border-top'> No example provided </pre>
      `;
    }
    return html`
      ${mimeRespDetails.examples.length === 1
        ? html`
          ${mimeRespDetails.examples[0].exampleSummary && mimeRespDetails.examples[0].exampleSummary.length > 80 ? html`<div style="padding: 4px 0"> ${mimeRespDetails.examples[0].exampleSummary} </div>` : ''}
          ${mimeRespDetails.examples[0].exampleDescription ? html`<div class="m-markdown-small" style="padding: 4px 0"> ${unsafeHTML(marked(mimeRespDetails.examples[0].exampleDescription || ''))} </div>` : ''}
          <syntax-highlighter class='example-panel generic-tree border-top pad-top-8' mime-type="${mimeRespDetails.examples[0].exampleType}" .content="${mimeRespDetails.examples[0].exampleValue}" copy/>`
        : html`
          <span class = 'example-panel generic-tree ${this.renderStyle === 'read' ? 'border pad-8-16' : 'border-top pad-top-8'}'>
            <select aria-label='response body example' @change='${(e) => this.onSelectExample(e)}'>
              ${mimeRespDetails.examples.map((v) => html`<option value="${v.exampleId}" ?selected=${v.exampleId === mimeRespDetails.selectedExample} > 
                ${!v.exampleSummary || v.exampleSummary.length > 80 ? v.exampleId : v.exampleSummary} 
              </option>`)}
            </select>
            ${mimeRespDetails.examples.map((v) => html`
              <div class="example" data-example = '${v.exampleId}' style = "display: ${v.exampleId === mimeRespDetails.selectedExample ? 'block' : 'none'}">
                ${v.exampleSummary && v.exampleSummary.length > 80 ? html`<div style="padding: 4px 0"> ${v.exampleSummary} </div>` : ''}
                ${v.exampleDescription && v.exampleDescription !== v.exampleSummary ? html`<div class="m-markdown-small" style="padding: 4px 0"> ${unsafeHTML(marked(v.exampleDescription || ''))} </div>` : ''}
                <syntax-highlighter mime-type="${v.exampleType}" .content="${v.exampleValue}" copy/>
              </div>  
            `)}
          </span>  
        `
      }
    `;
  }

  renderExampleTemplate(example) {
    return html`<syntax-highlighter content-type="${example.exampleType}" content="${example.exampleValue}"/>`;
  }

  exampleValueTemplate(example) {
    return html`<syntax-highlighter content-type="${example.exampleType}" content="${example.exampleValue}" copy/>`;
  }

  mimeSchemaTemplate(mimeRespDetails) {
    if (!mimeRespDetails) {
      return html`
        <pre style='color:var(--red)' class = '${this.renderStyle === 'read' ? 'border pad-8-16' : 'border-top'}'> Schema not found</pre>
      `;
    }
    return html`
      ${this.schemaStyle === 'table'
        ? html`
          <schema-table
            render-style = '${this.renderStyle}'
            .data = '${mimeRespDetails.schemaTree}'
            class = 'example-panel ${this.renderStyle === 'read' ? 'border pad-8-16' : 'border-top pad-top-8'}'
            schema-expand-level = "${this.schemaExpandLevel}"
            schema-hide-read-only = false
            schema-hide-write-only = ${this.schemaHideWriteOnly}
          > </schema-table> `
        : html`
          <schema-tree
            render-style = '${this.renderStyle}'
            .data = '${mimeRespDetails.schemaTree}'
            class = 'example-panel ${this.renderStyle === 'read' ? 'border pad-8-16' : 'pad-top-8'}'
            schema-expand-level = "${this.schemaExpandLevel}"
            schema-hide-read-only = false
            schema-hide-write-only = ${this.schemaHideWriteOnly}
          > </schema-tree>`
      }`;
  }
  /* eslint-enable indent */
}

// Register the element with the browser
if (!customElements.get('openapi-explorer')) {
  customElements.define('api-response', ApiResponse);
}
