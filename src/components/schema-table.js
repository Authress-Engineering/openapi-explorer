import { LitElement, html } from 'lit-element';
import marked from 'marked';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import FontStyles from '@/styles/font-styles';
import SchemaStyles from '@/styles/schema-styles';

export default class SchemaTable extends LitElement {
  static get properties() {
    return {
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaDescriptionExpanded: { type: String, attribute: 'schema-description-expanded' },
      data: { type: Object },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.schemaExpandLevel || this.schemaExpandLevel < 1) { this.schemaExpandLevel = 99999; }
    if (!this.schemaDescriptionExpanded || !'true false'.includes(this.schemaDescriptionExpanded)) { this.schemaDescriptionExpanded = 'false'; }
  }

  /* eslint-disable indent */
  render() {
    return html`
      ${FontStyles}
      ${SchemaStyles}
      <style>
      .table {
        font-size:12px;
        text-align: left;
        line-height:18px;
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
      .table .key-type {
        white-space: normal;
        width: 70px;
      }

      .collapsed-descr .tr {
        max-height:26px;
      }
      .collapsed-descr .m-markdown-small p {
        line-height:26px;
      }

      .obj-toggle {
        display: inline-block;
        margin-left: -16px;
        color:var(--primary-color);
        cursor:pointer;
        font-size:16px;
        font-family: var(--font-mono);
      }
      .tr.expanded + .object-body{
        display:block;
      }
      .tr.collapsed + .object-body{
        display:none;
      }

      </style>
      <div class="table ${this.schemaDescriptionExpanded === 'true' ? 'expanded-descr' : 'collapsed-descr'}">
        <div class='toolbar'> 
          <div style="flex:1"></div>
          <div class='toolbar-item' @click='${() => { this.schemaDescriptionExpanded = (this.schemaDescriptionExpanded === 'true' ? 'false' : 'true'); }}'> 
            ${this.schemaDescriptionExpanded === 'true' ? 'Collapse Details' : 'Expand Details'}
          </div>
        </div>

        <div style='padding: 5px 0; color:var(--fg3)'> 
          <span class='bold-text upper'> ${this.data['::type']}</span> 
          <span>${unsafeHTML(marked(this.data['::description'] || ''))}</span>
        </div>
        <div style = "border:1px solid var(--light-border-color)">
          <div style='display:flex; height:18px; background-color: var(--bg2); line-height:18px; padding:8px 2px; border-bottom:1px solid var(--light-border-color);'>
            <div class='td key' style='font-family:var(--font-regular); font-weight:bold; color:var(--fg)'> Field</div>
            <div class='td key-type' style='font-family:var(--font-regular); font-weight:bold; color:var(--fg)'> Type </div>
            <div class='td key-descr' style='font-family:var(--font-regular); font-weight:bold; color:var(--fg)'>Description</div>
          </div>  
          ${this.generateTree(
            this.data['::type'] === 'array' ? this.data['::props'] : this.data,
            this.data['::type'],
          )}
        </div>  
      </div>  
    `;
  }

  generateTree(data, prevDataType = 'object', prevKey = '', prevDescr = '', level = 0) {
    const leftPadding = 16 * level;
    if (!data) {
      return html`<div class="null" style="display:inline;">null</div>`;
    }
    if (Object.keys(data).length === 0) {
      return html`<span class="td key object" style='padding-left:${leftPadding}px'>${prevKey}</span>`;
    }
    let newPrevKey = '';
    if (prevKey.startsWith('::ONE~OF') || prevKey.startsWith('::ANY~OF')) {
      newPrevKey = prevKey.replace('::', '').replace('~', ' ');
    } else if (prevKey.startsWith('::OPTION')) {
      newPrevKey = prevKey.replace('::OPTION~', '');
    } else {
      newPrevKey = prevKey;
    }
    if (typeof data === 'object') {
      return html`
        ${level > 0
          ? html`
            <div class='tr ${level < this.schemaExpandLevel ? 'expanded' : 'collapsed'} ${data['::type']}' data-obj='${newPrevKey}'>
              <div class='td key' style='padding-left:${leftPadding}px'>
                ${newPrevKey
                  ? html`
                    <span 
                      class='obj-toggle ${level < this.schemaExpandLevel ? 'expanded' : 'collapsed'}'
                      data-obj='${newPrevKey}'
                      @click= ${(e) => this.toggleObjectExpand(e, newPrevKey)} 
                    >
                      ${level < this.schemaExpandLevel ? '-' : '+'}
                    </span>`
                  : ''
                }
                ${data['::type'] === 'xxx-of-option' || prevKey.startsWith('::OPTION')
                  ? html`<span class='xxx-of-key'>${newPrevKey}</span>`
                  : newPrevKey.endsWith('*')
                    ? html`${newPrevKey.substring(0, newPrevKey.length - 1)}<span style='color:var(--red);'>*</span>`
                    : `${newPrevKey}`
                }
              </div>
              <div class='td key-type'>${prevDataType.startsWith('xxx-') ? '' : prevDataType}</div>
              <div class='td key-descr'>${unsafeHTML(marked(prevDescr || ''))}   </div>
            </div>`
          : ''
        }
        <div class='object-body'>
          ${Object.keys(data).map((key) => html`
            ${['::description', '::type', '::props'].includes(key)
              ? ''
              : html`${this.generateTree(
                data[key]['::type'] === 'array' ? data[key]['::props'] : data[key],
                data[key]['::type'],
                key,
                data[key]['::description'],
                (level + 1),
              )}`
            }
          `)}
        <div>
      `;
    }

    // For Primitive Data types
    const itemParts = data.split('~|~');
    const dataTypeCss = itemParts[0].replace('{', '').substring(0, 4).toLowerCase();
    return html`
      <div class = "tr primitive">
        <div class='td key' style='padding-left:${leftPadding}px' >
          ${newPrevKey.endsWith('*')
            ? html`${newPrevKey.substring(0, newPrevKey.length - 1)}<span style='color:var(--red);'>*</span>`
            : newPrevKey
          }
        </div>
        <div class='td key-type ${dataTypeCss}'>${prevDataType === 'array' ? `[${itemParts[0]}]` : itemParts[0]} <span style="font-family: var(--font-mono);">${itemParts[1]}</span> </div>
        <div class='td key-descr'>
          ${prevDataType === 'array' ? prevDescr : ''}
          ${itemParts[2]
            ? html`<div style='color: var()'>${itemParts[2]}</div>`
            : ''
          }
          ${itemParts[3]
            ? html`<div style='color: var(--fg3)'><span class='bold-text'>Default:</span> ${itemParts[3]}</div>`
            : ''
          }
          ${itemParts[4]
            ? html`<div style='color: var(--fg3)'><span class='bold-text'>Allowed:</span>(${itemParts[4]})</div>`
            : ''
          }
          ${itemParts[5]
            ? html`<div style='color: var(--fg3)'><span class='bold-text'>Pattern:</span> ${itemParts[5]}</div>`
            : ''
          }
          ${itemParts[6]
            ? html`<span class="m-markdown m-markdown-small">${unsafeHTML(marked(itemParts[6]))}</span>`
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
customElements.define('schema-table', SchemaTable);
