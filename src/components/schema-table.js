import { LitElement, html, css } from 'lit';
import { marked } from 'marked';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import FontStyles from '../styles/font-styles.js';
import SchemaStyles from '../styles/schema-styles.js';
import KeyFrameStyles from '../styles/key-frame-styles.js';

const tablePadding = 16;
const firstColumnInitialPadding = tablePadding * 2;

export default class SchemaTable extends LitElement {
  static get properties() {
    return {
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaHideReadOnly: { type: String, attribute: 'schema-hide-read-only' },
      schemaHideWriteOnly: { type: String, attribute: 'schema-hide-write-only' },
      data: { type: Object },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.schemaExpandLevel || this.schemaExpandLevel < 1) { this.schemaExpandLevel = 99999; }
    if (!this.schemaHideReadOnly || !'true false'.includes(this.schemaHideReadOnly)) { this.schemaHideReadOnly = 'true'; }
    if (!this.schemaHideWriteOnly || !'true false'.includes(this.schemaHideWriteOnly)) { this.schemaHideWriteOnly = 'true'; }
  }

  /**
   * @param {Map<string, object>} changedProperties Changed Properties
   */
  update(changedProperties) {
    if (changedProperties.has('data')) {
      this.interactive = false;
    }
    super.update(changedProperties);
  }

  updated() {
    this.interactive = true; // Note: interactive is not a reactive property
  }

