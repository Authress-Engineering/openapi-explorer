/* eslint-disable no-console */
import { schemaInObjectNotation } from '../utils/schema-utils.js';
import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import '../components/schema-tree.js';
import { getI18nText } from '../languages/index.js';

function componentBodyTemplate(sComponent) {
  const formdataPartSchema = schemaInObjectNotation(sComponent.component, { includeNulls: this.includeNulls });

  return html`
  <div class='expanded-endpoint-component observe-me ${sComponent.name}' id='cmp--${sComponent.id}' @click='${() => this.scrollTo(`cmp--${sComponent.id}`)}'>
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

export function getComponentInfo(componentKeyId) {
  const infoDictionary = {
    schemas: {
      name: getI18nText('menu.schemas'),
      description: ''
    },
    responses: {
      name: 'Responses',
      description: 'Describes responses from an API Operation, including design-time, static links to operations based on the response.'
    },
    parameters: {
      name: 'Parameters',
      description: 'Describes operation parameters. A unique parameter is defined by a combination of a name and location.'
    },
    examples: {
      name: 'Examples',
      description: 'List of Examples for operations, can be requests, responses and objects examples.'
    },
    headers: {
      name: 'Headers',
      description: 'Headers follows the structure of the Parameters but they are explicitly in "header"'
    },
    links: {
      name: 'Links',
      description: 'Links represent a possible design-time link for a response. The presence of a link does not guarantee the caller\'s ability to successfully invoke it, rather it provides a known relationship and traversal mechanism between responses and other operations.'
    },
    callbacks: {
      name: 'Callbacks',
      description: 'A map of possible out-of band callbacks related to the parent operation. Each value in the map is a Path Item Object that describes a set of requests that may be initiated by the API provider and the expected responses. The key value used to identify the path item object is an expression, evaluated at runtime, that identifies a URL to use for the callback operation.'
    }
  };

  return infoDictionary[componentKeyId] || { name: componentKeyId };
}

export default function componentsTemplate() {
  return html`
  ${this.resolvedSpec.components.map((component) => {
    const componentInfo = getComponentInfo(component.componentKeyId);
    return html`
      <div id="cmp--${componentInfo.name.toLowerCase()}" class='regular-font section-gap--focused-mode observe-me' style="padding-bottom: 0">
        <div class="title tag">${componentInfo.name}</div>
        <div class="regular-font-size">
          ${unsafeHTML(`<div class='m-markdown regular-font'>${marked(componentInfo.description ? componentInfo.description : '')}</div>`)}
        </div>
      </div>
      <div class='regular-font section-gap--focused-mode' style="padding-top: 0">
        ${component.subComponents.filter(c => c.expanded).map((sComponent) => componentBodyTemplate.call(this, sComponent))}
      </div>
    `;
  })};
}
`;
}
/* eslint-enable indent */
