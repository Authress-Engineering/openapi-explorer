/* eslint-disable indent */
import { html } from 'lit';
import { marked } from 'marked';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

function generateFormRows(data, options, dataType = 'object', key = '', description = '', schemaLevel = 0) {
  const newSchemaLevel = data['::type'] && data['::type'].startsWith('xxx-of') ? schemaLevel : (schemaLevel + 1);

  if (!data) {
    return null;
  }
  if (Object.keys(data).length === 0) {
    return null;
  }
  let rawKeyLabel = '';
  let keyDescr = '';
  let isOneOfLabel = false;
  if (key.startsWith('::ONE~OF') || key.startsWith('::ANY~OF')) {
    rawKeyLabel = key.replace('::', '').replace('~', ' ');
    isOneOfLabel = true;
  } else if (key.startsWith('::OPTION')) {
    const parts = key.split('~');
    rawKeyLabel = parts[1];
    keyDescr = parts[2];
  } else {
    rawKeyLabel = key;
  }

  const keyLabel = rawKeyLabel.replace(/[*]$/, '');
  const isRequired = rawKeyLabel.endsWith('*');
  

  let detailObjType = '';
  if ((data['::type'] || '').includes('xxx-of')) {
    detailObjType = '';
  } else if (data['::type'] === 'object') {
    if (dataType === 'array') {
      detailObjType = `[${keyLabel.replace(/(s|Collection|List)[*]?$/i, '')}]`; // Array of Object
    } else {
      // Ignore an object type for the one-of property
      detailObjType = '';
    }
  } else if (data['::type'] === 'array') {
    if (dataType === 'array') {
      detailObjType = 'array of array'; // Array of array
    } else {
      detailObjType = 'array';
    }
  }

  if (typeof data === 'object') {
    const flags = data['::flags'] || {};
    if (flags['🆁']) {
      return undefined;
    }
    
    const displayLine = [description].filter(v => v).join(' ');
    return html`
      ${newSchemaLevel >= 0 && key
        ? html`
            <tr class='complex-object-display no-select ${data['::type']}' data-obj='${keyLabel}'>
              <td class="key ${data['::deprecated'] ? 'deprecated' : ''}">
                <div style="display: flex; align-items: center">
                  ${data['::type'] === 'xxx-of-option' || data['::type'] === 'xxx-of-array' || key.startsWith('::OPTION')
                    ? html`<span class="xxx-of-key">${keyLabel}</span><span class="${isOneOfLabel ? 'xxx-of-key' : 'xxx-of-descr'}">${keyDescr}</span>`
                    : isRequired
                      ? html`<span class="key-label" style="display:inline-block;">${keyLabel}</span><span style='color:var(--red);'>*</span>`
                      : html`<span class="key-label" style="display:inline-block;">${keyLabel === '::props' ? '' : keyLabel}</span>`
                  }
            </div>
          </td>
          <td>
          <!-- Leave empty, there are no objects that make sense in the form data -->
          </td>
          <td class='key-descr m-markdown-small'>${unsafeHTML(marked(displayLine))}</td>
        </tr>`
        : html`${data['::type'] === 'array' && dataType === 'array' ? html`<tr><td> ${dataType} </td> </tr>` : ''}`
      }
      ${Array.isArray(data) && data[0] ? html`${generateFormRows(data[0], options, 'xxx-of-option', '::ARRAY~OF', '', newSchemaLevel)}`
        : html`${Object.keys(data).map((dataKey) =>
          !['::title', '::description', '::type', '::props', '::deprecated', '::array-type', '::dataTypeLabel', '::flags'].includes(dataKey)
                    || data[dataKey]['::type'] === 'array' && data[dataKey]['::type'] === 'object'
            ? html`${generateFormRows(data[dataKey]['::type'] === 'array' ? data[dataKey]['::props'] : data[dataKey],
              options, data[dataKey]['::type'], dataKey, data[dataKey]['::description'], newSchemaLevel)}`
            : '')}`
      }`;
  }

  // For Primitive Data types
  const { type, format, readOrWriteOnly, constraint, defaultValue, example, allowedValues, pattern, schemaDescription, schemaTitle, deprecated } = JSON.parse(data);
  if (readOrWriteOnly === '🆁') {
    return undefined;
  }

  return html`
    <tr>
      <td style="width:160px; min-width:100px;">
        <div class="param-name ${deprecated ? 'deprecated' : ''}">
          ${!deprecated && isRequired
            ? html`<span class="key-label">${keyLabel}</span><span style='color:var(--red);'>*</span>`
            : key.startsWith('::OPTION')
              ? html`<span class='xxx-of-key'>${keyLabel}</span><span class="xxx-of-descr">${keyDescr}</span>`
              : html`${keyLabel ? html`<span class="key-label"> ${keyLabel}</span>` : html`<span class="xxx-of-descr">${schemaTitle}</span>`}`
        }
        </div>
        <div class="param-type">
          ${dataType === 'array' ? html`[<span>${format || type}</span>]` : `${format || type}`}
        </div>
      </td>
      <td style="min-width:100px;">
        <input placeholder="${example || defaultValue || ''}"
          .value = "${options.fillRequestWithDefault && defaultValue || ''}"
          spellcheck = "false"
          type = "${format === 'binary' ? 'file' : format === 'password' ? 'password' : 'text'}"
          part = "textbox textbox-param"
          style = "width:100%"
          data-ptype = "${options.mimeType.includes('form-urlencode') ? 'form-urlencode' : 'form-data'}"
          data-pname = "${keyLabel}"
          data-default = "${defaultValue || ''}"
          data-array = "false"
        />
      </td>
      <td>
        ${description ? html`<div class="param-description">${unsafeHTML(marked(description))}</div>` : ''}
        ${defaultValue || constraint || allowedValues || pattern
          ? html`
            <div class="param-constraint">
              ${pattern ? html`<span style="font-weight:bold">Pattern: </span>${pattern}<br/>` : ''}
              ${constraint ? html`<span style="font-weight:bold">Constraints: </span>${constraint}<br/>` : ''}
              ${allowedValues?.split('┃').map((v, i) => html`
                ${i > 0 ? '|' : html`<span style="font-weight:bold">Allowed: </span>`}
                ${html`
                  <a part="anchor anchor-param-constraint"
                    data-type="${type === 'array' ? type : 'string'}"
                    data-enum="${v.trim()}"
                    @click="${(e) => {
                      const inputEl = e.target.closest('table').querySelector(`[data-pname="${keyLabel}"]`);
                      inputEl.value = e.target.dataset.type === 'array' ? [e.target.dataset.enum] : e.target.dataset.enum;
                    }}"> 
                    ${v} 
                  </a>`
                }`)
              }
            </div>`
          : ''
        }
      </td>
    </tr>

    ${schemaDescription || example ? html`<tr class="form-parameter-description">
      <td> </td>
      <td colspan="2" style="margin-top:0; padding:0 5px 8px 5px;"> 
        <span class="m-markdown-small">${unsafeHTML(marked(schemaDescription || ''))}</span>
        ${example
          ? html`<span>
            <span style="font-weight:bold"> Example: </span>
            ${type === 'array' ? '[ ' : ''}
            <a part="anchor anchor-param-example"
              data-example-type="${type === 'array' ? type : 'string'}"
              data-example = "${Array.isArray(example) && example.join('~|~') || example || ''}"
              @click="${(e) => {
                const inputEl = e.target.closest('table').querySelector(`[data-pname="${keyLabel}"]`);
                inputEl.value = e.target.dataset.exampleType === 'array' ? e.target.dataset.example.split('~|~') : e.target.dataset.example;
              }}">
              ${type === 'array' ? example.join(', ') : example}
            </a>
            ${type === 'array' ? '] ' : ''}
          </span>`
        : ''}
      </td>
    </tr>` : ''}`;
}

export default function getRequestFormTable(data, mimeType) {
  const options = {
    mimeType: mimeType,
    fillRequestWithDefault: this.fillRequestWithDefault === 'true'
  };

  return html`
    <table role="presentation" class="request-form-table" style = 'border:1px solid var(--light-border-color); width: 100%'>
      ${data ? html`${generateFormRows(data['::type'] === 'array' ? data['::props'] : data, options, data['::type'])}` : ''}  
    </table>`;
}
  
