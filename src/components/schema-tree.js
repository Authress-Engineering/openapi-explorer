import { LitElement, html, css } from 'lit';
import { marked } from 'marked';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getI18nText } from '../languages/index.js';
import FontStyles from '../styles/font-styles.js';
import SchemaStyles from '../styles/schema-styles.js';
import BorderStyles from '../styles/border-styles.js';
import KeyFrameStyles from '../styles/key-frame-styles.js';

export default class SchemaTree extends LitElement {
  static get properties() {
    return {
      data: { type: Object },
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaDescriptionExpanded: { type: Boolean },
      schemaHideReadOnly: { type: String, attribute: 'schema-hide-read-only' },
      schemaHideWriteOnly: { type: String, attribute: 'schema-hide-write-only' },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.schemaExpandLevel || this.schemaExpandLevel < 1) { this.schemaExpandLevel = 99999; }
    this.schemaDescriptionExpanded = true;
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
      SchemaStyles,
      BorderStyles,
      KeyFrameStyles,
      css`
      .tree {
        min-height: 30px;
        background: var(--bg2);
        padding: 12px;
        font-size:var(--font-size-small);
        text-align: left;
        line-height:calc(var(--font-size-small) + 6px);
      }
      
      .tree .key {
        max-width: 300px;
      }
      .requiredStar::after {
        content: '*';
        color: var(--red);
        font-size: larger;
      }
      .key.deprecated .key-label {
        text-decoration: line-through; 
      }

      .open-bracket {
        display:inline-block;
        padding: 0 20px 0 0;
        cursor: pointer;
        border: 1px solid transparent;
        border-radius:3px;
      }
      .collapsed .open-bracket {
        padding-right: 0;
      }
      .td.key > .open-bracket:first-child {
        margin-left: -2px;
      }
      .open-bracket:hover {
        color:var(--primary-color);
        background-color:var(--hover-color);
        border: 1px solid var(--border-color);
      }
      .close-bracket {
        display:inline-block;
        font-family: var(--font-mono);
      }

      .inside-bracket-wrapper {
        overflow: hidden;
      }
      .tree:not(.interactive) .inside-bracket-wrapper {
        animation-duration: 0s !important;
      }
      .tr:not(.collapsed) + .inside-bracket-wrapper {
        animation: linear 0.2s expand-height;
      }
      .tr.collapsed + .inside-bracket-wrapper {
        animation: linear 0.2s collapse-height;
        max-height: 0;
      }

      .inside-bracket.object,
      .inside-bracket.array {
        border-left: 1px dotted var(--border-color);
      }
      .inside-bracket.xxx-of.option {
        border-left: 1px solid transparent;
      }`,
    ];
  }

  /* eslint-disable indent */
  render() {
    const title = this.data?.['::title'] || this.data?.['::type'] === 'array' && this.data?.['::props']?.['::title'] && `[${this.data?.['::props']?.['::title']}]`;
    const displayLine = [title, this.data?.['::description']].filter(d => d).join(' - ');

    return html`
      <div class="tree ${this.interactive ? 'interactive' : ''}">
        <div class="toolbar">
          ${displayLine ? html`<span class='m-markdown' style="margin-block-start: 0"> ${unsafeHTML(marked(displayLine))}</span>` : html`<div>&nbsp;</div>`}
          <div class="toolbar-item" @click='${() => this.toggleSchemaDescription()}'> 
            ${this.schemaDescriptionExpanded ? getI18nText('schemas.collapse-desc') : getI18nText('schemas.expand-desc')}
          </div>
        </div>
        ${this.data
          ? html`${this.generateTree(this.data['::type'] === 'array' ? this.data['::props'] : this.data, this.data['::type'], this.data['::array-type'] || '')}`
          : html`<span class='mono-font' style='color:var(--red)'> ${getI18nText('schemas.schema-missing')} </span>`
        }
      </div>  
    `;
  }

  toggleSchemaDescription() {
    this.schemaDescriptionExpanded = !this.schemaDescriptionExpanded;
    this.requestUpdate();
  }

  generateTree(data, dataType = 'object', arrayType = '', flags = {}, key = '', title = '', description = '', schemaLevel = 0, indentLevel = 0) {
    if (!data) {
      return html`<div class="null" style="display:inline;">
        <span class="key-label xxx-of-key"> ${key.replace('::OPTION~', '')}</span>
        ${dataType === 'array' && html`<span class='mono-font'> [ ] </span>`
          || dataType === 'object' && html`<span class='mono-font'> { } </span>`
          || html`<span class='mono-font'> ${dataType} </span>`
        }
      </div>`;
    }
    if (Object.keys(data).length === 0) {
      return html`<span class="key object">${key}:{ }</span>`;
    }
    let keyLabel = '';
    let keyDescr = '';
    if (key.startsWith('::ONE~OF') || key.startsWith('::ANY~OF')) {
      keyLabel = key.replace('::', '').replace('~', ' ');
    } else if (key.startsWith('::OPTION')) {
      const parts = key.split('~');
      keyLabel = parts[1];
      keyDescr = parts[2];
    } else {
      keyLabel = key;
    }

    const leftPadding = 16;
    // Min-width used for model keys: `td key `
    const minFieldColWidth = 300 - (indentLevel * leftPadding);
    let openBracket = '';
    let closeBracket = '';
    const newSchemaLevel = data['::type'] === 'xxx-of-option' ? schemaLevel : (schemaLevel + 1);
    const newIndentLevel = indentLevel + 1;
    if (data['::type'] === 'array') {
      if (dataType === 'array') {
        const arrType = arrayType !== 'object' ? arrayType : '';
        if (schemaLevel < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket array-of-array" data-array-type="${arrType}" @click="${this.toggleObjectExpand}">[[ ${arrType} </span>`;
        } else {
          openBracket = html`<span class="open-bracket array-of-array"  data-array-type="${arrType}" @click="${this.toggleObjectExpand}">[[...]]</span>`;
        }
        closeBracket = ']]';
      } else {
        if (schemaLevel < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket array" @click="${this.toggleObjectExpand}">[</span>`;
        } else {
          openBracket = html`<span class="open-bracket array" @click="${this.toggleObjectExpand}">[...]</span>`;
        }
        closeBracket = ']';
      }
    } else if (data['::type'] === 'xxx-of-option') {
      if (dataType === 'array') {
        if (schemaLevel < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket array" @click="${this.toggleObjectExpand}">[</span>`;
        } else {
          openBracket = html`<span class="open-bracket array" @click="${this.toggleObjectExpand}">[...]</span>`;
        }
        closeBracket = ']';
      }
    } else if (data['::type']) {
      if (dataType === 'array') {
        if (schemaLevel < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket array-of-object" @click="${this.toggleObjectExpand}">[{</span>`;
        } else {
          openBracket = html`<span class="open-bracket array-of-object" @click="${this.toggleObjectExpand}">[{...}]</span>`;
        }
        closeBracket = '}]';
      } else {
        if (schemaLevel < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket object" @click="${this.toggleObjectExpand}">{</span>`;
        } else {
          openBracket = html`<span class="open-bracket object" @click="${this.toggleObjectExpand}">{...}</span>`;
        }
        closeBracket = '}';
      }
    }

    if (typeof data === 'object') {
      if (flags['🆁'] && this.schemaHideReadOnly === 'true') {
        return undefined;
      }
      if (flags['🆆'] && this.schemaHideWriteOnly === 'true') {
        return undefined;
      }

      const displayLine = [flags['🆁'] || flags['🆆'], title && `**${title}${description ? ':' : ''}**`, description].filter(v => v).join(' ');
      return html`
        <div class="tr ${schemaLevel < this.schemaExpandLevel || data['::type'] && data['::type'].startsWith('xxx-of') ? '' : 'collapsed'} ${data['::type'] || 'no-type-info'}">
          <div class="td key ${data['::deprecated'] ? 'deprecated' : ''}" style='min-width:${minFieldColWidth}px'>
            ${data['::type'] === 'xxx-of-option' || key.startsWith('::OPTION')
              ? html`<span class='key-label xxx-of-key'>${keyLabel}</span><span class="xxx-of-descr">${keyDescr}</span>`
              : keyLabel === '::props' || keyLabel === '::ARRAY~OF'
                ? ''
                : schemaLevel > 0
                  ? html`<span class="key-label">
                      ${keyLabel.replace(/\*$/, '')}${keyLabel.endsWith('*') ? html`<span class="requiredStar" title="Required"></span>` : ''}:
                    </span>`
                  : ''
            }
            ${openBracket}
          </div>
          <div class="td key-descr">
            <span class="m-markdown-small" style="vertical-align: middle;" title="${flags['🆁'] && 'Read only attribute' || flags['🆆'] && 'Write only attribute' || ''}">
              ${unsafeHTML(marked(displayLine))}
            </span>
            ${this.schemaDescriptionExpanded ? html`
              ${data['::metadata']?.constraints?.length ? html`<div style='display:inline-block; line-break:anywhere; margin-right:8px'><span class='bold-text'>Constraints: </span>${data['::metadata'].constraints.join(', ')}</div><br>` : ''}` : ''}
          </div>
        </div>
        <div class="inside-bracket-wrapper">
          <div class='inside-bracket ${data['::type'] || 'no-type-info'}' style='padding-left:${data['::type'] === 'xxx-of-option' ? 0 : leftPadding}px;'>
            ${Array.isArray(data) && data[0] ? html`${this.generateTree(data[0], 'xxx-of-option', '', data[0]['::flags'] || {}, '::ARRAY~OF', data[0]['::title'], data[0]['::description'], newSchemaLevel, newIndentLevel)}`
              : html`
                ${Object.keys(data).map((dataKey) =>
                  !['::metadata', '::title', '::description', '::type', '::link', '::props', '::deprecated', '::array-type', '::dataTypeLabel', '::flags'].includes(dataKey)
                  || data[dataKey]?.['::type'] && !data[dataKey]['::type'].includes('xxx-of')
                  ? html`${this.generateTree(data[dataKey]['::type'] === 'array' ? data[dataKey]['::props'] : data[dataKey],
                        data[dataKey]['::type'], data[dataKey]['::array-type'] || '', data[dataKey]['::flags'], dataKey, data[dataKey]['::title'], data[dataKey]['::description'], newSchemaLevel, newIndentLevel)}`
                  : ''
                )}`
            }
          </div>
          ${data['::type'] && data['::type'].includes('xxx-of') ? '' : html`<div class='close-bracket'> ${closeBracket} </div>`}
        </div>
      `;
    }

    // For Primitive Data types
    const { type, cssType, format, readOrWriteOnly, constraints, defaultValue, example, allowedValues, pattern, schemaDescription, schemaTitle, deprecated } = JSON.parse(data);
    if (readOrWriteOnly === '🆁' && this.schemaHideReadOnly === 'true') {
      return undefined;
    }
    if (readOrWriteOnly === '🆆' && this.schemaHideWriteOnly === 'true') {
      return undefined;
    }

    const titleString = schemaTitle || title;
    const descriptionString = schemaDescription || description;
    return html`
      <div class="tr">
        <div class="td key ${deprecated ? 'deprecated' : ''}" style='min-width:${minFieldColWidth}px'>
          ${keyLabel.endsWith('*')
            ? html`<span class="key-label requiredStar" title="Required">${keyLabel.substring(0, keyLabel.length - 1)}</span>:`
            : key.startsWith('::OPTION')
              ? html`<span class='key-label xxx-of-key'>${keyLabel}</span><span class="xxx-of-descr">${keyDescr}</span>`
              : schemaLevel > 0
                ? html`<span class="key-label">${keyLabel}:</span>`
                : ''
          }
          <span>${dataType === 'array' ? '[' : ''}<span class="${cssType}">${format || type}</span>${dataType === 'array' ? ']' : ''}</span>

        </div>
        <div class="td key-descr">
          <span class="m-markdown-small" style="vertical-align: middle;" title="${readOrWriteOnly === '🆁' && 'Read only attribute' || readOrWriteOnly === '🆆' && 'Write only attribute' || ''}">
            ${unsafeHTML(marked(`${readOrWriteOnly && `${readOrWriteOnly} ` || ''}${`${(titleString) ? `**${titleString}${descriptionString ? ':' : ''}**` : ''} ${descriptionString}` || ''}`))}
          </span>
          ${this.schemaDescriptionExpanded ? html`
            ${constraints.length ? html`<div style='display:inline-block; line-break:anywhere; margin-right:8px'><span class='bold-text'>Constraints: </span>${constraints.join(', ')}</div><br>` : ''}
            ${defaultValue ? html`<div style='display:inline-block; line-break:anywhere; margin-right:8px'><span class='bold-text'>Default: </span>${defaultValue}</div><br>` : ''}
            ${allowedValues ? html`<div style='display:inline-block; line-break:anywhere; margin-right:8px'><span class='bold-text'>Allowed: </span>${allowedValues.join('┃')}</div><br>` : ''}
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
    if (rowEl.classList.contains('collapsed')) {
      e.target.innerHTML = e.target.classList.contains('array-of-object')
        ? '[{...}]'
        : e.target.classList.contains('array-of-array')
          ? '[[...]]'
          : e.target.classList.contains('array')
            ? '[...]'
            : '{...}';
    } else {
      e.target.innerHTML = e.target.classList.contains('array-of-object')
        ? '[{'
        : e.target.classList.contains('array-of-array')
          ? '[['
          : e.target.classList.contains('object')
            ? '{'
            : '[';
    }
    this.requestUpdate();
  }
}

if (!customElements.get('openapi-explorer')) {
  customElements.define('schema-tree', SchemaTree);
}
