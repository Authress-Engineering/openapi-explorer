import { LitElement, html } from 'lit';

export default class TagInput extends LitElement {
  createRenderRoot() { return this; }

  render() {
    const tagItemTemplate = html`${
      (this.value || []).filter(v => v.trim()).map((v) => html`<span class='tag'>${v}</span>`)
    }`;
    return html`
      <div class='tags' tabindex="0">
        ${tagItemTemplate}
        <input type="text" class='editor' @change="${this.handleLeave}" @paste="${(e) => this.afterPaste(e)}" @keydown="${this.afterKeyDown}" placeholder="${this.placeholder || ''}">
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

    this.emitChanged();
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
    this.emitChanged();
  }

  handleLeave(e) {
    e.stopPropagation();
    this.value = this.value.concat((e.target.value || '').split(',')).filter(v => v !== '');
    e.target.value = '';
    this.emitChanged();
  }

  emitChanged() {
    this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
    this.dispatchEvent(new CustomEvent('input', { detail: { value: this.value } }));
  }
}
// Register the element with the browser
if (!customElements.get('openapi-explorer')) {
  customElements.define('tag-input', TagInput);
}
