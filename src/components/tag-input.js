import { LitElement, html, css } from 'lit-element';

export default class TagInput extends LitElement {
  render() {
    const tagItemTemplate = html`${
      (this.value || []).filter(v => v.trim()).map((v) => html`<span class='tag'>${v}</span>`)
    }`;
    return html`
      <div class='tags' tabindex="0">
        ${tagItemTemplate}
        <input type="text" class='editor' @paste="${(e) => this.afterPaste(e)}" @keydown="${this.afterKeyDown}" placeholder="${this.placeholder || ''}">
      </div>
    `;
  }

  static get properties() {
    return {
      placeholder: { type: String },
      value: { type: Array, attribute: 'value' },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    if (!Array.isArray(this.value)) {
      this.value = this.value !== '' ? [this.value] : [];
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    console.log('what the what');
    if (name === 'value') {
      if (newVal && oldVal !== newVal) {
        this.value = newVal.split(',').filter(v => v.trim());
      }
    }
    super.attributeChangedCallback(name, oldVal, newVal);
  }

  afterPaste(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');
    const pastedArray = pastedData && pastedData.split(',').filter(v => v.trim()) || [];
    this.value = this.value.concat(pastedArray);
    e.preventDefault();
  }

  afterKeyDown(e) {
    if (e.keyCode === 13) {
      e.stopPropagation();
      e.preventDefault();
      this.value = this.value.concat(e.target.value || []);
      e.target.value = '';
    } else if (e.keyCode === 8) {
      if (e.target.value.length === 0) {
        this.value = this.value.slice(0, -1);
      }
    }
  }

  static get styles() {
    return [css`
      .tags{
        display:flex;
        flex-wrap: wrap;
        outline: none;
        padding:0;
        border-radius:var(--border-radius);
        border:1px solid var(--border-color);
        cursor:text;
        overflow:hidden;
        background:var(--input-bg);
      }
      .tag, .editor {
        padding:3px;
        margin:2px;
      }
      .tag{
        border:1px solid var(--border-color);
        background-color:var(--bg3);
        color:var(--fg3);
        border-radius:var(--border-radius);
        word-break: break-all;
        font-size: var(--font-size-small);
      }
      .tag:hover ~ #cursor {
        display: block;
      }
      .editor{
        flex:1;
        border:1px solid transparent;
        color:var(--fg);
        min-width:60px;
        outline: none;
        line-height: inherit;
        font-family:inherit;
        background:transparent;
        font-size: calc(var(--font-size-small) + 1px);
      }
      .editor::placeholder {
        color: var(--placeholder-color);
        opacity:1;
      }
    `];
  }
}
// Register the element with the browser
if (!customElements.get('openapi-explorer')) {
  customElements.define('tag-input', TagInput);
}
