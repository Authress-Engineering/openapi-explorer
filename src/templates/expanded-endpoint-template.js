import { html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import marked from 'marked';
import '@/components/api-request';
import '@/components/api-response';
import '@/components/tab-panel';

function endpointDescriptionRenderer() {
  /*
  Enables you to add the following to the api spec endpoint description markdown:
  <!--
  {
    "rapidocComponent": "tab-panel",
    "panels": [
      {
        "id": "tab1",
        "label": "TAB 1",
        "markdown": "Tab 1 content"
      },
      {
        "id": "tab2",
        "label": "TAB 2",
        "markdown": "# Tab 2 Content\nMore content here"
      },
      {
        "id": "tab3",
        "label": "TAB 3",
        "markdown": "```javascript\nlogin(\"fake.user@example.com\", \"password\")\n# See login for options\n```"
      },
      {
        "id": "tab4",
        "label": "TAB 4",
        "markdown": "my dog is `very` small"
      }
    ],
    "activePanelId": "tab3"
  }
  -->
  */
  const renderer = new marked.Renderer();
  renderer.html = (text) => {
    if (text.search('rapidocComponent') > -1) {
      const component = JSON.parse(text.replace('<!--', '').replace('-->', ''));
      switch (component.rapidocComponent) {
        case 'tab-panel':
          return `
            <tab-panel panels='${JSON.stringify(component.panels)}' active-panel-id='${component.activePanelId}'></tab-panel>
          `;
        default:
      }
    }
    return text;
  };
  return renderer;
}

/* eslint-disable indent */
export function expandedEndpointBodyTemplate(path, tagName = '') {
  const acceptContentTypes = new Set();
  for (const respStatus in path.responses) {
    for (const acceptContentType in path.responses[respStatus] && path.responses[respStatus].content) {
      acceptContentTypes.add(acceptContentType.trim());
    }
  }
  accept = accept.replace(/,\s*$/, ''); // remove trailing comma
  const nonEmptyApiKeys = this.resolvedSpec.securitySchemes.filter((v) => (v.finalKeyValue)) || [];
  // create xCodeSamples tab panel
  let xCodeSamplesTabPanel = '';
  const panels = [];
  if (path.xCodeSamples !== undefined && path.xCodeSamples.length > 0) {
    path.xCodeSamples.forEach((item) => {
      panels.push({
        id: item.lang,
        label: item.lang,
        markdown: `\`\`\`${item.syntaxLang || 'javascript'}\n${item.source}\n\`\`\``,
      });
    });
    xCodeSamplesTabPanel += `<div class="req-res-title" style="margin-top: 24px;">CODE SAMPLES</div><tab-panel panels='${JSON.stringify(panels)}' active-panel-id='${path.xCodeSamples[0].lang}'></tab-panel>`;
  }
  return html`
    ${this.renderStyle === 'read' ? html`<div class='divider' part="operation-divider"></div>` : ''}
    <div class='expanded-endpoint-body observe-me ${path.method}' part="section-operation ${path.elementId}" id='${path.elementId}'>
    ${(this.renderStyle === 'focused' && tagName !== 'General ⦂') ? html`<h3 class="upper" style="font-weight:bold"> ${tagName} </h3>` : ''}
    ${path.deprecated ? html`<div class="bold-text red-text"> DEPRECATED </div>` : ''}
    ${html`
      <h2 class = "${path.deprecated ? 'gray-text' : ''}"> 
        ${path.summary || html`<span class='upper ${path.deprecated ? ' method-fg gray-text' : path.method}  '> ${path.method}</span> ${path.path}`} 
      </h2>
      ${path.summary
        ? html`
          <div class='mono-font regular-font-size' style='padding: 8px 0; color:var(--fg3)'> 
            <span class='regular-font upper method-fg  ${path.deprecated ? ' gray-text' : ` bold-text ${path.method}`} '>${path.method}</span> 
            <span class = '${path.deprecated ? 'gray-text' : ''}'> ${path.path} </span>
          </div>`
        : ''
      }
    `
    }
    ${path.description
      ? html`
          <div class="m-markdown"> 
            ${unsafeHTML(marked(path.description || '', { renderer: endpointDescriptionRenderer() }))}
          </div>`
      : ''
    }
    ${unsafeHTML(xCodeSamplesTabPanel)}
    <div class='expanded-req-resp-container'>
      <api-request class="request-panel"
        method = "${path.method}"
        path = "${path.path}"
        .parameters = "${path.parameters}"
        .request_body = "${path.requestBody}"
        .api_keys = "${nonEmptyApiKeys}"
        .servers = "${path.servers}"
        server-url = "${path.servers && path.servers[0] && path.servers[0].url || this.selectedServer.computedUrl}"
        fill-defaults = "${this.fillRequestWithDefault}"
        enable-console = "${this.allowTry}"
        accept = "${accept}"
        render-style="${this.renderStyle}" 
        schema-style = "${this.schemaStyle}"
        active-schema-tab = "${this.defaultSchemaTab}"
        schema-expand-level = "${this.schemaExpandLevel}"
        schema-description-expanded = "${this.schemaDescriptionExpanded}"
        schema-hide-read-only = "${this.schemaHideReadOnly}"
        fetch-credentials = "${this.fetchCredentials}"
        exportparts = "btn btn-fill btn-outline btn-try"
      > </api-request>

      ${path.callbacks ? callbackTemplate.call(this, path.callbacks) : ''}

      <api-response
        class = 'response-panel'
        .responses = "${path.responses}"
        render-style = "${this.renderStyle}"
        schema-style = "${this.schemaStyle}"
        active-schema-tab = "${this.defaultSchemaTab}"
        schema-expand-level = "${this.schemaExpandLevel}"
        schema-description-expanded = "${this.schemaDescriptionExpanded}"
        schema-hide-write-only = "${this.schemaHideWriteOnly}"
        selected-status = "${Object.keys(path.responses || {})[0] || ''}"
        exportparts = "btn--resp btn-fill--resp btn-outline--resp"
      > </api-response>
    </div>
  </div>
  `;
}

export default function expandedEndpointTemplate() {
  return html`
  ${(this.resolvedSpec && this.resolvedSpec.tags || []).map((tag) => html`
    <section id="${tag.elementId}" part="section-tag" class="regular-font section-gap--read-mode observe-me" style="border-top:1px solid var(--primary-color);">
      <div class="title tag" part="label-tag-title">${tag.name}</div>
      <slot name="${tag.elementId}"></slot>
      <div class="regular-font-size">
      ${
        unsafeHTML(`
          <div class="m-markdown regular-font">
          ${marked(tag.description || '')}
        </div>`)
      }
      </div>
    </section>
    <section class='regular-font section-gap--read-mode' part="section-operations-in-tag">
      ${tag.paths.map((path) => expandedEndpointBodyTemplate.call(this, path, 'BBB'))}
    </section>
    `)
  }
`;
}
/* eslint-enable indent */
