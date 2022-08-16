import { LitElement, html, css } from 'lit-element';
import { copyToClipboard, getI18nText } from '../utils/common-utils';
import FontStyles from '../styles/font-styles';
import BorderStyles from '../styles/border-styles';
import InputStyles from '../styles/input-styles';

export default class JsonTree extends LitElement {
  static get properties() {
    return {
      data: { type: Object },
      renderStyle: { type: String, attribute: 'render-style' },
    };
  }

  static get styles() {
    return [
      FontStyles,
      BorderStyles,
      InputStyles,
      css`
      :host{
        display:flex;
      }
      .json-tree {
        background: rgb(51, 51, 51);
        color: white;
        padding: 12px;

        min-height: 30px;
        font-family: var(--font-mono);
        font-size: var(--font-size-small);
        overflow:hidden;
        word-break: break-all;
        flex:1;
        line-height: calc(var(--font-size-small) + 6px);
      }

      .open-bracket{
        display:inline-block;
        padding: 0 20px 0 0;
        cursor: pointer;
        border: 1px solid transparent;
        border-radius:3px;
      }
      .collapsed.open-bracket {
        padding-right: 0;
      }
      .tree > .open-bracket {
        margin-left: -2px;
      }
      .open-bracket:hover{
        color:var(--primary-color);
        background-color:var(--hover-color);
        border: 1px solid var(--border-color);
      }
      .inside-bracket{
        padding-left:16px;
        border-left:1px dotted var(--border-color);
      }
      .open-bracket.collapsed + .inside-bracket,
      .open-bracket.collapsed + .inside-bracket + .close-bracket {
        display:none;
      }
      .close-bracket {
        margin-left: -2px;
      }

      .string{color:var(--green);}
      .number{color:var(--blue);}
      .null{color:var(--red);}
      .boolean{color:var(--orange);}
      .object{color:white}

      .toolbar {
        display: none;
      }

      .tree .toolbar {
        display: flex;
        justify-content: space-between;
        width:100%;
      }

      .tree .item {
        /* match schema-tree.tr */
        border-bottom: 1px dotted transparent;
      }
      .toolbar-item {
        cursor: pointer;
        padding: 5px 0 5px 1rem;
        margin: 0 1rem !important;
        /* TODO: add: The import highlight color variable */
        color: #38b3f9;
        flex-shrink: 0;
      }
      .tree .toolbar .toolbar-item {
        display: none;
      }
      .inside-bracket.xxx-of {
        padding:5px 0px;
        border-style: dotted;
        border-width: 0 0 1px 0;
        border-color:var(--primary-color);
      }
      .schema-root-type.xxx-of {
        display:none;
      }
      .toolbar-item:first-of-type { margin:0 2px 0 0;}
      
      
      @media only screen and (min-width: 576px) {
        .key-descr {
          display: block;
        }
        .tree .toolbar .toolbar-item {
          display: block;
        }
        .toolbar {
          display: flex;
        }
      }

      .toolbar-backup {
        position: absolute;
        right:6px;
        display:flex;
        align-items: center;
      }`,
    ];
  }

  /* eslint-disable indent */
  render() {
    return html`
      <div class="json-tree tree">
        <div class="toolbar"> 
          <div>&nbsp;</div>
          <div class="toolbar-item">
            <button class="toolbar-copy-btn" part="btn btn-fill" @click='${(e) => { copyToClipboard(JSON.stringify(this.data, null, 2), e); }}'>${getI18nText('operations.copy')}</button>
          </div>
        </div>
        ${this.generateTree(this.data, true)}
      </div>  
    `;
  }

  generateTree(data, isLast = false) {
    if (data === null) {
      return html`<div class="null" style="display:inline;">null</div>`;
    }
    if (typeof data === 'object' && (data instanceof Date === false)) {
      const detailType = Array.isArray(data) ? 'array' : 'pure_object';
      if (Object.keys(data).length === 0) {
        return html`${(Array.isArray(data) ? '[ ],' : '{ },')}`;
      }
      return html`
      <div class="open-bracket expanded ${detailType === 'array' ? 'array' : 'object'} " @click="${this.toggleExpand}" > ${detailType === 'array' ? '[' : '{'}</div>
      <div class="inside-bracket">
        ${Object.keys(data).map((key, i, a) => html`
          <div class="item"> 
            ${detailType === 'pure_object' ? html`"${key}":` : ''}
            ${this.generateTree(data[key], i === (a.length - 1))}
          </div>`)
        }
      </div>
      <div class="close-bracket">${detailType === 'array' ? ']' : '}'}${isLast ? '' : ','}</div>
      `;
    }

    return (typeof data === 'string' || data instanceof Date)
      ? html`<span class="${typeof data}">"${data}"</span>${isLast ? '' : ','}`
      : html`<span class="${typeof data}">${data}</span>${isLast ? '' : ','}`;
  }
  /* eslint-enable indent */

  toggleExpand(e) {
    const openBracketEl = e.target;
    if (openBracketEl.classList.contains('expanded')) {
      openBracketEl.classList.replace('expanded', 'collapsed');
      e.target.innerHTML = e.target.classList.contains('array') ? '[...]' : '{...}';
    } else {
      openBracketEl.classList.replace('collapsed', 'expanded');
      e.target.innerHTML = e.target.classList.contains('array') ? '[' : '{';
    }
  }
}
// Register the element with the browser
if (!customElements.get('openapi-explorer')) {
  customElements.define('json-tree', JsonTree);
}
