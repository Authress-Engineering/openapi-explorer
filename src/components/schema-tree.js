import { LitElement, html, css } from 'lit-element';
import marked from 'marked';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import FontStyles from '@/styles/font-styles';
import SchemaStyles from '@/styles/schema-styles';
import BorderStyles from '@/styles/border-styles';
import CustomStyles from '@/styles/custom-styles';

export default class SchemaTree extends LitElement {
  static get properties() {
    return {
      data: { type: Object },
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaDescriptionExpanded: { type: String, attribute: 'schema-description-expanded' },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.schemaExpandLevel || this.schemaExpandLevel < 1) { this.schemaExpandLevel = 99999; }
    if (!this.schemaDescriptionExpanded || !'true false'.includes(this.schemaDescriptionExpanded)) { this.schemaDescriptionExpanded = 'false'; }
  }

  static get styles() {
    return [
      FontStyles,
      SchemaStyles,
      BorderStyles,
      css`
      .tree {
        font-size:var(--font-size-small);
        text-align: left;
        line-height:calc(var(--font-size-small) + 6px);
      }
      .tree .tr:hover{
        background-color:var(--hover-color);
      }
      .collapsed-descr .tr {
        max-height:calc(var(--font-size-small) + 8px);
      }
      .collapsed-descr .m-markdown-small p {
        line-height:calc(var(--font-size-small) + 6px);
      }

      .tree .key {
        max-width: 300px;
      }
      .key.deprecated .key-label {
        text-decoration: line-through; 
      }

      .open-bracket{
        display:inline-block;
        padding: 0 20px 0 0;
        cursor:pointer;
        border: 1px solid transparent;
        border-radius:3px;
      }
      .open-bracket:hover {
        color:var(--primary-color);
        background-color:var(--hover-color);
        border: 1px solid var(--border-color);
      }
      .close-bracket{
        display:inline-block;
        font-family: var(--font-mono);
      }
      .tr.collapsed + .inside-bracket,
      .tr.collapsed + .inside-bracket + .close-bracket{
        display:none;
      }
      .inside-bracket.object,
      .inside-bracket.array {
        border-left: 1px dotted var(--border-color);
      }
      .inside-bracket.xxx-of {
        padding:5px 0px;
        border-style: dotted;
        border-width: 0 0 1px 0;
        border-color:var(--primary-color);
      }`,
      CustomStyles,
    ];
  }

  /* eslint-disable indent */
  render() {
    return html`
      <div class="tree ${this.schemaDescriptionExpanded === 'true' ? 'expanded-descr' : 'collapsed-descr'}">
        <div class="toolbar">
          <div class="toolbar-item schema-root-type ${this.data?.['::type'] || ''} "> ${this.data?.['::type'] || ''} </div>
          <div style="flex:1"></div>
          <div class='toolbar-item' @click='${() => { this.schemaDescriptionExpanded = (this.schemaDescriptionExpanded === 'true' ? 'false' : 'true'); }}'> 
            ${this.schemaDescriptionExpanded === 'true' ? 'Single line description' : 'Multiline description'}
          </div>
        </div>
        <span class='m-markdown'> ${this.data ? unsafeHTML(marked(this.data['::description'] || '')) : ''}</span>
        ${this.data
          ? html`
            ${this.generateTree(
              this.data['::type'] === 'array' ? this.data['::props'] : this.data,
              this.data['::type'],
            )}`
          : html`<span class='mono-font' style='color:var(--red)'> Schema not found </span>`
        }
      </div>  
    `;
  }

