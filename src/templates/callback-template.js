import { html } from 'lit';

/* eslint-disable indent */
export default function callbackTemplate(callbacks) {
  return html`
  <div class="api-request col regular-font request-panel ${this.renderStyle}-mode">
    ${Object.entries(callbacks).map((kv) => html`
      <div class="${this.renderStyle}-request"> 
        <div class="req-res-title">CALLBACKS</div>
        <div class="table-title">${kv[0]}</div>
        ${Object.entries(kv[1]).map((pathObj) => html`
          <div class="mono-font small-font-size" style="display:flex;">
            <div style="width:100%"> 
              ${Object.entries(pathObj[1]).map((method) => html`
                <div>
                  <div style="margin-top:12px;">
                    <div class="method method-fg ${method[0]}" style="width:70px; border:none; margin:0; padding:0; line-height:20px; vertical-align: baseline;text-align:left"> 
                      <span style="font-size:20px;"> &#x2944; </span> 
                      ${method[0]} 
                    </div>
                    <span style="line-height:20px; vertical-align: baseline;">${pathObj[0]} </span>
                  </div>  
                  <div class='expanded-req-resp-container'>
                    <api-request class="request-panel"
                      callback = "true"
                      method = "${method[0] || ''}", 
                      path = "${pathObj[0] || ''}" 
                      .parameters = "${method[1] && method[1].parameters || ''}" 
                      .request_body = "${method[1] && method[1].requestBody || ''}"
                      fill-defaults = "${!this.hideDefaults}"
                      display-nulls="${!!this.includeNulls}"
                      enable-console = "false"
                      render-style="${this.renderStyle}" 
                      schema-style="${this.displaySchemaAsTree ? 'tree' : 'table'}"
                      active-schema-tab = "${this.defaultSchemaTab}"
                      schema-expand-level = "${this.schemaExpandLevel}"
                      schema-hide-read-only = "${this.schemaHideReadOnly}"
                      fetch-credentials = "${this.fetchCredentials}"
                      @scrollToSchemaComponentByName=${v => this.scrollToSchemaComponentByName(v)}
                      exportparts="btn, btn-fill, btn-outline, btn-try, schema-key, schema-type, schema-description, schema-table-header">
                    </api-request>

                    <api-response
                      callback = "true"
                      .responses="${method[1] && method[1].responses}"
                      display-nulls="${!!this.includeNulls}"
                      render-style="${this.renderStyle}"
                      schema-style="${this.displaySchemaAsTree ? 'tree' : 'table'}"
                      active-schema-tab = "${this.defaultSchemaTab}"
                      schema-expand-level = "${this.schemaExpandLevel}"
                      @scrollToSchemaComponentByName=${v => this.scrollToSchemaComponentByName(v)}
                      exportparts = "btn--resp, btn-fill--resp, btn-outline--resp, schema-key, schema-type, schema-description, schema-table-header"
                    > </api-response>
                  </div>
                </div>  
              `)}
            </div>  
          </div>  
        `)}
      </div>  
    `)}
  </div>
  `;
}
/* eslint-enable indent */
