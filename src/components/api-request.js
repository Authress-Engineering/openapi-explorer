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
const truncateString = (str, length) => (str && str.length > length ? `${str.substring(0, length - 1)}…` : str);

export default class ApiRequest extends LitElement {
  createRenderRoot() { return this; }

  constructor() {
    super();
    this.responseMessage = '';
    this.responseStatus = '';
    this.responseHeaders = '';
    this.responseText = '';
    this.responseUrl = '';
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
      fillRequestWithDefault: { type: String, attribute: 'fill-defaults' },
      allowTry: { type: String, attribute: 'enable-console' },
      renderStyle: { type: String, attribute: 'render-style' },
      schemaStyle: { type: String, attribute: 'schema-style' },
      activeSchemaTab: { type: String, attribute: 'active-schema-tab' },
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaDescriptionExpanded: { type: String, attribute: 'schema-description-expanded' },
      allowSchemaDescriptionExpandToggle: { type: String, attribute: 'allow-schema-description-expand-toggle' },
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
        ${this.callback === 'true' ? 'CALLBACK REQUEST' : 'REQUEST'}
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
  inputParametersTemplate(paramType) {
    const filteredParams = this.parameters ? this.parameters.filter((param) => param.in === paramType) : [];
    if (filteredParams.length === 0) {
      return '';
    }
    let title = '';
    if (paramType === 'path') {
      title = 'PATH PARAMETERS';
    } else if (paramType === 'query') {
      title = 'QUERY-STRING PARAMETERS';
    } else if (paramType === 'header') {
      title = 'REQUEST HEADERS';
    } else if (paramType === 'cookie') {
      title = 'COOKIES';
    }

    const tableRows = [];
    for (const param of filteredParams) {
      if (!param.schema) {
        continue;
      }
      const paramSchema = getTypeInfo(param.schema);
      if (!paramSchema) {
        continue;
      }
      const defaultVal = Array.isArray(paramSchema.default) ? paramSchema.default : `${paramSchema.default}`;
      let paramStyle = 'form';
      let paramExplode = true;
      if (paramType === 'query') {
        if (param.style && 'form spaceDelimited pipeDelimited'.includes(param.style)) {
          paramStyle = param.style;
        }
        if (typeof param.explode === 'boolean') {
          paramExplode = param.explode;
        }
      }

      tableRows.push(html`
      <tr> 
        <td style="width:160px; min-width:50px;">
          <div class="param-name ${paramSchema.deprecated ? 'deprecated' : ''}">
            ${param.name}${!paramSchema.deprecated && param.required ? html`<span style='color:var(--red);'>*</span>` : ''}
          </div>
          <div class="param-type">
            ${paramSchema.type === 'array'
              ? `${paramSchema.arrayType}`
              : `${paramSchema.format ? paramSchema.format : paramSchema.type}`
            }${!paramSchema.deprecated && param.required ? html`<span style='opacity: 0;'>*</span>` : ''}
          </div>
        </td>  
        ${this.allowTry === 'true'
          ? html`
            <td style="min-width:200px;">
              ${paramSchema.type === 'array'
                ? html`
                  <tag-input class="request-param" 
                    style = "width:100%;" 
                    data-ptype = "${paramType}"
                    data-pname = "${param.name}"
                    data-default = "${Array.isArray(defaultVal) ? defaultVal.join('~|~') : defaultVal}"
                    data-param-serialize-style = "${paramStyle}"
                    data-param-serialize-explode = "${paramExplode}"
                    data-array = "true"
                    placeholder="${paramSchema.example || (Array.isArray(defaultVal) ? defaultVal[0] : defaultVal) || 'add-multiple &#x21a9;'}"
                    .value = "${Array.isArray(defaultVal) ? defaultVal : defaultVal.split(',')}"
                  >
                  </tag-input>`
                : paramSchema.type === 'object'
                  ? html`
                    <textarea 
                      class = "textarea request-param"
                      part = "textarea textarea-param"
                      data-ptype = "${paramType}-object"
                      data-pname = "${param.name}"
                      data-default = "${defaultVal}"
                      data-param-serialize-style = "${paramStyle}"
                      data-param-serialize-explode = "${paramExplode}"
                      spellcheck = "false"
                      placeholder="${paramSchema.example || defaultVal || ''}"
                      style = "resize:vertical; width:100%; height: ${'read focused'.includes(this.renderStyle) ? '180px' : '120px'};"
                    >${this.fillRequestWithDefault === 'true' ? defaultVal : ''}</textarea>`
                  : html`
                    <input type="${paramSchema.format === 'password' ? 'password' : 'text'}" spellcheck="false" style="width:100%" placeholder="${paramSchema.example || defaultVal || ''}"
                      class="request-param"
                      part="textbox textbox-param"
                      data-ptype="${paramType}"
                      data-pname="${param.name}" 
                      data-default="${Array.isArray(defaultVal) ? defaultVal.join('~|~') : defaultVal}"
                      data-array="false"
                      @keyup="${this.requestParamFunction}"
                      .value="${this.fillRequestWithDefault === 'true' ? defaultVal : ''}"
                    />`
                }
            </td>`
          : ''
        }
        ${this.renderStyle === 'focused'
          ? html`
            <td>
              ${paramSchema.default || paramSchema.constrain || paramSchema.allowedValues || paramSchema.pattern
                ? html`
                  <div class="param-constraint">
                    ${paramSchema.constrain ? html`<span style="font-weight:bold">Constraints: </span>${paramSchema.constrain}<br/>` : ''}
                    ${paramSchema.pattern ? html`<span style="font-weight:bold">Pattern: </span>${truncateString(paramSchema.pattern, 60)}<br/>` : ''}
                    ${paramSchema.allowedValues && paramSchema.allowedValues.split('┃').map((v, i) => html`
                      ${i > 0 ? '|' : html`<span style="font-weight:bold">Allowed: </span>`}
                      ${html`
                        <a part="anchor anchor-param-constraint" class = "${this.allowTry === 'true' ? '' : 'inactive-link'}"
                          data-type="${paramSchema.type === 'array' ? paramSchema.type : 'string'}"
                          data-enum="${v.trim()}"
                          @click="${(e) => {
                            const inputEl = e.target.closest('table').querySelector(`[data-pname="${param.name}"]`);
                            if (inputEl) {
                              if (e.target.dataset.type === 'array') {
                                inputEl.value = [e.target.dataset.enum];
                              } else {
                                inputEl.value = e.target.dataset.enum;
                              }
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
    <div class="table-title top-gap">${title}${paramType === 'path' ? html`<span style='color:var(--red);'>*</span>` : ''}</div>
    <div style="display:block; overflow-x:auto; max-width:100%;">
      <table class="m-table" style="width:100%; word-break:break-word;">
        ${tableRows}
      </table>
    </div>`;
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

    // Variable to store partial HTMLs
    let reqBodyTypeSelectorHtml = '';
    let reqBodyFileInputHtml = '';
    let reqBodyFormHtml = '';
    let reqBodySchemaHtml = '';
    let reqBodyExampleHtml = '';

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
        <select style="min-width:100px; max-width:100%;  margin-bottom:-1px;" @change = '${(e) => this.onMimeTypeChange(e)}'>
          ${requestBodyTypes.map((reqBody) => html`
            <option value = '${reqBody.mimeType}' ?selected = '${reqBody.mimeType === this.selectedRequestBodyType}'>
              ${reqBody.mimeType}
            </option> `)
          }
        </select>
      `;

    // For Loop - Main
    requestBodyTypes.forEach((reqBody) => {
      let reqBodyExamples = [];

      if (this.selectedRequestBodyType.includes('json') || this.selectedRequestBodyType.includes('xml') || this.selectedRequestBodyType.includes('text')) {
        // Generate Example
        if (reqBody.mimeType === this.selectedRequestBodyType) {
          reqBodyExamples = generateExample(
            reqBody.examples ? reqBody.examples : '',
            reqBody.example ? reqBody.example : '',
            reqBody.schema,
            reqBody.mimeType,
            false,
            true,
            'text',
          );
          if (!this.selectedRequestBodyExample) {
            this.selectedRequestBodyExample = (reqBodyExamples.length > 0 ? reqBodyExamples[0].exampleId : '');
          }
          reqBodyExampleHtml = html`
            ${reqBodyExampleHtml}
            <div class = 'example-panel border-top pad-top-8'>
              ${reqBodyExamples.length === 1
                ? ''
                : html`
                  <select style="min-width:100px; max-width:100%;  margin-bottom:-1px;" @change='${(e) => this.onSelectExample(e)}'>
                    ${reqBodyExamples.map((v) => html`<option value="${v.exampleId}" ?selected=${v.exampleId === this.selectedRequestBodyExample} > 
                      ${v.exampleSummary.length > 80 ? v.exampleId : v.exampleSummary ? v.exampleSummary : v.exampleId} 
                    </option>`)}
                  </select>
                `
              }
              ${reqBodyExamples
                .filter((v) => v.exampleId === this.selectedRequestBodyExample)
                .map((v) => html`
                <div class="example ${v.exampleId === this.selectedRequestBodyExample ? 'example-selected' : ''}" data-default = '${v.exampleId}'>
                  ${v.exampleSummary && v.exampleSummary.length > 80 ? html`<div style="padding: 4px 0"> ${v.exampleSummary} </div>` : ''}
                  ${v.exampleDescription ? html`<div class="m-markdown-small" style="padding: 4px 0"> ${unsafeHTML(marked(v.exampleDescription || ''))} </div>` : ''}
                  <!-- this textarea is for user to edit the example -->
                  <textarea 
                    class = "textarea request-body-param-user-input"
                    part = "textarea textarea-param"
                    spellcheck = "false"
                    data-ptype = "${reqBody.mimeType}" 
                    data-default = "${v.exampleFormat === 'text' ? v.exampleValue : JSON.stringify(v.exampleValue, null, 8)}"
                    data-default-format = "${v.exampleFormat}"
                    style="width:100%; resize:vertical;"
                  >${this.fillRequestWithDefault === 'true'
                      ? (v.exampleFormat === 'text' ? v.exampleValue : JSON.stringify(v.exampleValue, null, 8))
                      : ''
                    }</textarea>
                  <!-- This textarea(hidden) is to store the original example value, this will remain unchanged when users switches from one example to another, its is used to populate the editable textarea -->
                  <textarea 
                    class = "textarea is-hidden request-body-param ${reqBody.mimeType.substring(reqBody.mimeType.indexOf('/') + 1)}" 
                    spellcheck = "false"
                    data-ptype = "${reqBody.mimeType}" 
                    style="width:100%; resize:vertical; display:none"
                  >${(v.exampleFormat === 'text' ? v.exampleValue : JSON.stringify(v.exampleValue, null, 8))}</textarea>
                </div>  
              `)}

            </div>
          `;
        }
      } else if (this.selectedRequestBodyType.includes('form-urlencoded') || this.selectedRequestBodyType.includes('form-data')) {
        if (reqBody.mimeType === this.selectedRequestBodyType) {
          const ex = generateExample(
            reqBody.examples ? reqBody.examples : '',
            reqBody.example ? reqBody.example : '',
            reqBody.schema,
            reqBody.mimeType,
            false,
            true,
            'text',
          );
          if (reqBody.schema) {
            reqBodyFormHtml = this.formDataTemplate(reqBody.schema, reqBody.mimeType, (ex[0] ? ex[0].exampleValue : ''));
          }
        }
      } else if (mediaFileRegex.test(this.selectedRequestBodyType) || textFileRegex.test(this.selectedRequestBodyType)) {
        if (reqBody.mimeType === this.selectedRequestBodyType) {
          reqBodyFileInputHtml = html`
            <div class = "small-font-size bold-text row">
              <input type="file" part="file-input" style="max-width:100%" class="request-body-param-file" data-ptype="${reqBody.mimeType}" spellcheck="false" />
            </div>  
          `;
        }
      }

      // Generate Schema
      if (reqBody.mimeType.includes('json') || reqBody.mimeType.includes('xml') || reqBody.mimeType.includes('text')) {
        const schemaAsObj = schemaInObjectNotation(reqBody.schema, {});
        if (this.schemaStyle === 'table') {
          reqBodySchemaHtml = html`
            ${reqBodySchemaHtml}
            <schema-table
              class = '${reqBody.mimeType.substring(reqBody.mimeType.indexOf('/') + 1)} pad-top-8'
              style = 'display: ${this.selectedRequestBodyType === reqBody.mimeType ? 'block' : 'none'};'
              .data = '${schemaAsObj}'
              schema-expand-level = "${this.schemaExpandLevel}"
              schema-description-expanded = "${this.schemaDescriptionExpanded}"
              allow-schema-description-expand-toggle = "${this.allowSchemaDescriptionExpandToggle}",
              schema-hide-read-only = "${this.schemaHideReadOnly.includes(this.method)}"
              schema-hide-write-only = false
            > </schema-table>
          `;
        } else if (this.schemaStyle === 'tree') {
          reqBodySchemaHtml = html`
            ${reqBodySchemaHtml}
            <schema-tree
              class = '${reqBody.mimeType.substring(reqBody.mimeType.indexOf('/') + 1)} pad-top-8'
              style = 'display: ${this.selectedRequestBodyType === reqBody.mimeType ? 'block' : 'none'};'
              .data = '${schemaAsObj}'
              schema-expand-level = "${this.schemaExpandLevel}"
              schema-description-expanded = "${this.schemaDescriptionExpanded}"
              allow-schema-description-expand-toggle = "${this.allowSchemaDescriptionExpandToggle}",
              schema-hide-read-only = "${this.schemaHideReadOnly.includes(this.method)}"
              schema-hide-write-only = false
            > </schema-tree>
          `;
        }
      }
    });

    return html`
      <div class='request-body-container' data-selected-request-body-type="${this.selectedRequestBodyType}">
        <div class="table-title top-gap row">
          REQUEST BODY ${this.request_body.required ? html`<span class="mono-font" style='color:var(--red)'>*</span>` : ''} 
          <span style = "font-weight:normal; margin-left:5px"> ${this.selectedRequestBodyType}</span>
          <span style="flex:1"></span>
          ${reqBodyTypeSelectorHtml}
        </div>
        ${this.request_body.description ? html`<div class="m-markdown" style="margin-bottom:12px">${unsafeHTML(marked(this.request_body.description))}</div>` : ''}
        
        ${(this.selectedRequestBodyType.includes('json') || this.selectedRequestBodyType.includes('xml') || this.selectedRequestBodyType.includes('text'))
          ? html`
            <div class="tab-panel col" style="border-width:0 0 1px 0;">
              <div class="tab-buttons row" @click="${(e) => { if (e.target.tagName.toLowerCase() === 'button') { this.activeSchemaTab = e.target.dataset.tab; } }}">
                <button class="tab-btn ${this.activeSchemaTab === 'model' ? 'active' : ''}"   data-tab = 'model'  >MODEL</button>
                <button class="tab-btn ${this.activeSchemaTab === 'body' ? 'active' : ''}" data-tab = 'example'>BODY</button>
              </div>
              ${html`<div class="tab-content col" style="display: ${this.activeSchemaTab === 'model' ? 'block' : 'none'}"> ${reqBodySchemaHtml}</div>`}
              ${html`<div class="tab-content col" style="display: ${this.activeSchemaTab === 'model' ? 'none' : 'block'}"> ${reqBodyExampleHtml}</div>`}
            </div>`
          : html`  
            ${reqBodyFileInputHtml}
            ${reqBodyFormHtml}`
        }
      </div>  
    `;
  }

  formDataTemplate(schema, mimeType, exampleValue = '') {
    const formDataTableRows = [];
    if (schema.properties) {
      for (const fieldName in schema.properties) {
        const fieldSchema = schema.properties[fieldName];
        if (fieldSchema.readOnly) {
          continue;
        }

        const fieldType = fieldSchema.type;
        const formdataPartSchema = schemaInObjectNotation(fieldSchema, {});
        const paramSchema = getTypeInfo(fieldSchema);
        const formdataPartExample = generateExample(
          '',
          fieldSchema.example ? fieldSchema.example : '',
          fieldSchema,
          'json',
          false,
          true,
          'text',
        );

        formDataTableRows.push(html`
        <tr> 
          <td style="width:160px; min-width:100px;">
            <div class="param-name ${fieldSchema.deprecated ? 'deprecated' : ''}">
              ${fieldName}${!fieldSchema.deprecated && (schema.required?.includes(fieldName) || fieldSchema.required) ? html`<span style='color:var(--red);'>*</span>` : ''}
            </div>
            <div class="param-type">${paramSchema.type}</div>
          </td>  
          <td 
            style="${fieldType === 'object' ? 'width:100%; padding:0;' : this.allowTry === 'true' ? '' : 'display:none;'} min-width:100px;" 
            colspan="${fieldType === 'object' ? 2 : 1}">
            ${fieldType === 'array'
              ? (fieldSchema.items && fieldSchema.items.format === 'binary')
                ? html`
                <div class="file-input-container col" style='align-items:flex-end;' @click="${(e) => this.onAddRemoveFileInput(e, fieldName, mimeType)}">
                  <div class='input-set row'>
                    <input 
                      type = "file"
                      part = "file-input"
                      style = "width:100%" 
                      data-pname = "${fieldName}" 
                      data-ptype = "${mimeType.includes('form-urlencode') ? 'form-urlencode' : 'form-data'}"
                      data-array = "false" 
                      data-file-array = "true" 
                    />
                    <button class="file-input-remove-btn"> &#x2715; </button>
                  </div>  
                  <button class="m-btn primary file-input-add-btn" part="btn btn-fill" style="margin:2px 25px 0 0; padding:2px 6px;">ADD</button>
                </div>  
                `
                : html`
                  <tag-input
                    style = "width:100%;" 
                    data-ptype = "${mimeType.includes('form-urlencode') ? 'form-urlencode' : 'form-data'}"
                    data-pname = "${fieldName}"
                    data-default = "${paramSchema.default || ''}"
                    data-array = "true"
                    placeholder="${(Array.isArray(paramSchema.example) ? paramSchema.example[0] : paramSchema.example) || 'add-multiple &#x21a9;'}"
                    .value = "${paramSchema.default || ''}"
                  >
                  </tag-input>
                `
              : html`
                ${fieldType === 'object'
                  ? html`
                  <div class="tab-panel row" style="min-height:220px; border-left: 6px solid var(--light-border-color); align-items: stretch;">
                    <div style="width:24px; background-color:var(--light-border-color)">
                      <div class="row" style="flex-direction:row-reverse; width:160px; height:24px; transform:rotate(270deg) translateX(-160px); transform-origin:top left; display:block;" @click="${(e) => {
                        if (e.target.classList.contains('v-tab-btn')) {
                          const tab = e.target.dataset.tab;
                          if (tab) {
                            const tabPanelEl = e.target.closest('.tab-panel');
                            const selectedTabBtnEl = tabPanelEl.querySelector(`.v-tab-btn[data-tab="${tab}"]`);
                            const otherTabBtnEl = [...tabPanelEl.querySelectorAll(`.v-tab-btn:not([data-tab="${tab}"])`)];
                            const selectedTabContentEl = tabPanelEl.querySelector(`.tab-content[data-tab="${tab}"]`);
                            const otherTabContentEl = [...tabPanelEl.querySelectorAll(`.tab-content:not([data-tab="${tab}"])`)];
                            selectedTabBtnEl.classList.add('active');
                            selectedTabContentEl.style.display = 'block';
                            otherTabBtnEl.forEach((el) => { el.classList.remove('active'); });
                            otherTabContentEl.forEach((el) => { el.style.display = 'none'; });
                          }
                        }
                        if (e.target.tagName.toLowerCase() === 'button') { this.activeSchemaTab = e.target.dataset.tab; }
                      }}">
                        <button class="v-tab-btn ${this.activeSchemaTab === 'model' ? 'active' : ''}" data-tab = 'model'>MODEL</button>
                        <button class="v-tab-btn ${this.activeSchemaTab === 'body' ? 'active' : ''}" data-tab = 'body'>REQUEST BODY</button>
                      </div>
                    </div>  
                    ${html`
                      <div class="tab-content col" data-tab = 'model' style="display:${this.activeSchemaTab === 'model' ? 'block' : 'none'}; padding-left:5px; width:100%;"> 
                        <schema-tree
                          .data = '${formdataPartSchema}'
                          schema-expand-level = "${this.schemaExpandLevel}"
                          schema-description-expanded = "${this.schemaDescriptionExpanded}"
                          allow-schema-description-expand-toggle = "${this.allowSchemaDescriptionExpandToggle}",
                        > </schema-tree>
                      </div>`
                    }
                    ${html`
                      <div class="tab-content col" data-tab = 'example' style="display:${this.activeSchemaTab === 'body' ? 'block' : 'none'}; padding-left:5px; width:100%"> 
                        <textarea 
                          class = "textarea" placeholder="${formdataPartExample[0] && formdataPartExample[0].exampleValue || paramSchema.default || ''}"
                          part = "textarea textarea-param"
                          style = "width:100%; border:none; resize:vertical;" 
                          data-array = "false" 
                          data-ptype = "${mimeType.includes('form-urlencode') ? 'form-urlencode' : 'form-data'}"
                          data-pname = "${fieldName}"
                          data-default = "${paramSchema.default || ''}"
                          spellcheck = "false"
                        >${this.fillRequestWithDefault === 'true' ? paramSchema.default : ''}</textarea>
                        <!-- This textarea(hidden) is to store the original example value, in focused mode on navbar change it is used to update the example text -->
                        <textarea data-pname = "hidden-${fieldName}" data-ptype = "${mimeType.includes('form-urlencode') ? 'hidden-form-urlencode' : 'hidden-form-data'}" class="is-hidden" style="display:none">${paramSchema.default}</textarea>
                      </div>`
                    }
                  </div>`
                  : html`
                    ${this.allowTry === 'true'
                      ? html`<input placeholder="${paramSchema.example || paramSchema.default || ''}"
                          .value = "${this.fillRequestWithDefault === 'true' ? (paramSchema.default || '') : ''}"
                          spellcheck = "false"
                          type = "${fieldSchema.format === 'binary' ? 'file' : fieldSchema.format === 'password' ? 'password' : 'text'}"
                          part = "textbox textbox-param"
                          style = "width:100%"
                          data-ptype = "${mimeType.includes('form-urlencode') ? 'form-urlencode' : 'form-data'}"
                          data-pname = "${fieldName}"
                          data-default = "${paramSchema.default || ''}"
                          data-array = "false"
                        />`
                      : ''
                    }
                    `
                  }`
              }
          </td>
          ${fieldType === 'object'
            ? ''
            : html`
              <td>
                ${paramSchema.default || paramSchema.constrain || paramSchema.allowedValues || paramSchema.pattern
                  ? html`
                    <div class="param-constraint">
                      ${paramSchema.pattern ? html`<span style="font-weight:bold">Pattern: </span>${paramSchema.pattern}<br/>` : ''}
                      ${paramSchema.constrain ? html`<span style="font-weight:bold">Constraints: </span>${paramSchema.constrain}<br/>` : ''}
                      ${paramSchema.allowedValues && paramSchema.allowedValues.split('┃').map((v, i) => html`
                        ${i > 0 ? '|' : html`<span style="font-weight:bold">Allowed: </span>`}
                        ${html`
                          <a part="anchor anchor-param-constraint" class = "${this.allowTry === 'true' ? '' : 'inactive-link'}"
                            data-type="${paramSchema.type === 'array' ? paramSchema.type : 'string'}"
                            data-enum="${v.trim()}"
                            @click="${(e) => {
                              const inputEl = e.target.closest('table').querySelector(`[data-pname="${fieldName}"]`);
                              if (inputEl) {
                                if (e.target.dataset.type === 'array') {
                                  inputEl.value = [e.target.dataset.enum];
                                } else {
                                  inputEl.value = e.target.dataset.enum;
                                }
                              }
                            }}"
                          > 
                            ${v} 
                          </a>`
                        }`)
                      }
                    </div>`
                  : ''
                }
              </td>`
          }
        </tr>
        ${fieldType === 'object'
          ? ''
          : html`
            <tr>
              <td style="border:none"> </td>
              <td colspan="2" style="border:none; margin-top:0; padding:0 5px 8px 5px;"> 
                <span class="m-markdown-small">${unsafeHTML(marked(fieldSchema.description || ''))}</span>
                ${paramSchema.example
                  ? html`
                    <span>
                      <span style="font-weight:bold"> Example: </span>
                      ${paramSchema.type === 'array' ? '[ ' : ''}
                      <a part="anchor anchor-param-example" class = "${this.allowTry === 'true' ? '' : 'inactive-link'}"
                        data-default-type="${paramSchema.type === 'array' ? paramSchema.type : 'string'}"
                        data-default = "${Array.isArray(paramSchema.example) && paramSchema.example.join('~|~') || paramSchema.example || ''}"
                        @click="${(e) => {
                          const inputEl = e.target.closest('table').querySelector(`[data-pname="${fieldName}"]`);
                          if (inputEl) {
                            if (e.target.dataset.exampleType === 'array') {
                              inputEl.value = e.target.dataset.example.split('~|~');
                            } else {
                              inputEl.value = e.target.dataset.example;
                            }
                          }
                        }}"
                      >
                        ${paramSchema.type === 'array' ? paramSchema.example.join(', ') : paramSchema.example}
                      </a>
                      ${paramSchema.type === 'array' ? '] ' : ''}
                    </span>`
                  : ''
                }
              </td>
            </tr>
          `
        }`);
      }
      return html`
        <table style="width:100%;" class="m-table">
          ${formDataTableRows}
        </table>
      `;
    }

    return html`
      <textarea
        class = "textarea dynamic-form-param ${mimeType}"
        part = "textarea textarea-param"
        spellcheck = "false"
        data-pname="dynamic-form" 
        data-ptype="${mimeType}"  
        style="width:100%"
      >${exampleValue}</textarea>
      ${schema.description ? html`<span class="m-markdown-small">${unsafeHTML(marked(schema.description))}</span>` : ''}
    `;
  }

  apiResponseTabTemplate() {
    const responseFormat = this.responseHeaders.includes('json') ? 'json' : (this.responseHeaders.includes('html') || this.responseHeaders.includes('xml')) ? 'html' : '';
    return html`
      <div class="row" style="font-size:var(--font-size-small); margin:5px 0">
        <div class="response-message ${this.responseStatus}">Response Status: ${this.responseMessage}</div>
        <div style="flex:1"></div>
        <button class="m-btn" part="btn btn-outline" @click="${this.clearResponseData}">CLEAR RESPONSE</button>
      </div>
      <div class="tab-panel col" style="border-width:0 0 1px 0;">
        <div id="tab_buttons" class="tab-buttons row" @click="${(e) => {
            if (e.target.classList.contains('tab-btn') === false) { return; }
            this.activeResponseTab = e.target.dataset.tab;
        }}">
          <button class="tab-btn ${this.activeResponseTab === 'response' ? 'active' : ''}" data-tab = 'response' > RESPONSE</button>
          <button class="tab-btn ${this.activeResponseTab === 'headers' ? 'active' : ''}"  data-tab = 'headers' > RESPONSE HEADERS</button>
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
            <div class="tab-content col m-markdown" style="flex:1;display:${this.activeResponseTab === 'response' ? 'flex' : 'none'};" >
              <button class="toolbar-btn" @click='${(e) => { copyToClipboard(this.responseText, e); }}' part="btn btn-fill"> Copy </button>
              <pre style="white-space:pre; max-height:400px; overflow:auto">${responseFormat
                ? html`<code>${unsafeHTML(Prism.highlight(this.responseText, Prism.languages[responseFormat], responseFormat))}</code>`
                : `${this.responseText}`
              }
              </pre>
            </div>`
        }
        <div class="tab-content col m-markdown" style="flex:1;display:${this.activeResponseTab === 'headers' ? 'flex' : 'none'};" >
          <button class="toolbar-btn" @click='${(e) => { copyToClipboard(this.responseHeaders, e); }}' part="btn btn-fill"> Copy </button>
          <pre style="white-space:pre"><code>${unsafeHTML(Prism.highlight(this.responseHeaders, Prism.languages.css, 'css'))}</code></pre>
        </div>
        <div class="tab-content col m-markdown" style="flex:1;display:${this.activeResponseTab === 'curl' ? 'flex' : 'none'};">
          <button class="toolbar-btn" @click='${(e) => { copyToClipboard(this.curlSyntax.replace(/\\$/, ''), e); }}' part="btn btn-fill"> Copy </button>
          <pre style="white-space:pre"><code>${unsafeHTML(Prism.highlight(this.curlSyntax.trim().replace(/\\$/, ''), Prism.languages.shell, 'shell'))}</code></pre>
        </div>
      </div>`;
  }

  apiCallTemplate() {
    return html`
    <div style="display:flex; align-items:flex-end; margin:16px 0; font-size:var(--font-size-small);">
      ${
        this.parameters.length > 0 || this.request_body
          ? html`
            <button class="m-btn thin-border" part="btn btn-outline" style="margin-right:5px;" @click="${this.onFillRequestData}" title="Fills with example data (if provided)">
              RESET
            </button>
            <button class="m-btn thin-border" part="btn btn-outline" style="margin-right:5px;" @click="${this.onClearRequestData}">
              CLEAR
            </button>`
          : ''
      }
      <button class="m-btn primary btn-execute thin-border" part="btn btn-fill btn-try" @click="${this.onTryClick}">EXECUTE</button>
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

  onFillRequestData(e) {
    const requestPanelEl = e.target.closest('.request-panel');
    const requestPanelInputEls = [...requestPanelEl.querySelectorAll('input, tag-input, textarea:not(.is-hidden)')];
    requestPanelInputEls.forEach((el) => {
      if (el.dataset.default) {
        if (el.tagName.toUpperCase() === 'TAG-INPUT') {
          el.value = el.dataset.default.split('~|~');
        } else {
          el.value = el.dataset.default;
        }
      }
    });
  }

  onClearRequestData(e) {
    const requestPanelEl = e.target.closest('.request-panel');
    const requestPanelInputEls = [...requestPanelEl.querySelectorAll('input, tag-input, textarea:not(.is-hidden)')];
    requestPanelInputEls.forEach((el) => { el.value = ''; });
  }

  async onTryClick() {
    const tryBtnEl = this.querySelectorAll('.btn-execute')[0];
    let fetchUrl;
    let curlUrl;
    let curl = '';
    let curlHeaders = '';
    let curlData = '';
    let curlForm = '';
    const closestRespContainer = this.closest('.expanded-req-resp-container, .req-resp-container');
    const respEl = closestRespContainer && closestRespContainer.getElementsByTagName('api-response')[0];
    const acceptHeader = respEl && respEl.selectedMimeType;
    const requestPanelEl = this.closest('.request-panel');
    const pathParamEls = [...requestPanelEl.querySelectorAll("[data-ptype='path']")];
    const queryParamEls = [...requestPanelEl.querySelectorAll("[data-ptype='query']")];
    const queryParamObjTypeEls = [...requestPanelEl.querySelectorAll("[data-ptype='query-object']")];
    const headerParamEls = [...requestPanelEl.querySelectorAll("[data-ptype='header']")];
    const requestBodyContainerEl = requestPanelEl.querySelector('.request-body-container');

    fetchUrl = this.path;
    const fetchOptions = {
      method: this.method.toUpperCase(),
      headers: new Headers()
    };
    // Generate URL using Path Params
    pathParamEls.map((el) => {
      fetchUrl = fetchUrl.replace(`{${el.dataset.pname}}`, encodeURIComponent(el.value));
    });

    // Query Params
    if (queryParamEls.length > 0) {
      const urlQueryParam = new URLSearchParams();
      queryParamEls.forEach((el) => {
        if (el.dataset.array === 'false') {
          if (el.value !== '') {
            urlQueryParam.append(el.dataset.pname, el.value);
          }
        } else {
          const paramSerializeStyle = el.dataset.paramSerializeStyle;
          const paramSerializeExplode = el.dataset.paramSerializeExplode;
          let vals = ((el.value && Array.isArray(el.value)) ? el.value : []);
          vals = Array.isArray(vals) ? vals.filter((v) => v !== '') : [];
          if (vals.length > 0) {
            if (paramSerializeStyle === 'spaceDelimited') {
              urlQueryParam.append(el.dataset.pname, vals.join(' ').replace(/^\s|\s$/g, ''));
            } else if (paramSerializeStyle === 'pipeDelimited') {
              urlQueryParam.append(el.dataset.pname, vals.join('|').replace(/^\||\|$/g, ''));
            } else {
              if (paramSerializeExplode === 'true') { // eslint-disable-line no-lonely-if
                vals.forEach((v) => { urlQueryParam.append(el.dataset.pname, v); });
              } else {
                urlQueryParam.append(el.dataset.pname, vals.join(',').replace(/^,|,$/g, ''));
              }
            }
          }
        }
      });
      fetchUrl = `${fetchUrl}${urlQueryParam.toString() ? '?' : ''}${urlQueryParam.toString()}`;
    }

    // Query Params (Dynamic - create from JSON)
    if (queryParamObjTypeEls.length > 0) {
      const urlDynQueryParam = new URLSearchParams();
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
                  urlDynQueryParam.append(key, queryParamObj[key].join(' '));
                } else if (paramSerializeStyle === 'pipeDelimited') {
                  urlDynQueryParam.append(key, queryParamObj[key].join('|'));
                } else {
                  if (paramSerializeExplode === 'true') { // eslint-disable-line no-lonely-if
                    queryParamObj[key].forEach((v) => {
                      urlDynQueryParam.append(key, v);
                    });
                  } else {
                    urlDynQueryParam.append(key, queryParamObj[key]);
                  }
                }
              }
            } else {
              urlDynQueryParam.append(key, queryParamObj[key]);
            }
          }
          fetchUrl = `${fetchUrl}${urlDynQueryParam.toString() ? '?' : ''}${urlDynQueryParam.toString()}`;
        } catch (err) {
          console.log('OpenAPI Explorer: unable to parse %s into object', el.value); // eslint-disable-line no-console
        }
      });
    }

    // Add Authentication api keys if provided
    this.api_keys.filter((v) => v.finalKeyValue).forEach((v) => {
      if (v.in === 'query') {
        fetchUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}${v.name}=${encodeURIComponent(v.finalKeyValue)}`;
        return;
      }

      // Otherwise put it in the header
      fetchOptions.headers.append(v.name, v.finalKeyValue);
      curlHeaders += ` -H "${v.name}: ${v.finalKeyValue}" \\\n`;
    });

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
      curlHeaders += ` -H "Accept: ${acceptHeader}" \\\n`;
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
    this.curlSyntax = '';
    this.responseIsBlob = false;

    this.respContentDisposition = '';
    if (this.responseBlobUrl) {
      URL.revokeObjectURL(this.responseBlobUrl);
      this.responseBlobUrl = '';
    }
    this.curlSyntax = `${curl}${curlHeaders}${curlData}${curlForm}`;
    if (this.fetchCredentials) {
      fetchOptions.credentials = this.fetchCredentials;
    }

    const fetchRequest = { url: fetchUrl, options: fetchOptions };
    const event = {
      bubbles: true,
      composed: true,
      detail: {
        request: fetchRequest,
      },
    };
    this.dispatchEvent(new CustomEvent('before-try', event));
    this.dispatchEvent(new CustomEvent('request', event));
    const fetchRequestObject = new Request(fetchUrl, fetchOptions);

    let fetchResponse;
    try {
      let respBlob;
      let respJson;
      let respText;
      tryBtnEl.disabled = true;
      fetchResponse = await fetch(fetchRequestObject);
      tryBtnEl.disabled = false;
      this.responseStatus = fetchResponse.ok ? 'success' : 'error';
      this.responseMessage = fetchResponse.statusText ? `${fetchResponse.statusText}:${fetchResponse.status}` : fetchResponse.status;
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
            } catch {
              respText = new TextDecoder('utf-8').decode(buffer);
            }
            try {
              this.responseText = JSON.stringify(JSON.parse(respText), null, 8);
            } catch {
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
            this.responseText = prettyXml(respText);
          }
          this.responseText = respText;
        }
        if (this.responseIsBlob) {
          const contentDisposition = fetchResponse.headers.get('content-disposition');
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const filename = filenameRegex.exec(contentDisposition);
          this.respContentDisposition = filename && filename[1] && filename[1].replace(/['"]/g, '') || `download.${mime.extension(contentType) || 'file'}`;
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
      this.responseMessage = `${error.message} (CORS or Network Issue)`;
      this.responseUrl = '';
      this.responseHeaders = '';
      const responseEvent = {
        bubbles: true,
        composed: true,
        detail: {
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
    newInputEl.style = 'width:200px; margin-top:2px;';
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