  static finalizeStyles() {
    return [
      FontStyles,
      KeyFrameStyles,
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

      .requiredStar::after {
        content: '*';
        color: var(--red);
        font-size: larger;
      }
      .key.deprecated .key-label {
        text-decoration: line-through;
      }

      .table .key-type {
        white-space: normal;
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
        overflow: hidden;
      } 
      .table:not(.interactive) .object-body {
        animation-duration: 0s !important;
      }
      .tr:not(.collapsed) + .object-body {
        animation: linear 0.2s expand-height;
      }
      .tr.collapsed + .object-body {
        animation: linear 0.2s collapse-height;
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
    const title = this.data?.['::title'] || this.data?.['::type'] === 'array' && this.data?.['::props']?.['::title'] && `[${this.data?.['::props']?.['::title']}]`;
    const displayLine = [title, this.data?.['::description']].filter(d => d).join(' - ');
    
    const { result, keyLabelMaxCharacterLength, typeMaxCharacterLength } = this.data ? this.generateTree(this.data['::type'] === 'array' ? this.data['::props'] : this.data, this.data['::type']) : {};
    return html`
      ${displayLine
        ? html`<span class='m-markdown' style="padding-bottom: 8px;"> ${unsafeHTML(marked(displayLine))}</span>`
        : ''
      }
      <style>
        .table .key {
          width: ${Math.max(240, (keyLabelMaxCharacterLength || 0) * 6) + 8}px;
          max-width: Min(400px, 75%);
        }
        .table .key-type {
          width: ${Math.max(150, (typeMaxCharacterLength || 0) * 6) + 8}px;
          max-width: 25%;
        }
      </style>
      <div class="table ${this.interactive ? 'interactive' : ''}">
        <div style = 'border:1px solid var(--light-border-color)'>
          <div style='display:flex; background-color: var(--bg2); padding:8px 4px; border-bottom:1px solid var(--light-border-color);'>
            <div class='key' part="schema-key schema-table-header" style='font-family:var(--font-regular); font-weight:bold; color:var(--fg); padding-left:${firstColumnInitialPadding}px'> Field </div>
            <div class='key-type' part="schema-type schema-table-header" style='font-family:var(--font-regular); font-weight:bold; color:var(--fg);'> Type </div>
            <div class='key-descr' part="schema-description schema-table-header" style='font-family:var(--font-regular); font-weight:bold; color:var(--fg);'> Description </div>
          </div>
          ${result || ''}
        </div>
      </div>  
    `;
  }

  scrollToSchemaComponentByName(componentName) {
    this.dispatchEvent(new CustomEvent('scrollToSchemaComponentByName', { bubbles: true, composed: true, detail: componentName }));
  }

  generateTree(data, dataType = 'object', key = '', title = '', description = '', schemaLevel = 0, indentLevel = 0) {
    const newSchemaLevel = data['::type'] && data['::type'].startsWith('xxx-of') ? schemaLevel : (schemaLevel + 1);
    const newIndentLevel = dataType === 'xxx-of-option' || data['::type'] === 'xxx-of-option' || key.startsWith('::OPTION') ? indentLevel : (indentLevel + 1);
    // 16px space indentation at each level, start the first one at 32px to align with the field hr key row object
    const leftPadding = Math.max(firstColumnInitialPadding, tablePadding * newIndentLevel);

    if (!data) {
      return { result: html`<div class="null" style="display:inline;">null</div>`, keyLabelMaxCharacterLength: newIndentLevel };
    }
    if (Object.keys(data).length === 0) {
      return { result: html`<span class="td key object" style='padding-left:${leftPadding}px'>${key}</span>`, keyLabelMaxCharacterLength: newIndentLevel };
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
    let displaySchemaLink = false;
    if ((data['::type'] || '').includes('xxx-of')) {
      detailObjType = '';
    } else if (data['::type'] === 'array') {
      if (dataType === 'array') {
        detailObjType = 'array of array'; // Array of array
      } else {
        detailObjType = 'array';
      }
    } else if (data['::type']) {
      displaySchemaLink = data['::link'];
      if (dataType === 'array') {
        detailObjType = data['::link'] || keyLabel.replace(/(s|Collection|List)[*]?$/i, '').replace(/[*]$/, ''); // Array of Object
      } else {
        detailObjType = (data['::link'] || data['::type']).replace(/[*]$/, '');
      }
    }

    if (typeof data === 'object') {
      const flags = data['::flags'] || {};
      if (flags['🆁'] && this.schemaHideReadOnly === 'true') {
        return { result: undefined, keyLabelMaxCharacterLength: newIndentLevel };
      }
      if (flags['🆆'] && this.schemaHideWriteOnly === 'true') {
        return { result: undefined, keyLabelMaxCharacterLength: newIndentLevel };
      }

      let recursiveResult;
      let innerMaxIndentationLevel = newIndentLevel;
      let innerTypeMaxCharacterLength = 0;
      if (Array.isArray(data) && data[0]) {
        ({ result: recursiveResult, keyLabelMaxCharacterLength: innerMaxIndentationLevel, typeMaxCharacterLength: innerTypeMaxCharacterLength }
          = this.generateTree(data[0], 'xxx-of-option', '::ARRAY~OF', data[0]['::title'], data[0]['::description'], newSchemaLevel, newIndentLevel));
      } else {
        recursiveResult = Object.keys(data).filter(dataKey =>
          !['::metadata', '::title', '::description', '::type', '::link', '::props', '::deprecated', '::array-type', '::dataTypeLabel', '::flags'].includes(dataKey)
          || data[dataKey]?.['::type'] && !data[dataKey]['::type'].includes('xxx-of'))
          .map((dataKey) => {
            const { result: innerResult, keyLabelMaxCharacterLength: innerObjectLevelIndentTationLevel, typeMaxCharacterLength: innerObjectLevelTypeMaxCharacterLength }
              = this.generateTree(data[dataKey]['::type'] === 'array' ? data[dataKey]['::props'] : data[dataKey],
                data[dataKey]['::type'], dataKey, data[dataKey]['::title'], data[dataKey]['::description'], newSchemaLevel, newIndentLevel) || {};

            innerMaxIndentationLevel = Math.max(innerMaxIndentationLevel, innerObjectLevelIndentTationLevel);
            innerTypeMaxCharacterLength = Math.max(innerTypeMaxCharacterLength, innerObjectLevelTypeMaxCharacterLength);
            return innerResult;
          });
      }
      
      const displayLine = [title && `**${title}${description ? ':' : ''}**`, description].filter(v => v).join(' ');
      const outerResult = html`
        ${newSchemaLevel >= 0 && key
          ? html`
            <div class='tr ${newSchemaLevel <= this.schemaExpandLevel ? '' : 'collapsed'} ${data['::type']}' data-obj='${keyLabel}'>
              <div class="td no-select key ${data['::deprecated'] ? 'deprecated' : ''}" part="schema-key"
                style='padding-left:${leftPadding}px; cursor: pointer' @click=${(e) => this.toggleObjectExpand(e, keyLabel)}>
                <div style="display: flex; align-items: center">
                  ${(keyLabel || keyDescr) ? html`<div class='obj-toggle' data-obj='${keyLabel}'>▾</div>` : ''}
                  ${data['::type'] === 'xxx-of-option' || data['::type'] === 'xxx-of-array' || key.startsWith('::OPTION')
                    ? html`<span class="xxx-of-key" style="margin-left:-6px">${keyLabel}</span><span class="${isOneOfLabel ? 'xxx-of-key' : 'xxx-of-descr'}">${keyDescr}</span>`
                    : keyLabel.endsWith('*')
                      ? html`<span class="key-label requiredStar" style="display:inline-block; margin-left:-6px;" title="Required"> ${keyLabel.substring(0, keyLabel.length - 1)}</span>`
                      : html`<span class="key-label" style="display:inline-block; margin-left:-6px;">${keyLabel === '::props' ? '' : keyLabel}</span>`
                  }
                </div>
              </div>
              <div class='td key-type' part="schema-type">
                ${displaySchemaLink
                  ? html`<div class="schema-link" style="overflow: hidden; text-overflow: ellipsis" @click='${() => this.scrollToSchemaComponentByName(displaySchemaLink)}'>
                    ${dataType === 'array' ? '[' : ''}<span style="color: var(--primary)">${detailObjType}</span>${dataType === 'array' ? ']' : ''}
                  </div>`
                  : html`<div>${(data['::type'] || '').includes('xxx-of') ? '' : `${dataType === 'array' ? '[' : ''}${detailObjType}${dataType === 'array' ? ']' : ''}`}</div>`
                }
                <div class="attributes" title="${flags['🆁'] && 'Read only attribute' || flags['🆆'] && 'Write only attribute' || ''}">${flags['🆁'] || flags['🆆'] || ''}</div>
              </div>
              <div class='td key-descr' part="schema-description">
                <span class=" m-markdown-small">${unsafeHTML(marked(displayLine))}</span>
                ${data['::metadata']?.constraints?.length
                    ? html`<div style='display:inline-block; line-break:anywhere; margin-right:8px'><span class='bold-text'>Constraints: </span>${data['::metadata'].constraints.join(', ')}</div><br>` : ''}
              </div>
            </div>`
          : html`
              ${data['::type'] === 'array' && dataType === 'array'
                ? html`<div class='tr'> <div class='td'> ${dataType} </div> </div>`
                : ''
              }
          `
        }
        <div class='object-body'>
        ${recursiveResult}
        <div>
      `;

      return {
        result: outerResult,
        keyLabelMaxCharacterLength: Math.max(innerMaxIndentationLevel, (keyLabel || keyDescr).length),
        typeMaxCharacterLength: Math.max(innerTypeMaxCharacterLength, detailObjType.length) };
    }

    // For Primitive Data types
    const { type, cssType, format, readOrWriteOnly, constraints, defaultValue, example, allowedValues, pattern, schemaDescription, schemaTitle, deprecated } = JSON.parse(data);
    if (readOrWriteOnly === '🆁' && this.schemaHideReadOnly === 'true') {
      return { result: undefined, keyLabelMaxCharacterLength: newIndentLevel };
    }
    if (readOrWriteOnly === '🆆' && this.schemaHideWriteOnly === 'true') {
      return { result: undefined, keyLabelMaxCharacterLength: newIndentLevel };
    }
    
    const result = html`
      <div class = "tr">
        <div class="td key ${deprecated ? 'deprecated' : ''}" part="schema-key" style='padding-left:${leftPadding}px'>
          ${keyLabel?.endsWith('*')
            ? html`<span class="key-label requiredStar" title="Required">${keyLabel.substring(0, keyLabel.length - 1)}</span>`
            : key.startsWith('::OPTION')
              ? html`<span class='xxx-of-key'>${keyLabel}</span><span class="xxx-of-descr">${keyDescr}</span>`
              : html`${keyLabel ? html`<span class="key-label"> ${keyLabel}</span>` : html`<span class="xxx-of-descr">${schemaTitle}</span>`}`
          }
        </div>
        <div class='td key-type' part="schema-type">
          <div>${dataType === 'array' ? '[' : ''}<span class="${cssType}">${format || type}</span>${dataType === 'array' ? ']' : ''}</div>
          <div class="attributes ${cssType}" style="font-family: var(--font-mono);" title="${readOrWriteOnly === '🆁' && 'Read only attribute' || readOrWriteOnly === '🆆' && 'Write only attribute' || ''}">${readOrWriteOnly}</div>
        </div>
        <div class='td key-descr' part="schema-description">
          <span class="m-markdown-small" style="vertical-align: middle;">
            ${unsafeHTML(marked(`${`${(schemaTitle || title) ? `**${schemaTitle || title}${schemaDescription || description ? ':' : ''}**` : ''} ${schemaDescription || description}` || ''}`))}
          </span>
          ${constraints.length ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px;'><span class='bold-text'>Constraints: </span>${constraints.join(', ')}</div><br>` : ''}
          ${defaultValue ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px'><span class='bold-text'>Default: </span>${defaultValue}</div><br>` : ''}
          ${allowedValues ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px'><span class='bold-text'>Allowed: </span>${allowedValues.join('┃')}</div><br>` : ''}
          ${pattern ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px'><span class='bold-text'>Pattern: </span>${pattern}</div><br>` : ''}
          ${example ? html`<div style='display:inline-block; line-break: anywhere; margin-right:8px'><span class='bold-text'>Example: </span>${example}</div><br>` : ''}
        </div>
      </div>
    `;
    return { result, keyLabelMaxCharacterLength: keyLabel.length + newIndentLevel, typeMaxCharacterLength: (format || type).length };
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
