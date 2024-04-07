import { html } from 'lit';
import { toMarkdown } from '../utils/common-utils';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getI18nText } from '../languages/index.js';

function onApiServerChange(e, server) {
  if (e && e.target.checked) {
    this.selectedServer = server;
    this.requestUpdate();
  }
}

function onApiServerVarChange(e, serverObj) {
  const inputEls = [...e.currentTarget.closest('table').querySelectorAll('input, select')];
  let tempUrl = serverObj.url;
  inputEls.forEach((v) => {
    const regex = new RegExp(`{${v.dataset.var}}`, 'g');
    tempUrl = tempUrl.replace(regex, v.value);
  });
  serverObj.computedUrl = tempUrl;
  this.requestUpdate();
}

/* eslint-disable indent */
function serverVarsTemplate() {
  return Object.keys(this.selectedServer?.variables || {}).length
    ? html`
    <div class="table-title">${getI18nText('api-servers.server-variables')}</div>
    <table role="presentation" class='m-table'>
      ${Object.entries(this.selectedServer.variables).map((kv) => html`
        <tr>
          <td colspan="1" style="vertical-align: middle;" >${kv[0]}</td>
          <td colspan="2" >
            ${kv[1].enum
            ? html`
            <select
              data-var = "${kv[0]}"
              @input = ${(e) => { onApiServerVarChange.call(this, e, this.selectedServer); }}
            >
            ${Object.entries(kv[1].enum).map((e) => (kv[1].default === e[1]
              ? html`
              <option
                selected
                label = ${e[1]}
                value = ${e[1]}
              />`
              : html`
              <option
                label = ${e[1]}
                value = ${e[1]}
              />`
            ))}
            </select>`
            : html`
            <input
              type = "text"
              part="textbox textbox-server-var"
              spellcheck = "false"
              data-var = "${kv[0]}"
              value = "${kv[1].default}"
              @input = ${(e) => { onApiServerVarChange.call(this, e, this.selectedServer); }}
            />`}
          </td>
        </tr>
        ${kv[1].description
          ? html`<tr><td colspan="2" style="border:none"><span class="m-markdown-small"> ${unsafeHTML(toMarkdown(kv[1].description))} </span></td></tr>`
          : ''
        }
      `)}
    </table>
    `
    : '';
}

export default function serverTemplate() {
  if (!this.resolvedSpec) {
    return undefined;
  }
  return html`
  <section id = 'servers' part="section-servers" style="margin-top:24px; margin-bottom:24px;" class='regular-font observe-me section-padding ${this.renderStyle === 'read' ? 'section-gap--read-mode' : (this.renderStyle === 'focused' ? 'section-gap--focused-mode' : 'section-gap')}'>
    <div class = 'sub-title'>${getI18nText('headers.api-servers')}</div>
    <div class = 'mono-font' style='margin: 12px 0; font-size:calc(var(--font-size-small) + 1px);'>
      ${!this.resolvedSpec.servers || !this.resolvedSpec.servers.length
        ? ''
        : html`
          ${this.resolvedSpec.servers.map((server, i) => html`
            <input type = 'radio'
              name = 'api_server'
              id = 'srvr-opt-${i}'
              value = '${server.url}'
              @change = ${(e) => { onApiServerChange.call(this, e, server); }}
              .checked = '${this.selectedServer.url === server.url}'
              style = 'margin:4px 0; cursor: pointer'
            />
              <label style='cursor: pointer' for='srvr-opt-${i}'>
                ${server.url} ${server.description ? html`- <span class='regular-font'>${server.description} </span>` : ''}
              </label>
            <br/>
          `)}
      `}
      <div class="table-title primary-text" part="label-selected-server"> ${getI18nText('api-servers.selected')}: ${this.selectedServer?.computedUrl || 'none'}</div>
    </div>
    <slot name="servers"></slot>
    ${serverVarsTemplate.call(this)}
  </section>`;
}
/* eslint-enable indent */
