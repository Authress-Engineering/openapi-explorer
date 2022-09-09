import { LitElement, html, css } from 'lit-element';
import { marked } from 'marked';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import FontStyles from '../styles/font-styles.js';
import SchemaStyles from '../styles/schema-styles';

export default class SchemaTable extends LitElement {
  static get properties() {
    return {
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaDescriptionExpanded: { type: Boolean },
      schemaHideReadOnly: { type: String, attribute: 'schema-hide-read-only' },
      schemaHideWriteOnly: { type: String, attribute: 'schema-hide-write-only' },
      data: { type: Object },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.schemaExpandLevel || this.schemaExpandLevel < 1) { this.schemaExpandLevel = 99999; }
    this.schemaDescriptionExpanded = true;
    if (!this.schemaHideReadOnly || !'true false'.includes(this.schemaHideReadOnly)) { this.schemaHideReadOnly = 'true'; }
    if (!this.schemaHideWriteOnly || !'true false'.includes(this.schemaHideWriteOnly)) { this.schemaHideWriteOnly = 'true'; }
  }

  static get styles() {
    return [
      FontStyles,
      SchemaStyles,
      css`
      .table {
        font-size: var(--font-size-small);
        text-align: left;
        line-height: calc(var(--font-size-small) + 6px);
      }
      .table .tr {
        width: calc(100% - 5px);
        padding: 0 0 0 5px;
        border-bottom: 1px dotted var(--light-border-color);
      }
      .table .td {
        padding: 4px 0;
      }
      .table .key {
        width: 240px;
      }
      .key.deprecated .key-label {
        text-decoration: line-through;
      }

      .table .key-type {
        white-space: normal;
        width: 150px;
      }

      .obj-toggle {
        padding: 0 2px;
        border-radius:2px;
        border: 1px solid transparent;
        display: inline-block;
        margin-left: -16px;
        color:var(--primary-color);
        cursor: pointer;
        font-size: calc(var(--font-size-small) + 4px);
        font-family: var(--font-mono);
        background-clip: border-box;
      }
      .obj-toggle:hover {
        border-color: var(--primary-color);
      }
      .tr.expanded + .object-body {
        display:block;
      }
      .tr.collapsed + .object-body {
        display:none;
      }`,
    ];
  }

  /* eslint-disable indent */
  render() {
    return html`
      ${this.data && this.data['::description']
        ? html`<span class='m-markdown' style="padding-bottom: 8px;"> ${unsafeHTML(marked(this.data['::description'] || ''))}</span>`
        : ''
      }
      <div class="table">
        <div style = 'border:1px solid var(--light-border-color)'>
          <div style='display:flex; background-color: var(--bg2); padding:8px 4px; border-bottom:1px solid var(--light-border-color);'>
            <div class='key' style='font-family:var(--font-regular); font-weight:bold; color:var(--fg);'> Field </div>
            <div class='key-type' style='font-family:var(--font-regular); font-weight:bold; color:var(--fg);'> Type </div>
            <div class='key-descr' style='font-family:var(--font-regular); font-weight:bold; color:var(--fg);'> Description </div>
          </div>
          ${this.data ? html`${this.generateTree(this.data['::type'] === 'array' ? this.data['::props'] : this.data, this.data['::type'])}` : ''}  
        </div>
      </div>  
    `;
  }

