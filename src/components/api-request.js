import { LitElement, html } from 'lit-element';
import marked from 'marked';

import { unsafeHTML } from 'lit-html/directives/unsafe-html';
// import { live } from 'lit-html/directives/live';
import TableStyles from '@/styles/table-styles';
import FlexStyles from '@/styles/flex-styles';
import InputStyles from '@/styles/input-styles';
import FontStyles from '@/styles/font-styles';
import BorderStyles from '@/styles/border-styles';
import TabStyles from '@/styles/tab-styles';
import {
  schemaInObjectNotation, getTypeInfo, generateExample, copyToClipboard,
} from '@/utils/common-utils';
import '@/components/json-tree';
import '@/components/schema-tree';
import '@/components/tag-input';

const textFileRegex = RegExp('^font/|tar$|zip$|7z$|rtf$|msword$|excel$|/pdf$|/octet-stream$|^application/vnd.');
const mediaFileRegex = RegExp('^audio/|^image/|^video/');

export default class ApiRequest extends LitElement {
  createRenderRoot() { return this; }

  constructor() {
    super();
    this.responseMessage = '';
    this.responseStatus = '';
    this.responseHeaders = '';
    this.responseText = '';
    this.responseUrl = '';
    this.responseElapsedMs = 0;
    this.curlSyntax = '';
    this.activeResponseTab = 'response'; // allowed values: response, headers, curl
    this.selectedRequestBodyType = '';
    this.selectedRequestBodyExample = '';
  }

  static get properties() {
    return {
      serverUrl: { type: String, attribute: 'server-url' },
      servers: { type: Array },
      method: { type: String },
      path: { type: String },
      elementId: { type: String, attribute: 'element-id' },
      parameters: { type: Array },
      request_body: { type: Object },
      api_keys: { type: Array },
      parser: { type: Object },
      accept: { type: String },
      callback: { type: String },
      responseMessage: { type: String, attribute: false },
      responseText: { type: String, attribute: false },
      responseHeaders: { type: String, attribute: false },
      responseStatus: { type: String, attribute: false },
      responseUrl: { type: String, attribute: false },
      responseElapsedMs: { type: Number, attribute: false },
      fillRequestWithDefault: { type: String, attribute: 'fill-defaults' },
      includeNulls: { type: Boolean, attribute: 'display-nulls', converter(value) { return value === 'true'; } },
      allowTry: { type: String, attribute: 'enable-console' },
      renderStyle: { type: String, attribute: 'render-style' },
      schemaStyle: { type: String, attribute: 'schema-style' },
      activeSchemaTab: { type: String, attribute: 'active-schema-tab' },
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaHideReadOnly: { type: String, attribute: 'schema-hide-read-only' },
      fetchCredentials: { type: String, attribute: 'fetch-credentials' },

      // properties for internal tracking
      activeResponseTab: { type: String }, // internal tracking of response-tab not exposed as a attribute
      selectedRequestBodyType: { type: String, attribute: 'selected-request-body-type' }, // internal tracking of selected request-body type
      selectedRequestBodyExample: { type: String, attribute: 'selected-request-body-example' }, // internal tracking of selected request-body example
    };
  }

