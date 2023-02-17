import { LitElement, html, css } from 'lit';
import { marked } from 'marked';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import FontStyles from '../styles/font-styles.js';
import SchemaStyles from '../styles/schema-styles';

const tablePadding = 16;

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

  static finalizeStyles() {
    return [
      FontStyles,
      SchemaStyles,
      css`
      .no-select {
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -o-user-select: none;
        user-select: none;
      }
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

      .key-type {
        display: flex;
      }
      .key-type > .attributes {
        margin: 0.0625rem 0 0 0.25rem;
      }

      .obj-toggle {
        display: inline-flex;
        margin-left: -0.8rem;
        margin-right: 0.8rem;
        color:var(--primary-color);
        cursor: pointer;
        font-size: calc(var(--font-size-small) + 4px);
        font-family: var(--font-mono);
        background-clip: border-box;
      }
      .tr + .object-body {
        max-height: 5000px;
        transition: max-height 1.2s ease-in-out;
        overflow: hidden;
      }
      .tr.collapsed + .object-body {
        transition: max-height 1.2s ease-in-out -1.0s;
        max-height: 0;
      }
      .obj-toggle {
        transition: transform 0.1s ease;
      }
      .tr.collapsed .obj-toggle {
        transform: rotate(-90deg);
      }
      `,
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
            <div class='key' style='font-family:var(--font-regular); font-weight:bold; color:var(--fg); padding-left:${tablePadding * 2}px'> Field </div>
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
    const leftPadding = tablePadding * newIndentLevel; // 2 space indentation at each level

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
    if ((data['::type'] || '').includes('xxx-of')) {
      detailObjType = '';
    } else if (data['::type'] === 'object') {
      if (dataType === 'array') {
        detailObjType = `[${keyLabel.replace(/(s|Collection|List)[*]?$/i, '')}]`; // Array of Object
      } else {
        detailObjType = 'object'; // Object
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
      
      const displayLine = [description].filter(v => v).join(' ');
      return html`
        ${newSchemaLevel >= 0 && key
          ? html`
            <div class='tr no-select ${newSchemaLevel <= this.schemaExpandLevel ? '' : 'collapsed'} ${data['::type']}' data-obj='${keyLabel}'>
              <div class="td key ${data['::deprecated'] ? 'deprecated' : ''}" style='padding-left:${leftPadding}px; cursor: pointer' @click=${(e) => this.toggleObjectExpand(e, keyLabel)}>
                <div style="display: flex; align-items: center">
                  ${(keyLabel || keyDescr) ? html`<div class='obj-toggle' data-obj='${keyLabel}'>▾</div>` : ''}
                  ${data['::type'] === 'xxx-of-option' || data['::type'] === 'xxx-of-array' || key.startsWith('::OPTION')
                    ? html`<span class="xxx-of-key" style="margin-left:-6px">${keyLabel}</span><span class="${isOneOfLabel ? 'xxx-of-key' : 'xxx-of-descr'}">${keyDescr}</span>`
                    : keyLabel.endsWith('*')
                      ? html`<span class="key-label" style="display:inline-block; margin-left:-6px;"> ${keyLabel.substring(0, keyLabel.length - 1)}</span><span style='color:var(--red);'>*</span>`
                      : html`<span class="key-label" style="display:inline-block; margin-left:-6px;">${keyLabel === '::props' ? '' : keyLabel}</span>`
                  }
                </div>
              </div>
              <div class='td key-type'>
                <div>${(data['::type'] || '').includes('xxx-of') ? '' : detailObjType}</div>
                <div class="attributes" title="${flags['🆁'] && 'Read only attribute' || flags['🆆'] && 'Write only attribute' || ''}">${flags['🆁'] || flags['🆆'] || ''}</div>
              </div>
              <div class='td key-descr m-markdown-small'>${unsafeHTML(marked(displayLine))}</div>
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
    const { type, cssType, format, readOrWriteOnly, constraint, defaultValue, example, allowedValues, pattern, schemaDescription, schemaTitle, deprecated } = JSON.parse(data);
    if (readOrWriteOnly === '🆁' && this.schemaHideReadOnly === 'true') {
      return undefined;
    }
    if (readOrWriteOnly === '🆆' && this.schemaHideWriteOnly === 'true') {
      return undefined;
    }
    return html`
      <div class = "tr">
        <div class="td key ${deprecated ? 'deprecated' : ''}" style='padding-left:${leftPadding}px' >
          ${keyLabel?.endsWith('*')
            ? html`<span class="key-label">${keyLabel.substring(0, keyLabel.length - 1)}</span><span style='color:var(--red);'>*</span>`
            : key.startsWith('::OPTION')
              ? html`<span class='xxx-of-key'>${keyLabel}</span><span class="xxx-of-descr">${keyDescr}</span>`
              : html`${keyLabel ? html`<span class="key-label"> ${keyLabel}</span>` : html`<span class="xxx-of-descr">${schemaTitle}</span>`}`
          }
        </div>
        <div class='td key-type'>
          <div>${dataType === 'array' ? '[' : ''}<span class="${cssType}">${format || type}</span>${dataType === 'array' ? ']' : ''}</div>
          <div class="attributes ${cssType}" style="font-family: var(--font-mono);" title="${readOrWriteOnly === '🆁' && 'Read only attribute' || readOrWriteOnly === '🆆' && 'Write only attribute' || ''}">${readOrWriteOnly}</div>
        </div>
        <div class='td key-descr'>
          ${dataType === 'array' ? html`<span class="m-markdown-small">${unsafeHTML(marked(description))}</span>` : ''}
          <span class="m-markdown-small" style="vertical-align: middle;">
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
    rowEl.classList.toggle('collapsed');
  }
}
if (!customElements.get('openapi-explorer')) {
  customElements.define('schema-table', SchemaTable);
}