  generateTree(data, dataType = 'object', key = '', description = '', schemaLevel = 0, indentLevel = 0) {
    const newSchemaLevel = data['::type'] && data['::type'].startsWith('xxx-of') ? schemaLevel : (schemaLevel + 1);
    const newIndentLevel = dataType === 'xxx-of-option' || data['::type'] === 'xxx-of-option' || key.startsWith('::OPTION') ? indentLevel : (indentLevel + 1);
    const leftPadding = 16 * newIndentLevel; // 2 space indentation at each level

    if (!data) {
      return html`<div class="null" style="display:inline;">null</div>`;
    }
    if (Object.keys(data).length === 0) {
      return html`<span class="td key object" style='padding-left:${leftPadding}px'>${key}</span>`;
    }
    let keyLabel = '';
    let keyDescr = '';
    let isOneOfLabel = false;
    if (key.startsWith('::ONE~OF') || key.startsWith('::ANY~OF')) {
      keyLabel = key.replace('::', '').replace('~', ' ');
      isOneOfLabel = true;
    } else if (key.startsWith('::OPTION')) {
      const parts = key.split('~');
      keyLabel = parts[1];
      keyDescr = parts[2];
    } else {
      keyLabel = key;
    }

    let detailObjType = '';
    if (data['::type'] === 'object') {
      if (dataType === 'array') {
        detailObjType = 'array'; // Array of Object
      } else {
        detailObjType = 'object';
      }
    } else if (data['::type'] === 'array') {
      if (dataType === 'array') {
        detailObjType = 'array of array'; // Array of array
      } else {
        detailObjType = 'array';
      }
    }

    if (typeof data === 'object') {
      const flags = data['::flags'] || {};
      if (flags['🆁'] && this.schemaHideReadOnly === 'true') {
        return undefined;
      }
      if (flags['🆆'] && this.schemaHideWriteOnly === 'true') {
        return undefined;
      }
      
      const displayLine = [flags['🆁'] || flags['🆆'], description].filter(v => v).join(' ');
      return html`
        ${newSchemaLevel >= 0 && key
          ? html`
            <div class='tr ${newSchemaLevel <= this.schemaExpandLevel ? 'expanded' : 'collapsed'} ${data['::type']}' data-obj='${keyLabel}'>
              <div class="td key ${data['::deprecated'] ? 'deprecated' : ''}" style='padding-left:${leftPadding}px'>
                ${(keyLabel || keyDescr)
                  ? html`
                    <span 
                      class='obj-toggle ${newSchemaLevel < this.schemaExpandLevel ? 'expanded' : 'collapsed'}'
                      data-obj='${keyLabel}'
                      @click= ${(e) => this.toggleObjectExpand(e, keyLabel)} 
                    >
                      ${schemaLevel < this.schemaExpandLevel ? '-' : '+'}
                    </span>`
                  : ''
                }
                ${data['::type'] === 'xxx-of-option' || data['::type'] === 'xxx-of-array' || key.startsWith('::OPTION')
                  ? html`<span class="xxx-of-key" style="margin-left:-6px">${keyLabel}</span><span class="${isOneOfLabel ? 'xxx-of-key' : 'xxx-of-descr'}">${keyDescr}</span>`
                  : keyLabel.endsWith('*')
                    ? html`<span class="key-label" style="display:inline-block; margin-left:-6px;"> ${keyLabel.substring(0, keyLabel.length - 1)}</span><span style='color:var(--red);'>*</span>`
                    : html`<span class="key-label" style="display:inline-block; margin-left:-6px;">${keyLabel === '::props' ? '' : keyLabel}</span>`
                }
                ${data['::type'] === 'xxx-of' && dataType === 'array' ? html`<span style="color:var(--primary-color)">ARRAY</span>` : ''} 
              </div>
              <div class='td key-type'>${(data['::type'] || '').includes('xxx-of') ? '' : detailObjType}</div>
              <div class='td key-descr m-markdown-small' style='line-height:1.7'>${unsafeHTML(marked(displayLine))}</div>
            </div>`
          : html`
              ${data['::type'] === 'array' && dataType === 'array'
                ? html`<div class='tr'> <div class='td'> ${dataType} </div> </div>`
                : ''
              }
          `
        }
        <div class='object-body'>
        ${Array.isArray(data) && data[0] ? html`${this.generateTree(data[0], 'xxx-of-option', '::ARRAY~OF', '', newSchemaLevel, newIndentLevel)}`
            : html`
              ${Object.keys(data).map((dataKey) =>
                !['::title', '::description', '::type', '::props', '::deprecated', '::array-type', '::dataTypeLabel', '::flags'].includes(dataKey)
                || data[dataKey]['::type'] === 'array' && data[dataKey]['::type'] === 'object'
                ? html`${this.generateTree(data[dataKey]['::type'] === 'array' ? data[dataKey]['::props'] : data[dataKey],
                      data[dataKey]['::type'], dataKey, data[dataKey]['::description'], newSchemaLevel, newIndentLevel)}`
                : ''
              )}`
          }
        <div>
      `;
    }

    // For Primitive Data types
    const { type, format, readOrWriteOnly, constraint, defaultValue, example, allowedValues, pattern, schemaDescription, schemaTitle, deprecated } = JSON.parse(data);
    if (readOrWriteOnly === '🆁' && this.schemaHideReadOnly === 'true') {
      return undefined;
    }
    if (readOrWriteOnly === '🆆' && this.schemaHideWriteOnly === 'true') {
      return undefined;
    }
    const dataTypeCss = type.replace(/┃.*/g, '').replace(/[^a-zA-Z0-9+]/g, '').substring(0, 4).toLowerCase();
    return html`
      <div class = "tr primitive">
        <div class="td key ${deprecated ? 'deprecated' : ''}" style='padding-left:${leftPadding}px' >
          ${keyLabel && keyLabel.endsWith('*')
            ? html`<span class="key-label">${keyLabel.substring(0, keyLabel.length - 1)}</span><span style='color:var(--red);'>*</span>`
            : key.startsWith('::OPTION')
              ? html`<span class='xxx-of-key'>${keyLabel}</span><span class="xxx-of-descr">${keyDescr}</span>`
              : html`${keyLabel ? html`<span class="key-label"> ${keyLabel}</span>` : html`<span class="xxx-of-descr">${schemaTitle}</span>`}`
          }
        </div>
        <div class='td key-type'>
          <span>${dataType === 'array' ? '[' : ''}<span class="${dataTypeCss}">${format || type}</span>${dataType === 'array' ? ']' : ''}</span>
          <span class="${dataTypeCss}" style="font-family: var(--font-mono);" title="${readOrWriteOnly === '🆁' && 'Read only attribute' || readOrWriteOnly === '🆆' && 'Write only attribute' || ''}">
            ${readOrWriteOnly}
          </span>
        </div>
        <div class='td key-descr'>
          ${dataType === 'array' ? html`<span class="m-markdown-small">${unsafeHTML(marked(description))}</span>` : ''}
          <span class="m-markdown-small" style="font-family: var(--font-mono); vertical-align: middle;">
            ${unsafeHTML(marked(`${dataType === 'array' && description || `${schemaTitle ? `**${schemaTitle}:**` : ''} ${schemaDescription}` || ''}`))}
          </span>
          ${this.schemaDescriptionExpanded ? html`
            ${constraint ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px;'><span class='bold-text'>Constraints: </span>${constraint}</div><br>` : ''}
            ${defaultValue ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px'><span class='bold-text'>Default: </span>${defaultValue}</div><br>` : ''}
            ${allowedValues ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px'><span class='bold-text'>Allowed: </span>${allowedValues}</div><br>` : ''}
            ${pattern ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px'><span class='bold-text'>Pattern: </span>${pattern}</div><br>` : ''}
            ${example ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px'><span class='bold-text'>Example: </span>${example}</div><br>` : ''}` : ''}
        </div>
      </div>
    `;
  }
  /* eslint-enable indent */

  toggleObjectExpand(e) {
    const rowEl = e.target.closest('.tr');
    if (rowEl.classList.contains('expanded')) {
      rowEl.classList.add('collapsed');
      rowEl.classList.remove('expanded');
      e.target.innerText = '+';
    } else {
      rowEl.classList.remove('collapsed');
      rowEl.classList.add('expanded');
      e.target.innerText = '-';
    }
  }
}
if (!customElements.get('openapi-explorer')) {
  customElements.define('schema-table', SchemaTable);
}
