import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';

import Prism from 'prismjs';
import './json-tree';

// It's possible none of these imports are actually necessary and should just be removed
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-http';
import 'prismjs/components/prism-csharp';

import PrismStyles from '../styles/prism-styles';
import FontStyle from '../styles/font-styles';
import InputStyle from '../styles/input-styles';
import { getI18nText } from '../languages';
import { copyToClipboard } from '../utils/common-utils';

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
      copy: { type: Boolean, attribute: 'copy' }
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
    
    if (lang === 'json' && typeof this.content !== 'string') {
      return html`<json-tree .data="${this.content}"/>`;
    }

    return grammar
      ? html`<pre><code>${unsafeHTML(Prism.highlight(this.content?.toString(), grammar, lang))}</code></pre>`
      : html`<pre>${this.content?.toString()}</pre>`;
  }

  /**
   * Render a copy-to-clipboard button.
   * @param {*} content Content
   * @returns Content
   */
  renderCopyWrapper(content) {
    if (this.copy) {
      return html`<div>
                <button 
                    class="m-btn outline-primary toolbar-copy-btn" 
                    @click='${this.copyToClipboard}' 
                    part="btn btn-fill btn-copy">${getI18nText('operations.copy')}</button>
                    ${content}
            </div>`;
    }

    return content;
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