  render() {
    return html`
    ${TableStyles}
    ${InputStyles}
    ${FontStyles}
    ${FlexStyles}
    ${BorderStyles}
    ${TabStyles}
    <style>
      .read-mode{
        margin-top:24px;
      }
      .param-name,
      .param-type{
        margin: 1px 0;
        text-align: right;
        line-height: 12px;
      }
      .param-name{
        color: var(--fg); 
        font-family: var(--font-mono);
      }
      .param-type{
        color: var(--light-fg); 
        font-family: var(--font-regular);
      }
      .param-constraint{
        min-width:100px;
      }
      .param-constraint:empty{
        display:none;
      }
      .top-gap{margin-top:24px;}

        .textarea {
          min-height:220px; 
          padding:5px;
          resize:vertical;
        }
        .example:first-child {
          margin-top: -9px;
        }

        .response-message{
          font-weight:bold;
          text-overflow: ellipsis;
        }
        .response-message.error {
          color:var(--red);
        }
        .response-message.success {
          color:var(--blue);
        }

        .file-input-container {
          align-items:flex-end;
        }
        .file-input-container .input-set:first-child .file-input-remove-btn{
          visibility:hidden;
        }

        .file-input-remove-btn{
          font-size:16px;
          color:var(--red);
          outline: none;
          border: none;
          background:none;
          cursor:pointer;
        }

        .v-tab-btn {
          font-size: var(--smal-font-size);
          height:24px; 
          border:none; 
          background:none; 
          opacity: 0.3;
          cursor: pointer;
          padding: 4px 8px;
        }
        .v-tab-btn.active {
          font-weight: bold;
          background: var(--bg);
          opacity: 1;
        }

        @media only screen and (min-width: 768px) {
          .textarea {
            padding:8px;
          }
        }
      `,
    ];
  }

  render() {
    return html`
    <div class="api-request col regular-font request-panel ${'read focused'.includes(this.renderStyle) || this.callback === 'true' ? 'read-mode' : 'view-mode'}">
      <div class=" ${this.callback === 'true' ? 'tiny-title' : 'req-res-title'} "> 
        ${this.callback === 'true' ? 'CALLBACK REQUEST' : getI18nText('operations.request')}
      </div>
      <div>
        ${this.inputParametersTemplate('path')}
        ${this.inputParametersTemplate('query')}
        ${this.requestBodyTemplate()}
        ${this.inputParametersTemplate('header')}
        ${this.inputParametersTemplate('cookie')}
        ${this.allowTry === 'false' ? '' : html`${this.apiCallTemplate()}`}
      </div>  
    </div>
    `;
  }

  updated(changedProperties) {
    // In focused mode after rendering the request component, update the text-areas(which contains examples) using the original values from hidden textareas.
    // This is done coz, user may update the dom by editing the textarea's and once the DOM is updated externally change detection wont happen, therefore update the values manually
    if (this.renderStyle !== 'focused') {
      return;
    }

    // dont update example as only tabs is switched
    if (changedProperties.size === 1 && changedProperties.has('activeSchemaTab')) {
      return;
    }

    const exampleTextAreaEls = [...this.querySelectorAll('textarea[data-ptype="form-data"]')];
    exampleTextAreaEls.forEach((el) => {
      const origExampleEl = this.querySelector(`textarea[data-pname='hidden-${el.dataset.pname}']`);
      if (origExampleEl) {
        el.value = origExampleEl.value;
      }
    });
  }

  /* eslint-disable indent */
  inputParametersTemplate(paramLocation) {
    const filteredParams = this.parameters ? this.parameters.filter((param) => param.in === paramLocation) : [];
    if (filteredParams.length === 0) {
      return '';
    }

    const title = {
      path: 'PATH PARAMETERS',
      query: 'QUERY-STRING PARAMETERS',
      header: 'REQUEST HEADERS',
      cookie: 'COOKIES'
    }[paramLocation];

    const tableRows = [];
    for (const param of filteredParams) {
      if (!param.schema) {
        continue;
      }
      const paramSchema = getTypeInfo(param.schema, { includeNulls: this.includeNulls });
      if (!paramSchema) {
        continue;
      }
      const defaultVal = Array.isArray(paramSchema.default) ? paramSchema.default : `${paramSchema.default}`;
      let paramStyle = 'form';
      let paramExplode = true;
      if (paramLocation === 'query') {
        if (param.style && 'form spaceDelimited pipeDelimited'.includes(param.style)) {
          paramStyle = param.style;
        }
        if (typeof param.explode === 'boolean') {
          paramExplode = param.explode;
        }
      }

      tableRows.push(html`
      <tr> 
        <td colspan="1" style="width:160px; min-width:50px; vertical-align: top">
          <div class="param-name ${paramSchema.deprecated ? 'deprecated' : ''}" style="margin-top: 1rem;">
            ${param.name}${!paramSchema.deprecated && param.required ? html`<span style='color:var(--red);'>*</span>` : ''}
          </div>
          <div class="param-type" style="margin-bottom: 1rem;">
            ${paramSchema.type === 'array'
              ? `${paramSchema.arrayType}`
              : `${paramSchema.format ? paramSchema.format : paramSchema.type}`
            }${!paramSchema.deprecated && param.required ? html`<span style='opacity: 0;'>*</span>` : ''}
          </div>
        </td>  
        <td colspan="2" style="min-width:160px; vertical-align: top">
          ${this.allowTry === 'true'
          ? paramSchema.type === 'array' && html`
              <tag-input class="request-param" 
                style = "width:100%; margin-top: 1rem; margin-bottom: 1rem;" 
                data-ptype = "${paramLocation}"
                data-pname = "${param.name}"
                data-default = "${Array.isArray(defaultVal) ? defaultVal.join('~|~') : defaultVal}"
                data-param-serialize-style = "${paramStyle}"
                data-param-serialize-explode = "${paramExplode}"
                data-array = "true"
                placeholder="${paramSchema.example || (Array.isArray(defaultVal) ? defaultVal[0] : defaultVal) || 'add-multiple ↩'}"
                .value = "${Array.isArray(defaultVal) ? defaultVal : defaultVal.split(',')}"></tag-input>`
            || paramSchema.type === 'object' && html`
              <textarea 
                class = "textarea small request-param"
                part = "textarea small textarea-param"
                rows = 3
                data-ptype = "${paramLocation}"
                data-pname = "${param.name}"
                data-default = "${defaultVal}"
                data-param-serialize-style = "${paramStyle}"
                data-param-serialize-explode = "${paramExplode}"
                spellcheck = "false"
                placeholder="${paramSchema.example || defaultVal || ''}"
                style = "width:100%; margin-top: 1rem; margin-bottom: 1rem;"
                .value="${this.fillRequestWithDefault === 'true' ? defaultVal : ''}"></textarea>`
            || html`
              <input type="${paramSchema.format === 'password' ? 'password' : 'text'}" spellcheck="false" style="width:100%; margin-top: 1rem; margin-bottom: 1rem;"
                placeholder="${paramSchema.example || defaultVal || ''}"
                class="request-param"
                part="textbox textbox-param"
                data-ptype="${paramLocation}"
                data-pname="${param.name}" 
                data-default="${Array.isArray(defaultVal) ? defaultVal.join('~|~') : defaultVal}"
                data-array="false"
                @keyup="${this.requestParamFunction}"
                .value="${this.fillRequestWithDefault === 'true' ? defaultVal : ''}"
              />`
          : ''}

          <div style="min-width:50px; margin-bottom: 1rem;">
            ${this.exampleListTemplate.call(this, param, paramSchema.type)}
          </div>
        </td>
        ${this.renderStyle === 'focused'
          ? html`
            <td colspan="2">
              ${param.description
                ? html`
                  <div class="param-description">
                      ${unsafeHTML(marked(param.description))}
                  </div>`
                : ''
              }
              ${paramSchema.default || paramSchema.s || paramSchema.allowedValues || paramSchema.pattern
                ? html`
                  <div class="param-constraint">
                    ${paramSchema.constraints.length ? html`<span style="font-weight:bold">Constraints: </span>${paramSchema.constraints.join(', ')}<br>` : ''}
                    ${paramSchema.pattern ? html`
                    <div class="tooltip tooltip-replace" style="cursor: pointer; max-width: 100%; display: flex;">
                      <div style="white-space:nowrap; font-weight:bold; margin-right: 2px;">Pattern: </div>
                      <div style="white-space:nowrap; text-overflow:ellipsis; max-width:100%; overflow:hidden;">${paramSchema.pattern}</div>
                      <br>
                      <div class="tooltip-text" style="position: absolute; display:block;">${paramSchema.pattern}</div>
                    </div>
                    ` : ''}
                    ${paramSchema.allowedValues && paramSchema.allowedValues.split('┃').map((v, i) => html`
                      ${i > 0 ? '|' : html`<span style="font-weight:bold">Allowed: </span>`}
                      ${html`
                        <a part="anchor anchor-param-constraint" class = "${this.allowTry === 'true' ? '' : 'inactive-link'}"
                          data-type="${paramSchema.type === 'array' ? 'array' : 'string'}"
                          data-enum="${v.trim()}"
                          @click="${(e) => {
                            const inputEl = e.target.closest('table').querySelector(`[data-pname="${param.name}"]`);
                            if (inputEl) {
                              inputEl.value = e.target.dataset.type === 'array' ? [e.target.dataset.enum] : e.target.dataset.enum;
                            }
                          }}"
                        >
                          ${v} 
                        </a>`
                      }`)}
                  </div>`
                : ''
              }
            </td>  
          </tr>`
        : ''
      }
    `);
    }

    return html`
    <div class="table-title top-gap">${title}${paramLocation === 'path' ? html`<span style='color:var(--red);'>*</span>` : ''}</div>
    <div style="display:block; overflow-x:auto; max-width:100%;">
      <table role="presentation" class="m-table" style="width:100%; word-break:break-word;">
        ${tableRows}
      </table>
    </div>`;
  }

  renderExample(example, paramType, paramName) {
    return html`
      <a
        part="anchor anchor-param-example"
        class="${this.allowTry === 'true' ? '' : 'inactive-link'}"
        data-example-type="${paramType === 'array' ? paramType : 'string'}"
        data-example="${Array.isArray(example.exampleValue) ? example.exampleValue?.join('~|~') : example.exampleValue}"
        @click="${(e) => {
          const inputEl = e.target.closest('table').querySelector(`[data-pname="${paramName}"]`);
          if (inputEl) {
            inputEl.value = paramType === 'array' ? (e.target.dataset.example.split('~|~') || []) : e.target.dataset.example;
          }
        }}">${Array.isArray(example.exampleValue) ? example.exampleValue?.join(', ') : example.exampleValue}
      </a>
    `;
  }

  renderShortFormatExamples(examples, paramType, paramName) {
    return html`${examples.map((example, i) => html`
      ${i === 0 ? '' : '┃'}
      ${this.renderExample(example, paramType, paramName)}`)}`;
  }

  renderLongFormatExamples(exampleList, paramType, paramName) {
    return html`
      <ul style="margin-block-start: 0.25em;">
        ${exampleList.map(example =>
          html`
            <li>
              ${this.renderExample(example, paramType, paramName)}
              ${example.exampleSummary?.length > 0 ? html`<span>&lpar;${example.exampleSummary}&rpar;</span>` : ''}
              ${example.exampleDescription?.length > 0 ? html`<p>${unsafeHTML(marked(example.exampleDescription))}</p>` : ''}
            </li>`
        )}
      </ul>`;
  }

  /* eslint-disable indent */

  exampleListTemplate(param, paramType) {
    const paramName = param.name;
    const paramSchema = getTypeInfo(param.schema, { includeNulls: this.includeNulls });

    const examples = generateExample(
      param.examples || param.example && { Example: { value: param.example } } || paramSchema.examples || paramSchema.example && { Example: { value: paramSchema.example } },
      null, param.schema, null, false, true, 'json', false);

    const someExampleWithSummaryOrDescription = examples.some((x) => x.exampleSummary?.length > 0 || x.exampleDescription?.length > 0);
    if (examples.length === 1) {
      return html` ${examples.length > 0
        ? html`<span style="font-weight:bold">Example: </span>
            ${
              someExampleWithSummaryOrDescription
              ? this.renderLongFormatExamples(examples, paramType, paramName)
              : this.renderShortFormatExamples(examples, paramType, paramName)
            }`
        : ''}`;
    }

    return html` ${examples.length > 1
      ? html`<span style="font-weight:bold">Examples: </span>
          ${
            someExampleWithSummaryOrDescription
            ? this.renderLongFormatExamples(examples, paramType, paramName)
            : this.renderShortFormatExamples(examples, paramType, paramName)
          }`
      : ''}`;
  }

  resetRequestBodySelection() {
    this.selectedRequestBodyType = '';
    this.selectedRequestBodyExample = '';
    this.clearResponseData();
  }

  // Request-Body Event Handlers
  onSelectExample(e) {
    this.selectedRequestBodyExample = e.target.value;
    const exampleDropdownEl = e.target;
    window.setTimeout((selectEl) => {
      const exampleTextareaEl = selectEl.closest('.example-panel').querySelector('.request-body-param');
      const userInputExampleTextareaEl = selectEl.closest('.example-panel').querySelector('.request-body-param-user-input');
      userInputExampleTextareaEl.value = exampleTextareaEl.value;
    }, 0, exampleDropdownEl);
  }

  onMimeTypeChange(e) {
    this.selectedRequestBodyType = e.target.value;
    const mimeDropdownEl = e.target;
    this.selectedRequestBodyExample = '';
    window.setTimeout((selectEl) => {
      const exampleTextareaEl = selectEl.closest('.request-body-container').querySelector('.request-body-param');
      if (exampleTextareaEl) {
        const userInputExampleTextareaEl = selectEl.closest('.request-body-container').querySelector('.request-body-param-user-input');
        userInputExampleTextareaEl.value = exampleTextareaEl.value;
      }
    }, 0, mimeDropdownEl);
  }

  requestBodyTemplate() {
    if (!this.request_body) {
      return '';
    }
    if (Object.keys(this.request_body).length === 0) {
      return '';
    }

    if (this.method === 'get' || this.method === 'head') {
      return '';
    }

    // Variable to store partial HTMLs
    let reqBodyTypeSelectorHtml = '';
    let reqBodyFileInputHtml = '';
    let reqBodySchemaHtml = '';
    let reqBodyDefaultHtml = '';
    let bodyTabNameUseBody = true;

    const requestBodyTypes = [];
    const content = this.request_body.content;
    for (const mimeType in content) {
      requestBodyTypes.push({
        mimeType,
        schema: content[mimeType].schema,
        example: content[mimeType].example,
        examples: content[mimeType].examples,
      });
      if (!this.selectedRequestBodyType) {
        this.selectedRequestBodyType = mimeType;
      }
    }
    // MIME Type selector
    reqBodyTypeSelectorHtml = requestBodyTypes.length === 1
      ? ''
      : html`
        <select aria-label="mime type" style="min-width:100px; max-width:100%;  margin-bottom:-1px;" @change = '${(e) => this.onMimeTypeChange(e)}'>
          ${requestBodyTypes.map((reqBody) => html`
            <option value = '${reqBody.mimeType}' ?selected = '${reqBody.mimeType === this.selectedRequestBodyType}'>
              ${reqBody.mimeType}
            </option> `)
          }
        </select>
      `;

    // For Loop - Main
    const reqBody = requestBodyTypes.find(req => req.mimeType === this.selectedRequestBodyType);
    // Generate Example
    if (this.selectedRequestBodyType.includes('json') || this.selectedRequestBodyType.includes('xml') || this.selectedRequestBodyType.includes('text')) {
      const reqBodyExamples = generateExample(
        reqBody.examples ? reqBody.examples : '',
        reqBody.example ? reqBody.example : '',
        reqBody.schema,
        reqBody.mimeType,
        false,
        true,
        'text',
        true
      );

      if (!this.selectedRequestBodyExample) {
        this.selectedRequestBodyExample = (reqBodyExamples.length > 0 ? reqBodyExamples[0].exampleId : '');
      }
      const displayedBodyExample = reqBodyExamples.find(v => v.exampleId === this.selectedRequestBodyExample);
      reqBodyDefaultHtml = html`
        <div class = 'example-panel border-top pad-top-8'>
          ${reqBodyExamples.length === 1
            ? ''
            : html`
              <select aria-label='request body example' style="min-width:100px; max-width:100%;  margin-bottom:-1px;" @change='${(e) => this.onSelectExample(e)}'>
                ${reqBodyExamples.map((v) => html`<option value="${v.exampleId}" ?selected=${v.exampleId === this.selectedRequestBodyExample}> 
                  ${v.exampleSummary.length > 80 ? v.exampleId : v.exampleSummary ? v.exampleSummary : v.exampleId} 
                </option>`)}
              </select>`
          }
          <div class="example" data-default = '${displayedBodyExample.exampleId}'>
            ${displayedBodyExample.exampleSummary && displayedBodyExample.exampleSummary.length > 80 ? html`<div style="padding: 4px 0"> ${displayedBodyExample.exampleSummary} </div>` : ''}
            ${displayedBodyExample.exampleDescription ? html`<div class="m-markdown-small" style="padding: 4px 0"> ${unsafeHTML(marked(displayedBodyExample.exampleDescription || ''))} </div>` : ''}
              <!-- this textarea is for user to edit the example -->
            <slot name="${this.elementId}--request-body">
              <textarea 
                class = "textarea request-body-param-user-input"
                part = "textarea textarea-param"
                spellcheck = "false"
                data-ptype = "${reqBody.mimeType}" 
                data-default = "${displayedBodyExample.exampleFormat === 'text' ? displayedBodyExample.exampleValue : JSON.stringify(displayedBodyExample.exampleValue, null, 8)}"
                data-default-format = "${displayedBodyExample.exampleFormat}"
                style="width:100%; resize:vertical;"
                .value="${this.fillRequestWithDefault === 'true' ? (displayedBodyExample.exampleFormat === 'text' ? displayedBodyExample.exampleValue : JSON.stringify(displayedBodyExample.exampleValue, null, 8)) : ''}"
              ></textarea>
            </slot>

            <!-- This textarea(hidden) is to store the original example value, this will remain unchanged when users switches from one example to another, its is used to populate the editable textarea -->
            <textarea 
              class = "textarea is-hidden request-body-param ${reqBody.mimeType.substring(reqBody.mimeType.indexOf('/') + 1)}" 
              spellcheck = "false"
              data-ptype = "${reqBody.mimeType}" 
              style="width:100%; resize:vertical; display:none"
              .value="${(displayedBodyExample.exampleFormat === 'text' ? displayedBodyExample.exampleValue : JSON.stringify(displayedBodyExample.exampleValue, null, 8))}"
            ></textarea>
          </div>  

        </div>
      `;
    } else if (this.selectedRequestBodyType.includes('form-urlencoded') || this.selectedRequestBodyType.includes('form-data')) {
      bodyTabNameUseBody = false;
      const schemaAsObj = schemaInObjectNotation(reqBody.schema, { includeNulls: this.includeNulls });
      reqBodyDefaultHtml = getRequestFormTable.call(this, schemaAsObj, this.selectedRequestBodyType);
    } else if (mediaFileRegex.test(this.selectedRequestBodyType) || textFileRegex.test(this.selectedRequestBodyType)) {
      reqBodyFileInputHtml = html`
        <div class = "small-font-size bold-text row">
          <input type="file" part="file-input" style="max-width:100%" class="request-body-param-file" data-ptype="${reqBody.mimeType}" spellcheck="false" />
        </div>  
      `;
    }

    // Generate Schema
    if (reqBody.mimeType.includes('json') || reqBody.mimeType.includes('xml') || reqBody.mimeType.includes('text') || reqBody.mimeType.includes('form-')) {
      const schemaAsObj = schemaInObjectNotation(reqBody.schema, { includeNulls: this.includeNulls });
      if (this.schemaStyle === 'table') {
        reqBodySchemaHtml = html`
        ${reqBodySchemaHtml}
          <schema-table
            class = '${reqBody.mimeType.substring(reqBody.mimeType.indexOf('/') + 1)} pad-top-8'
            style = 'display: ${this.selectedRequestBodyType === reqBody.mimeType ? 'block' : 'none'};'
            .data = '${schemaAsObj}'
            schema-expand-level = "${this.schemaExpandLevel}"
            schema-hide-read-only = "${this.schemaHideReadOnly.includes(this.method)}"
            schema-hide-write-only = false
          > </schema-table>
        `;
      } else {
        reqBodySchemaHtml = html`
          ${reqBodySchemaHtml}
          <schema-tree
            class = '${reqBody.mimeType.substring(reqBody.mimeType.indexOf('/') + 1)} pad-top-8'
            style = 'display: ${this.selectedRequestBodyType === reqBody.mimeType ? 'block' : 'none'};'
            .data = '${schemaAsObj}'
            schema-expand-level = "${this.schemaExpandLevel}"
            schema-hide-read-only = "${this.schemaHideReadOnly.includes(this.method)}"
            schema-hide-write-only = false
          > </schema-tree>
        `;
      }
    }

    return html`
      <div class='request-body-container' data-selected-request-body-type="${this.selectedRequestBodyType}">
        <div class="table-title top-gap row">
          REQUEST BODY ${this.request_body.required ? html`<span class="mono-font" style='color:var(--red)'>*</span>` : ''} 
          <span style = "font-weight:normal; margin-left:5px"> ${this.selectedRequestBodyType}</span>
          <span style="flex:1"></span>
          ${reqBodyTypeSelectorHtml}
        </div>
        ${this.request_body.description ? html`<div class="m-markdown" style="margin-bottom:12px">${unsafeHTML(marked(this.request_body.description))}</div>` : ''}
        
        ${reqBodySchemaHtml || reqBodyDefaultHtml
          ? html`
            <div class="tab-panel col" style="border-width:0 0 1px 0;">
              <div class="tab-buttons row" @click="${(e) => { if (e.target.tagName.toLowerCase() === 'button') { this.activeSchemaTab = e.target.dataset.tab; } }}">
                <button class="tab-btn ${this.activeSchemaTab === 'model' ? 'active' : ''}" data-tab="model" >${getI18nText('operations.model')}</button>
                <button class="tab-btn ${this.activeSchemaTab !== 'model' ? 'active' : ''}" data-tab="body">${bodyTabNameUseBody ? getI18nText('operations.body') : getI18nText('operations.form')}</button>
              </div>
              ${html`<div class="tab-content col" style="display: ${this.activeSchemaTab === 'model' ? 'block' : 'none'}"> ${reqBodySchemaHtml}</div>`}
              ${html`<div class="tab-content col" style="display: ${this.activeSchemaTab === 'model' ? 'none' : 'block'}"> ${reqBodyDefaultHtml}</div>`}
            </div>`
          : html`${reqBodyFileInputHtml}`
        }
      </div>  
    `;
  }

  // formDataTemplate(schema, mimeType, exampleValue = '') {
  //   return html`
  //     <textarea
  //       class = "textarea dynamic-form-param ${mimeType}"
  //       part = "textarea textarea-param"
  //       spellcheck = "false"
  //       data-pname="dynamic-form"
  //       data-ptype="${mimeType}"
  //       style="width:100%"
  //     >${exampleValue}</textarea>
  //     ${schema.description ? html`<span class="m-markdown-small">${unsafeHTML(marked(schema.description))}</span>` : ''}
  //   `;
  // }

  apiResponseTabTemplate() {
    const responseFormat = this.responseHeaders.includes('json') ? 'json' : (this.responseHeaders.includes('html') || this.responseHeaders.includes('xml')) ? 'html' : '';
    return html`
      <div class="row" style="font-size:var(--font-size-small); margin:5px 0">
      ${this.responseMessage
        ? html`<div class="response-message ${this.responseStatus}">Response Status: ${this.responseMessage}
          ${this.responseElapsedMs ? html`<span><br>Execution Time: ${this.responseElapsedMs}ms</span>` : ''}
        </div>` : ''
      }
      <div style="flex:1"></div>
        <button class="m-btn" part="btn btn-outline" @click="${this.clearResponseData}">CLEAR RESPONSE</button>
      </div>
      <div class="tab-panel col" style="border-width:0 0 1px 0;">
        <div id="tab_buttons" class="tab-buttons row" @click="${(e) => {
            if (e.target.classList.contains('tab-btn') === false) { return; }
            this.activeResponseTab = e.target.dataset.tab;
        }}">
          <button class="tab-btn ${this.activeResponseTab === 'response' ? 'active' : ''}" data-tab = 'response'>${getI18nText('operations.response')}</button>
          <button class="tab-btn ${this.activeResponseTab === 'headers' ? 'active' : ''}"  data-tab = 'headers'>${getI18nText('operations.response-headers')}</button>
          <button class="tab-btn ${this.activeResponseTab === 'curl' ? 'active' : ''}" data-tab = 'curl'>CURL</button>
        </div>
        ${this.responseIsBlob
          ? html`
            <div class="tab-content col" style="flex:1; display:${this.activeResponseTab === 'response' ? 'flex' : 'none'};">
              <button class="m-btn thin-border mar-top-8" style="width:135px" @click="${this.downloadResponseBlob}" part="btn btn-outline">DOWNLOAD</button>
              ${this.responseBlobType === 'view'
                ? html`<button class="m-btn thin-border mar-top-8" style="width:135px" @click="${this.viewResponseBlob}" part="btn btn-outline">VIEW (NEW TAB)</button>`
                : ''
              }
            </div>`
          : html`
            <div class="tab-content col m-markdown" style="flex:1; display:${this.activeResponseTab === 'response' ? 'flex' : 'none'};" >
              ${this.responseText
                ? html`<button class="m-btn outline-primary toolbar-copy-btn" @click='${(e) => { copyToClipboard(this.responseText, e); }}' part="btn btn-fill">${getI18nText('operations.copy')}</button>`
                : ''
              }
              <pre style="min-height: 60px" @copy='${() => { copyToClipboard(window.getSelection().toString()); }}'>${responseFormat
                ? html`<code>${unsafeHTML(Prism.highlight(this.responseText, Prism.languages[responseFormat], responseFormat))}</code>`
                : `${this.responseText}`
              }
              </pre>
            </div>`
        }
        <div class="tab-content col m-markdown" style="flex:1;display:${this.activeResponseTab === 'headers' ? 'flex' : 'none'};" >
          <button class="m-btn outline-primary toolbar-copy-btn" @click='${(e) => { copyToClipboard(this.responseHeaders, e); }}' part="btn btn-fill">${getI18nText('operations.copy')}</button>
          <pre><code>${unsafeHTML(Prism.highlight(this.responseHeaders, Prism.languages.css, 'css'))}</code></pre>
        </div>
        <div class="tab-content col m-markdown" style="flex:1;display:${this.activeResponseTab === 'curl' ? 'flex' : 'none'};">
          <button class="m-btn outline-primary toolbar-copy-btn" @click='${(e) => { copyToClipboard(this.curlSyntax, e); }}' part="btn btn-fill">${getI18nText('operations.copy')}</button>
          <pre class="fs-exclude" data-hj-suppress data-sl="mask">
            <code>${unsafeHTML(Prism.highlight(this.curlSyntax.trim(), Prism.languages.shell, 'shell'))}</code>
          </pre>
        </div>
      </div>`;
  }

  apiCallTemplate() {
    return html`
    <div style="display:flex; align-items:flex-end; margin:16px 0; font-size:var(--font-size-small);">
      ${
        this.parameters.length > 0 || this.request_body
          ? html`
            <button class="m-btn thin-border" part="btn btn-outline" style="margin-right:5px;" @click="${this.onClearRequestData}">
              ${getI18nText('operations.clear')}
            </button>`
          : ''
      }
      <button class="m-btn primary btn-execute thin-border" part="btn btn-fill btn-try" @click="${this.onTryClick}">${getI18nText('operations.execute')}</button>
    </div>
    ${this.responseMessage === ''
      ? ''
      : html`
        <div class="row" style="font-size:var(--font-size-small); margin:5px 0">
          <div class="response-message ${this.responseStatus}">Response Status: ${this.responseMessage}</div>
          <div style="flex:1"></div>
          <button class="m-btn" style="padding: 6px 0px;width:60px" @click="${this.clearResponseData}">CLEAR</button>
        </div>
        <div class="tab-panel col" style="border-width:0 0 1px 0;">
          <div id="tab_buttons" class="tab-buttons row" @click="${(e) => { this.activeResponseTab = e.target.dataset.tab; }}">
            <button class="tab-btn ${this.activeResponseTab === 'response' ? 'active' : ''}" data-tab = 'response' > RESPONSE</button>
            <button class="tab-btn ${this.activeResponseTab === 'headers' ? 'active' : ''}"  data-tab = 'headers' > RESPONSE HEADERS</button>
            <button class="tab-btn ${this.activeResponseTab === 'curl' ? 'active' : ''}" data-tab = 'curl'>CURL</button>
          </div>
          <div class="tab-content col" style="flex:1; display:${this.activeResponseTab === 'response' ? 'flex' : 'none'};">
            ${this.responseIsBlob
              ? html`
                <div style="margin:10px 2px"> 
                  <button class="m-btn" @click="${this.downloadResponseBlob}">DOWNLOAD</button>
                </div>`
              : html`
                <pre class="multiline">${this.responseText}</pre>
              `
            }
          </div>
          <div class="tab-content col" style="flex:1;display:${this.activeResponseTab === 'headers' ? 'flex' : 'none'};" >
            <pre class="multiline">${this.responseHeaders}</pre>
          </div>
          <div class="tab-content col" style="flex:1;display:${this.activeResponseTab === 'curl' ? 'flex' : 'none'};">
            <pre class="multiline" style="white-space: normal;">${this.curlSyntax}</pre>
          </div>
        </div>`
      }
      <slot style="display:block"></slot>
    `;
  }
  /* eslint-enable indent */

  onClearRequestData(e) {
    const requestPanelEl = e.target.closest('.request-panel');
    const requestPanelInputEls = [...requestPanelEl.querySelectorAll('input, tag-input, textarea:not(.is-hidden)')];
    requestPanelInputEls.forEach((el) => { el.value = ''; });

    const event = { bubbles: true, composed: true, detail: { explorerLocation: this.elementId, operation: { method: this.method, path: this.path }, type: 'RequestCleared' } };
    this.dispatchEvent(new CustomEvent('event', event));
  }

  async onTryClick() {
    const tryBtnEl = this.querySelectorAll('.btn-execute')[0];
    let curlData = '';
    let curlForm = '';
    const closestRespContainer = this.closest('.expanded-req-resp-container, .req-resp-container');
    const respEl = closestRespContainer && closestRespContainer.getElementsByTagName('api-response')[0];
    const acceptHeader = respEl?.selectedMimeType;
    const requestPanelEl = this.closest('.request-panel');
    const pathParamEls = [...requestPanelEl.querySelectorAll("[data-ptype='path']")];
    const queryParamEls = [...requestPanelEl.querySelectorAll("[data-ptype='query']")];
    const queryParamObjTypeEls = [...requestPanelEl.querySelectorAll("[data-ptype='query-object']")];
    const headerParamEls = [...requestPanelEl.querySelectorAll("[data-ptype='header']")];
    const requestBodyContainerEl = requestPanelEl.querySelector('.request-body-container');

    let pathUrl = `${this.serverUrl.replace(/\/$/, '')}${this.path.replaceAll(' ', '')}`;

    // Generate URL using Path Params
    pathParamEls.map((el) => {
      pathUrl = pathUrl.replace(`{${el.dataset.pname}}`, encodeURIComponent(el.value) || '-');
    });

    // Handle relative serverUrls
    if (!pathUrl.startsWith('http')) {
      const newUrl = new URL(pathUrl, window.location.href);
      pathUrl = newUrl.toString();
    }

    const fetchUrl = new URL(pathUrl);

    const fetchOptions = {
      method: this.method.toUpperCase(),
      headers: new Headers()
    };

    // Query Params
    if (queryParamEls.length > 0) {
      queryParamEls.forEach((el) => {
        if (el.dataset.array === 'false') {
          if (el.value !== '') {
            fetchUrl.searchParams.append(el.dataset.pname, el.value);
          }
        } else {
          const paramSerializeStyle = el.dataset.paramSerializeStyle;
          const paramSerializeExplode = el.dataset.paramSerializeExplode;
          let vals = ((el.value && Array.isArray(el.value)) ? el.value : []);
          vals = Array.isArray(vals) ? vals.filter((v) => v !== '') : [];
          if (vals.length > 0) {
            if (paramSerializeStyle === 'spaceDelimited') {
              fetchUrl.searchParams.append(el.dataset.pname, vals.join(' ').replace(/^\s|\s$/g, ''));
            } else if (paramSerializeStyle === 'pipeDelimited') {
              fetchUrl.searchParams.append(el.dataset.pname, vals.join('|').replace(/^\||\|$/g, ''));
            } else {
              if (paramSerializeExplode === 'true') { // eslint-disable-line no-lonely-if
                vals.forEach((v) => { fetchUrl.searchParams.append(el.dataset.pname, v); });
              } else {
                fetchUrl.searchParams.append(el.dataset.pname, vals.join(',').replace(/^,|,$/g, ''));
              }
            }
          }
        }
      });
    }

    // Query Params (Dynamic - create from JSON)
    if (queryParamObjTypeEls.length > 0) {
      queryParamObjTypeEls.map((el) => {
        try {
          let queryParamObj = {};
          const paramSerializeStyle = el.dataset.paramSerializeStyle;
          const paramSerializeExplode = el.dataset.paramSerializeExplode;
          queryParamObj = Object.assign(queryParamObj, JSON.parse(el.value.replace(/\s+/g, ' ')));
          for (const key in queryParamObj) {
            if (typeof queryParamObj[key] === 'object') {
              if (Array.isArray(queryParamObj[key])) {
                if (paramSerializeStyle === 'spaceDelimited') {
                  fetchUrl.searchParams.append(key, queryParamObj[key].join(' '));
                } else if (paramSerializeStyle === 'pipeDelimited') {
                  fetchUrl.searchParams.append(key, queryParamObj[key].join('|'));
                } else {
                  if (paramSerializeExplode === 'true') { // eslint-disable-line no-lonely-if
                    queryParamObj[key].forEach((v) => {
                      fetchUrl.searchParams.append(key, v);
                    });
                  } else {
                    fetchUrl.searchParams.append(key, queryParamObj[key]);
                  }
                }
              }
            } else {
              fetchUrl.searchParams.append(key, queryParamObj[key]);
            }
          }
        } catch (err) {
          console.log('OpenAPI Explorer: unable to parse %s into object', el.value); // eslint-disable-line no-console
        }
      });
    }

    // Add Authentication api keys if provided
    this.api_keys.filter((v) => v.finalKeyValue).forEach((v) => {
      if (v.in === 'query') {
        fetchUrl.searchParams.append(v.name, v.finalKeyValue);
        return;
      }

      // Otherwise put it in the header
      fetchOptions.headers.append(v.name, v.finalKeyValue);
    });

    fetchUrl = `${fetchUrl}${urlQueryParam.toString() ? '?' : ''}${urlQueryParam.toString()}`;

    // Final URL for API call
    fetchUrl = `${this.serverUrl.replace(/\/$/, '')}${fetchUrl}`;
    if (fetchUrl.startsWith('http') === false) {
      const url = new URL(fetchUrl, window.location.href);
      curlUrl = url.href;
    } else {
      curlUrl = fetchUrl;
    }
    curl = `curl -X ${this.method.toUpperCase()} "${curlUrl}" `;

    if (acceptHeader) {
      // Uses the acceptHeader from Response panel
      fetchOptions.headers.append('Accept', acceptHeader);
    } else if (this.accept) {
      fetchOptions.headers.Accept = this.accept;
      curlHeaders += ` -H "Accept: ${this.accept}"`;
    }

    // Add Header Params
    headerParamEls.map((el) => {
      if (el.value) {
        fetchOptions.headers[el.dataset.pname] = el.value;
        curlHeaders += ` -H "${el.dataset.pname}: ${el.value}"`;
      }
    });

    // Add Authentication Header if provided
    this.api_keys
      .filter((v) => (v.in === 'header'))
      .forEach((v) => {
        fetchOptions.headers[v.name] = v.finalKeyValue;
        curlHeaders += ` -H "${v.name}: ${v.finalKeyValue}"`;
      });

    // Request Body Params
    if (requestBodyContainerEl) {
      const requestBodyType = requestBodyContainerEl.dataset.selectedRequestBodyType;
      if (requestBodyType.includes('form-urlencoded')) {
        // url-encoded Form Params (dynamic) - Parse JSON and generate Params
        const formUrlDynamicTextAreaEl = requestPanelEl.querySelector("[data-ptype='dynamic-form']");
        if (formUrlDynamicTextAreaEl) {
          const val = formUrlDynamicTextAreaEl.value;
          const formUrlDynParams = new URLSearchParams();
          let proceed = true;
          let tmpObj;
          if (val) {
            try {
              tmpObj = JSON.parse(val);
            } catch (err) {
              proceed = false;
              console.warn('OpenAPI Explorer: Invalid JSON provided', err); // eslint-disable-line no-console
            }
          } else {
            proceed = false;
          }
          if (proceed) {
            for (const prop in tmpObj) {
              formUrlDynParams.append(prop, JSON.stringify(tmpObj[prop]));
            }
            fetchOptions.body = formUrlDynParams;
            curlData = ` -d ${formUrlDynParams.toString()}`;
          }
        } else {
          // url-encoded Form Params (regular)
          const formUrlEls = [...requestPanelEl.querySelectorAll("[data-ptype='form-urlencode']")];
          const formUrlParams = new URLSearchParams();
          formUrlEls
            .filter((v) => (v.type !== 'file'))
            .forEach((el) => {
              if (el.dataset.array === 'false') {
                if (el.value) {
                  formUrlParams.append(el.dataset.pname, el.value);
                }
              } else {
                const vals = (el.value && Array.isArray(el.value)) ? el.value.join(',') : '';
                formUrlParams.append(el.dataset.pname, vals);
              }
            });
          fetchOptions.body = formUrlParams;
          curlData = ` -d ${formUrlParams.toString()}`;
        }
      } else if (requestBodyType.includes('form-data')) {
        const formDataParams = new FormData();
        const formDataEls = [...requestPanelEl.querySelectorAll("[data-ptype='form-data']")];
        formDataEls.forEach((el) => {
          if (el.dataset.array === 'false') {
            if (el.type === 'file' && el.files[0]) {
              formDataParams.append(el.dataset.pname, el.files[0], el.files[0].name);
              curlForm += ` -F "${el.dataset.pname}=@${el.files[0].name}"`;
            } else if (el.value) {
              formDataParams.append(el.dataset.pname, el.value);
              curlForm += ` -F "${el.dataset.pname}=${el.value}"`;
            }
          } else if (el.value && Array.isArray(el.value)) {
            el.value.forEach((v) => {
              curlForm = `${curlForm} -F "${el.dataset.pname}[]=${v}"`;
            });
            formDataParams.append(el.dataset.pname, el.value.join(','));
          }
        });
        fetchOptions.body = formDataParams;
      } else if (mediaFileRegex.test(requestBodyType) || textFileRegex.test(requestBodyType)) {
        const bodyParamFileEl = requestPanelEl.querySelector('.request-body-param-file');
        if (bodyParamFileEl && bodyParamFileEl.files[0]) {
          fetchOptions.body = bodyParamFileEl.files[0];
          curlData = ` --data-binary @${bodyParamFileEl.files[0].name}`;
        }
      } else if (requestBodyType.includes('json') || requestBodyType.includes('xml') || requestBodyType.includes('text')) {
        const exampleTextAreaEl = requestPanelEl.querySelector('.request-body-param-user-input');
        if (exampleTextAreaEl && exampleTextAreaEl.value) {
          fetchOptions.body = exampleTextAreaEl.value;
          curlData = ` -d ${JSON.stringify(exampleTextAreaEl.value.replace(/(\r\n|\n|\r)/gm, ''))}`;
        }
      }
      // Common for all request-body
      if (!requestBodyType.includes('form-data')) {
        // For multipart/form-data don't set the content-type to allow creation of browser generated part boundaries
        fetchOptions.headers.append('Content-Type', requestBodyType);
      }
      curlHeaders += ` -H "Content-Type: ${requestBodyType}"`;
    }

    this.responseIsBlob = false;
    this.respContentDisposition = '';
    if (this.responseBlobUrl) {
      URL.revokeObjectURL(this.responseBlobUrl);
      this.responseBlobUrl = '';
    }

    if (this.fetchCredentials) {
      fetchOptions.credentials = this.fetchCredentials;
    }

    // Options is legacy usage, documentation has been updated to reference properties of the fetch option directly, but older usages may still be using options
    const fetchRequest = { explorerLocation: this.elementId, url: fetchUrl.toString(), options: fetchOptions, ...fetchOptions };
    const event = {
      bubbles: true,
      composed: true,
      detail: {
        request: fetchRequest,
      },
    };
    this.dispatchEvent(new CustomEvent('before-try', event));
    this.dispatchEvent(new CustomEvent('request', event));
    const newFetchOptions = {
      method: fetchRequest.method || fetchOptions.method,
      headers: fetchRequest.headers || fetchOptions.headers,
      credentials: fetchRequest.credentials || fetchOptions.credentials,
      body: fetchRequest.body || fetchOptions.body
    };
    const fetchRequestObject = new Request(fetchRequest.url, newFetchOptions);

    const curl = `curl -X ${this.method.toUpperCase()} "${fetchUrl.toString()}"`;
    const curlHeaders = [...newFetchOptions.headers.entries()].reduce((acc, [key, value]) => `${acc} \\\n  -H "${key}: ${value}"`, '');
    this.curlSyntax = `${curl}${curlHeaders}${curlData}${curlForm}`;

    let fetchResponse;
    try {
      let respBlob;
      let respJson;
      let respText;
      tryBtnEl.disabled = true;
      const fetchStart = new Date();

      this.responseStatus = '';
      this.responseMessage = '';
      this.responseUrl = '';
      this.responseHeaders = '';
      this.responseText = '⌛';

      this.requestUpdate();
      const awaiter = new Promise(resolve => setTimeout(resolve, 200));
      fetchResponse = await fetch(fetchRequestObject);
      this.responseElapsedMs = new Date() - fetchStart;
      await awaiter;

      tryBtnEl.disabled = false;
      this.responseStatus = fetchResponse.ok ? 'success' : 'error';
      this.responseMessage = fetchResponse.statusText ? `${fetchResponse.statusText} (${fetchResponse.status})` : fetchResponse.status;
      this.responseUrl = fetchResponse.url;
      this.responseHeaders = '';
      const headers = {};
      fetchResponse.headers.forEach((hdrVal, hdr) => {
        this.responseHeaders = `${this.responseHeaders}${hdr.trim()}: ${hdrVal}\n`;
        headers[hdr.trim()] = hdrVal && hdrVal.trim();
      });
      const contentType = fetchResponse.headers.get('content-type');
      const respEmpty = (await fetchResponse.clone().text()).length === 0;
      if (respEmpty) {
        this.responseText = '';
      } else if (contentType) {
        if (contentType.includes('json')) {
          if ((/charset=[^"']+/).test(contentType)) {
            const encoding = contentType.split('charset=')[1];
            const buffer = await fetchResponse.arrayBuffer();
            try {
              respText = new TextDecoder(encoding).decode(buffer);
            } catch (_) {
              respText = new TextDecoder('utf-8').decode(buffer);
            }
            try {
              this.responseText = JSON.stringify(JSON.parse(respText), null, 8);
            } catch (_) {
              this.responseText = respText;
            }
          } else {
            respJson = await fetchResponse.json();
            this.responseText = JSON.stringify(respJson, null, 8);
          }
        } else if (textFileRegex.test(contentType)) {
          this.responseIsBlob = true;
          this.responseBlobType = 'download';
        } else if (mediaFileRegex.test(contentType)) {
          this.responseIsBlob = true;
          this.responseBlobType = 'view';
        } else {
          respText = await fetchResponse.text();
          if (contentType.includes('xml')) {
            this.responseText = formatXml(respText, { textNodesOnSameLine: true, indentor: ' ' });
          } else {
            this.responseText = respText;
          }
        }
        if (this.responseIsBlob) {
          const contentDisposition = fetchResponse.headers.get('content-disposition');
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const filename = filenameRegex.exec(contentDisposition);
          this.respContentDisposition = filename && filename[1] && filename[1].replace(/['"]/g, '') || `download.${mimeTypeResolver.extension(contentType) || 'file'}`;
          respBlob = await fetchResponse.blob();
          this.responseBlobUrl = URL.createObjectURL(respBlob);
        }
      } else {
        respText = await fetchResponse.text();
        this.responseText = respText;
      }
      const responseEvent = {
        bubbles: true,
        composed: true,
        detail: {
          explorerLocation: this.elementId,
          request: fetchRequest,
          response: {
            headers,
            body: respJson || respText || respBlob || fetchResponse.body,
            status: fetchResponse.status,
          },
        },
      };
      this.dispatchEvent(new CustomEvent('after-try', responseEvent));
      this.dispatchEvent(new CustomEvent('response', responseEvent));
    } catch (error) {
      tryBtnEl.disabled = false;
      this.responseMessage = `${error.message} (Check the browser network tab for more information.)`;
      this.responseStatus = 'error';
      const responseEvent = {
        bubbles: true,
        composed: true,
        detail: {
          explorerLocation: this.elementId,
          error,
          request: fetchRequest,
        },
      };
      document.dispatchEvent(new CustomEvent('after-try', responseEvent));
      document.dispatchEvent(new CustomEvent('response', responseEvent));
    }
  }

  onAddRemoveFileInput(e, pname, ptype) {
    if (e.target.tagName.toLowerCase() !== 'button') {
      return;
    }

    if (e.target.classList.contains('file-input-remove-btn')) {
      // Remove File Input Set
      const el = e.target.closest('.input-set');
      el.remove();
      return;
    }
    const el = e.target.closest('.file-input-container');

    // Add File Input Set

    // Container
    const newInputContainerEl = document.createElement('div');
    newInputContainerEl.setAttribute('class', 'input-set row');

    // File Input
    const newInputEl = document.createElement('input');
    newInputEl.type = 'file';
    newInputEl.setAttribute('class', 'file-input');
    newInputEl.setAttribute('data-pname', pname);
    newInputEl.setAttribute('data-ptype', ptype.includes('form-urlencode') ? 'form-urlencode' : 'form-data');
    newInputEl.setAttribute('data-array', 'false');
    newInputEl.setAttribute('data-file-array', 'true');

    // Remover Button
    const newRemoveBtnEl = document.createElement('button');
    newRemoveBtnEl.setAttribute('class', 'file-input-remove-btn');
    newRemoveBtnEl.innerHTML = '&#x2715;';

    newInputContainerEl.appendChild(newInputEl);
    newInputContainerEl.appendChild(newRemoveBtnEl);
    el.insertBefore(newInputContainerEl, e.target);
    // el.appendChild(newInputContainerEl);
  }

  downloadResponseBlob() {
    if (this.responseBlobUrl) {
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = this.responseBlobUrl;
      a.download = this.respContentDisposition;
      a.click();
      a.remove();
    }
  }

  viewResponseBlob() {
    if (this.responseBlobUrl) {
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = this.responseBlobUrl;
      a.target = '_blank';
      a.click();
      a.remove();
    }
  }

  clearResponseData() {
    this.responseUrl = '';
    this.responseHeaders = '';
    this.responseText = '';
    this.responseStatus = '';
    this.responseMessage = '';
    this.responseElapsedMs = 0;
    this.responseIsBlob = false;
    this.responseBlobType = '';
    this.respContentDisposition = '';
    if (this.responseBlobUrl) {
      URL.revokeObjectURL(this.responseBlobUrl);
      this.responseBlobUrl = '';
    }
  }

  requestParamFunction(event) {
    if (event.key === 'Enter') {
      this.onTryClick();
      event.preventDefault();
    }
  }

  disconnectedCallback() {
    // Cleanup ObjectURL forthe blob data if this component created one
    if (this.responseBlobUrl) {
      URL.revokeObjectURL(this.responseBlobUrl);
      this.responseBlobUrl = '';
    }
    super.disconnectedCallback();
  }
}

// Register the element with the browser
if (!customElements.get('openapi-explorer')) {
  customElements.define('api-request', ApiRequest);
}