  generateTree(data, dataType = 'object', key = '', description = '', level = 0) {
    if (!data) {
      return html`<div class="null" style="display:inline;">null</div>`;
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

    const leftPadding = 12;
    const minFieldColWidth = 300 - (level * leftPadding);
    let openBracket = '';
    let closeBracket = '';
    if (data['::type'] === 'object') {
      if (dataType === 'array') {
        if (level < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket array-of-object" @click="${this.toggleObjectExpand}">[{</span>`;
        } else {
          openBracket = html`<span class="open-bracket array-of-object" @click="${this.toggleObjectExpand}">[{...}]</span>`;
        }
        closeBracket = '}]';
      } else {
        if (level < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket object" @click="${this.toggleObjectExpand}">{</span>`;
        } else {
          openBracket = html`<span class="open-bracket object" @click="${this.toggleObjectExpand}">{...}</span>`;
        }
        closeBracket = '}';
      }
    } else if (data['::type'] === 'array') {
      if (dataType === 'array') {
        if (level < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket array-of-array" @click="${this.toggleObjectExpand}">[[</span>`;
        } else {
          openBracket = html`<span class="open-bracket array-of-array" @click="${this.toggleObjectExpand}">[[...]]</span>`;
        }
        closeBracket = ']]';
      } else {
        if (level < this.schemaExpandLevel) {
          openBracket = html`<span class="open-bracket array" @click="${this.toggleObjectExpand}">[</span>`;
        } else {
          openBracket = html`<span class="open-bracket array" @click="${this.toggleObjectExpand}">[...]</span>`;
        }
        closeBracket = ']';
      }
    }
    if (typeof data === 'object') {
      return html`
        <div class="tr ${level < this.schemaExpandLevel ? 'expanded' : 'collapsed'} ${data['::type'] || 'no-type-info'}">
          <div class="td key ${data['::deprecated'] ? 'deprecated' : ''}" style='min-width:${minFieldColWidth}px'>
            ${data['::type'] === 'xxx-of-option' || data['::type'] === 'xxx-of-array' || key.startsWith('::OPTION')
              ? html`<span class='key-label xxx-of-key'>${keyLabel}</span><span class="xxx-of-descr">${keyDescr}</span>`
              : keyLabel.endsWith('*')
                ? html`<span class="key-label">${keyLabel.substring(0, keyLabel.length - 1)}</span><span style='color:var(--red);'>*</span>`
                : keyLabel === '::props' || keyLabel === '::ARRAY~OF'
                  ? ''
                  : html`<span class="key-label">${keyLabel}<span>`
            }
            ${level > 0
              && !(
                key.startsWith('::props')
                || key.startsWith('::ONE~')
                || key.startsWith('::ANY~')
                || key.startsWith('::OPTION~')
                || key.startsWith('::ARRAY~OF')
              ) ? ':' : ''
            } 
            ${data['::type'] === 'xxx-of' && dataType === 'array' ? html`<span style="color:var(--primary-color)">ARRAY</span>` : ''} 
            ${openBracket}
          </div>
          <div class='td key-descr m-markdown-small'>${unsafeHTML(marked(description || ''))}</div>
        </div>
        <div class='inside-bracket ${data['::type'] || 'no-type-info'}' style='padding-left:${data['::type'] === 'xxx-of-option' || data['::type'] === 'xxx-of-array' ? 0 : leftPadding}px;'>
          ${Array.isArray(data) && data[0]
            ? html`${this.generateTree(data[0], 'xxx-of-option', '::ARRAY~OF', '', (level))}`
            : html`
              ${Object.keys(data).map((dataKey) => html`
                ${['::description', '::type', '::props', '::deprecated'].includes(dataKey)
                  ? data[dataKey]['::type'] === 'array' || data[dataKey]['::type'] === 'object'
                    ? html`${this.generateTree(
                      data[dataKey]['::type'] === 'array' ? data[dataKey]['::props'] : data[dataKey],
                        data[dataKey]['::type'],
                        dataKey,
                        data[dataKey]['::description'],
                        (level + 1),
                      )}`
                    : ''
                  : html`${this.generateTree(
                    data[dataKey]['::type'] === 'array' ? data[dataKey]['::props'] : data[dataKey],
                    data[dataKey]['::type'],
                    dataKey,
                    data[dataKey]['::description'],
                    (level + 1),
                  )}`
                }
              `)}
            `
          }
        </div>
        ${data['::type'] && data['::type'].includes('xxx-of')
          ? ''
          : html`<div class='close-bracket'> ${closeBracket} </div>`
        }
      `;
    }

    // For Primitive Data types
    const itemParts = data.split('~|~');
    const dataTypeCss = itemParts[0].replace('{', '').substring(0, 4).toLowerCase();
    return html`
      <div class = "tr primitive">
        <div class="td key ${itemParts[8]}" style='min-width:${minFieldColWidth}px' >
          ${keyLabel.endsWith('*')
            ? html`<span class="key-label">${keyLabel.substring(0, keyLabel.length - 1)}</span><span style='color:var(--red);'>*</span>:`
            : key.startsWith('::OPTION')
              ? html`<span class='key-label xxx-of-key'>${keyLabel}</span>`
              : html`<span class="key-label">${keyLabel}</span>:`
          }
          <span class='${dataTypeCss}'> 
            ${dataType === 'array' ? `[${itemParts[0]}]` : `${itemParts[0]}`}
            ${itemParts[1]}
          </span>
        </div>
        <div class='td key-descr'>
          ${dataType === 'array' ? description : ''}
          ${itemParts[2]
            ? html`<div style='color: var(--fg2)'>${itemParts[2]}</div>`
            : ''
          }
          ${itemParts[3]
            ? html`<div style='color: var(--fg2)'><span class='bold-text'>Default:</span> ${itemParts[3]}</div>`
            : ''
          }
          ${itemParts[4]
            ? html`<div style='color: var(--fg2)'><span class='bold-text'>Allowed:</span> &nbsp; ${itemParts[4]}</div>`
            : ''
          }
          ${itemParts[5]
            ? html`<div style='color: var(--fg2)'><span class='bold-text'>Pattern:</span> ${itemParts[5]}</div>`
            : ''
          }
          ${itemParts[6]
            ? html`<span class="m-markdown-small">${unsafeHTML(marked(itemParts[6]))}</span>`
            : ''
          }
        </div>
      </div>
    `;
  }
  /* eslint-enable indent */

  toggleObjectExpand(e) {
    const rowEl = e.target.closest('.tr');
    if (rowEl.classList.contains('expanded')) {
      rowEl.classList.replace('expanded', 'collapsed');
      e.target.innerHTML = e.target.classList.contains('array-of-object')
        ? '[{...}]'
        : e.target.classList.contains('array-of-array')
          ? '[[...]]'
          : e.target.classList.contains('array')
            ? '[...]'
            : '{...}';
    } else {
      rowEl.classList.replace('collapsed', 'expanded');
      e.target.innerHTML = e.target.classList.contains('array-of-object')
        ? '[{'
        : e.target.classList.contains('array-of-array')
          ? '[['
          : e.target.classList.contains('object')
            ? '{'
            : '[';
    }
  }
}
customElements.define('schema-tree', SchemaTree);
