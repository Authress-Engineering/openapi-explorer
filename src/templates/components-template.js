/* eslint-disable no-console */
import { schemaInObjectNotation } from '../utils/schema-utils';
import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import '../components/schema-tree';

function componentBodyTemplate(sComponent) {
  const formdataPartSchema = schemaInObjectNotation(sComponent.component, { includeNulls: this.includeNulls });

  return html`
  <div class='expanded-endpoint-body observe-me ${sComponent.name}' id='cmp--${sComponent.id}' >
    <h2>${sComponent.name}</h2>
    <div class='mono-font regular-font-size' style='padding: 8px 0; color:var(--fg2)'> 
    ${this.displaySchemaAsTable
    ? html`<schema-table
      .data = '${formdataPartSchema}'
      schema-expand-level = "${this.schemaExpandLevel}"
      schema-hide-read-only=false
      schema-hide-write-only=false> </schema-table>`
        
    : html`<schema-tree
        .data = '${formdataPartSchema}'
        schema-expand-level = "${this.schemaExpandLevel}"
        schema-hide-read-only=false
        schema-hide-write-only=false> </schema-tree>`
}
    </div>
  </div>
  `;
}

export default function componentsTemplate() {
  return html`
  ${this.resolvedSpec.components.map((component) => html`
    <div id="cmp--${component.name.toLowerCase()}" class='regular-font section-gap--focused-mode observe-me' style="padding-bottom: 0">
      <div class="title tag">${component.name}</div>
      <div class="regular-font-size">
        ${unsafeHTML(`<div class='m-markdown regular-font'>${marked(component.description ? component.description : '')}</div>`)}
      </div>
    </div>
    <div class='regular-font section-gap--focused-mode' style="padding-top: 0">
      ${component.subComponents.filter(c => c.expanded).map((sComponent) => componentBodyTemplate.call(this, sComponent))}
    </div>
    `)
}
`;
}
/* eslint-enable indent */
