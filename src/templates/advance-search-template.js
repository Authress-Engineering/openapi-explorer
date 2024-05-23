import { html } from 'lit';

/* eslint-disable indent */
export default function searchByPropertiesModalTemplate() {
  const keyDownEventListenerAdvancedSearch = (e) => {
    if ((e.detail && e.detail.code || e.code) === 'Escape') {
      this.showAdvancedSearchDialog = false;
    }
  };

  const closeAdvancedSearchDialog = () => {
    // Trigger the event to force it to be removed from the DOM
    document.dispatchEvent(new CustomEvent('keydown', { detail: { code: 'Escape' } }));
    document.removeEventListener('keydown', keyDownEventListenerAdvancedSearch, { once: true });
  };

  document.addEventListener('keydown', keyDownEventListenerAdvancedSearch, { once: true });

  return html`
  ${this.showAdvancedSearchDialog
    ? html`
      <div class="dialog-box-overlay" part="advanced-search-dialog">
        <div class="dialog-box">
          <header class="dialog-box-header">
            <span class="dialog-box-title">Advanced Search</span>
            <button class="m-btn thin-border" @click="${() => { closeAdvancedSearchDialog(); }}" part="btn btn-outline">&times;</button>
          </header>
          <div id="advanced-search-modal" class="dialog-box-content">
            <span class="advanced-search-options">
              <div class="advanced-search-dialog-input">
                <input id="advanced-search-dialog-input" type="text" part="textbox textbox-search-dialog" placeholder="search text..." spellcheck="false"
                  @keyup = "${(e) => this.onAdvancedSearch(e)}">
              </div>
              <div class="advanced-search-locations">
                <div>
                  <input style="cursor: pointer;" type="checkbox" part="checkbox checkbox-search-dialog" id="search-api-path" checked @change = "${(e) => this.onAdvancedSearch(e)}">
                  <label style="cursor: pointer;" for="search-api-path"> API Path </label>
                </div>
                <div>
                  <input style="cursor: pointer;" type="checkbox" part="checkbox checkbox-search-dialog" id="search-api-descr" checked @change = "${(e) => this.onAdvancedSearch(e)}">
                  <label style="cursor: pointer;" for="search-api-descr"> API Description </label>
                </div>
                <div>
                  <input style="cursor: pointer;" type="checkbox" part="checkbox checkbox-search-dialog" id="search-api-params" @change = "${(e) => this.onAdvancedSearch(e)}">
                  <label style="cursor: pointer;" for="search-api-params"> Request Parameters </label>
                </div>
                <div>
                  <input style="cursor: pointer;" type="checkbox" part="checkbox checkbox-search-dialog" id="search-api-request-body" @change = "${(e) => this.onAdvancedSearch(e)}">
                  <label style="cursor: pointer;" for="search-api-request-body"> Request Body </label>
                </div>
                <div>
                  <input style="cursor: pointer;" type="checkbox" part="checkbox checkbox-search-dialog" id="search-api-resp-descr" @change = "${(e) => this.onAdvancedSearch(e)}">
                  <label style="cursor: pointer;" for="search-api-resp-descr"> Response Description </label>
                </div>
              </div>
            </span>

            <div class="advanced-search-results">
              ${this.advancedSearchMatches && this.advancedSearchMatches.map((path) => html`
                <div
                  class="mono-font small-font-size hover-bg" tabindex = '0'
                  style='padding: 5px; cursor: pointer; border-bottom: 1px solid var(--light-border-color); ${path.deprecated ? 'filter:opacity(0.5);' : ''}'
                  data-content-id='${path.elementId}'
                  @click="${(e) => {
                    this.matchPaths = ''; // clear quick filter if applied
                    closeAdvancedSearchDialog(); // Hide Search Dialog
                    this.requestUpdate();
                    this.scrollToEventTarget(e, true);
                  }}">
                  <span class="upper bold-text method-fg ${path.method}">${path.method}</span>
                  <span>${path.path}</span> - <span class="regular-font gray-text">${path.summary}</span>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>`
    : ''
  }`;
}
/* eslint-enable indent */
