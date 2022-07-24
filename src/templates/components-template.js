/* eslint-disable no-console */
import { schemaInObjectNotation } from '../utils/schema-utils';
import { html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { marked } from 'marked';
import '../components/json-tree';
import '../components/schema-tree';

function componentBodyTemplate(sComponent) {
  const formdataPartSchema = schemaInObjectNotation(sComponent.component, {});

  return html`
  <div class='expanded-endpoint-body observe-me ${sComponent.name}' id='cmp--${sComponent.id}' >
    ${html`<h2>${sComponent.name}</h2>
      ${sComponent.component
    ? html`
          <div class='mono-font regular-font-size' style='padding: 8px 0; color:var(--fg2)'> 
            <schema-tree
              .data = '${formdataPartSchema}'
              schema-expand-level = "${this.schemaExpandLevel}"
              schema-description-expanded = "${this.schemaDescriptionExpanded}"> </schema-tree>
          </div>`
    : ''}
    `}
  </div>
  `;
}

export default function componentsTemplate() {
  return html`
  ${this.resolvedSpec.components.map((component) => html`
    <div id="cmp--${component.name.toLowerCase()}" class='regular-font section-gap--read-mode observe-me' style="border-top:1px solid var(--primary-color);">
      <div class="title tag">${component.name}</div>
      <div class="regular-font-size">
        ${unsafeHTML(`<div class='m-markdown regular-font'>${marked(component.description ? component.description : '')}</div>`)}
      </div>
    </div>
    <div class='regular-font section-gap--read-mode'>
      ${component.subComponents.map((sComponent) => componentBodyTemplate.call(this, sComponent))}
    </div>
    `)
}
`;
}
/* eslint-enable indent */
