import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';

import Prism from 'prismjs';
import './json-tree.js';

import 'prismjs/components/prism-markup-templating.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-ruby.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-http.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-php.js';

import PrismStyles from '../styles/prism-styles.js';
import FontStyle from '../styles/font-styles.js';
import InputStyle from '../styles/input-styles.js';
import { getI18nText } from '../languages/index.js';
import { copyToClipboard } from '../utils/common-utils.js';

/**
 * Mapping mime-type => prism language
 */
const LANGUAGES = [
  {
    pattern: /json/,
    language: 'json'
  }, {
    pattern: /xml/,
    language: 'html'
  }
];

/**
 * Syntax Highlighter component.
 */
class SyntaxHighlighter extends LitElement {
  static get properties() {
    return {
      content: { type: Object },
      language: { type: String, attribute: 'language' },
      mimeType: { type: String, attribute: 'mime-type' },
    };
  }

  static finalizeStyles() {
    return [PrismStyles, FontStyle, InputStyle, css`
        :host {
            font-weight: normal;
        }

        div {
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .toolbar-copy-btn {
            position: absolute;
            top: 0px;
            right: 0px;
            margin-right: 8px;
          }
          .toolbar-copy-btn + pre {
            white-space: pre;
            max-height:400px;
            overflow: auto;
            display: flex;
            padding-right: 70px;
          }
    `];
  }

  /**
   * Returns the prism language to use based on language/content type
   * @returns {string} The language to use
   */
  detectLanguage() {
    if (this.language) {
      return this.language?.toLowerCase();
    }

    if (this.mimeType) {
      const lcMimeType = this.mimeType?.toLowerCase();
      return LANGUAGES.find(def => def.pattern.test(lcMimeType))?.language;
    }

    return null;
  }

  render() {
    return this.renderCopyWrapper(this.renderHighlight());
  }

  /**
   * Render the highlighted content.
   * @returns Highlighter
   */
  renderHighlight() {
    const lang = this.detectLanguage();
    const grammar = Prism.languages[lang];

    if (typeof this.content !== 'string') {
      return html`<json-tree .data="${this.content}"/>`;
    }

    const stringContent = this.content?.toString() || '';
    const increasedSpaceContent = lang !== 'python' && lang !== 'yaml' && lang !== 'toml' ? stringContent.split('\n').map(line => line.replace(/^\s{2}/g, '    ')).join('\n') : stringContent;
    return grammar
      ? html`<pre><code>${unsafeHTML(Prism.highlight(increasedSpaceContent, grammar, lang))}</code></pre>`
      : html`<pre>${increasedSpaceContent}</pre>`;
  }

  /**
   * Render a copy-to-clipboard button.
   * @param {*} content Content
   * @returns Content
   */
  renderCopyWrapper(content) {
    return html`<div class="fs-exclude ph-no-capture" data-hj-suppress data-sl="mask" style="min-height: 2rem;">
      <button 
        class="m-btn outline-primary toolbar-copy-btn" 
        @click='${this.copyToClipboard}' 
        part="btn btn-fill btn-copy">${getI18nText('operations.copy')}</button>
        ${content}
    </div>`;
  }

  /**
   * Copy to clipboard.
   * @param {Event} e Event
   */
  copyToClipboard(e) {
    const data = this.detectLanguage() === 'json' && typeof this.content !== 'string'
      ? JSON.stringify(this.content, null, 2)
      : this.content?.toString();

    copyToClipboard(data, e);
  }
}

/*
 * Configure marked globally.
 */
marked.setOptions({
  highlight(code, lang) {
    if (Prism.languages[lang]) {
      return Prism.highlight(code, Prism.languages[lang], lang);
    }
    return code;
  },
});

if (!customElements.get('openapi-explorer')) {
  customElements.define('syntax-highlighter', SyntaxHighlighter);
}
