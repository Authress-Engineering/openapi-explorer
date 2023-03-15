import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import base64url from 'base64url';
import { getI18nText } from '../utils/common-utils';

function onApiKeyChange(apiKeyId, e) {
  let apiKeyValue = '';
  const securityObj = this.resolvedSpec.securitySchemes.find((v) => (v.apiKeyId === apiKeyId));
  if (!securityObj) {
    return;
  }

  const trEl = e.target.closest('tr');
  if (securityObj.type && securityObj.type === 'http' && securityObj.scheme && securityObj.scheme.toLowerCase() === 'basic') {
    const userVal = trEl.querySelector('.api-key-user').value.trim();
    const passwordVal = trEl.querySelector('.api-key-password').value.trim();
    if (passwordVal) {
      apiKeyValue = `Basic ${btoa(`${userVal}:${passwordVal}`)}`;
    }
  } else {
    apiKeyValue = trEl.querySelector('.api-key-input').value.trim();
    if (apiKeyValue) {
      if (securityObj.scheme && securityObj.scheme.toLowerCase() === 'bearer') {
        apiKeyValue = `Bearer ${apiKeyValue.replace(/^Bearer\s+/i, '')}`;
      }
    }
  }

  securityObj.finalKeyValue = apiKeyValue;
  this.requestUpdate();
}

function onClearAllApiKeys() {
  this.resolvedSpec.securitySchemes.forEach((v) => {
    v.user = '';
    v.password = '';
    v.value = '';
    v.finalKeyValue = '';
  });
  this.requestUpdate();
}

// Updates the OAuth Access Token (API key), so it reflects in UI and gets used in TRY calls
function updateOAuthKey(apiKeyId, tokenType = 'Bearer', accessToken) {
  const securityObj = this.resolvedSpec.securitySchemes.find((v) => (v.apiKeyId === apiKeyId));
  const tokenPrefix = tokenType && tokenType.toLowerCase() === 'bearer' ? 'Bearer' : tokenType;
  securityObj.finalKeyValue = `${tokenPrefix}${tokenPrefix ? ' ' : ''}${accessToken}`;
  this.requestUpdate();
}

// Gets Access-Token in exchange of Authorization Code
async function fetchAccessToken(tokenUrl, clientId, clientSecret, redirectUrl, grantType, authCode, sendClientSecretIn = 'header', apiKeyId, authFlowDivEl, scopes = null) {
  const respDisplayEl = authFlowDivEl ? authFlowDivEl.querySelector('.oauth-resp-display') : undefined;
  const urlFormParams = new URLSearchParams();
  const headers = new Headers();
  urlFormParams.append('grant_type', grantType);
  if (redirectUrl) {
    urlFormParams.append('redirect_uri', redirectUrl);
  }
  if (authCode) {
    urlFormParams.append('code', authCode);
  }
  if (sendClientSecretIn === 'header') {
    headers.set('Authorization', `Basic ${btoa(`${clientId}:${clientSecret}`)}`);
  } else {
    urlFormParams.append('client_id', clientId);
    if (clientSecret) {
      urlFormParams.append('client_secret', clientSecret);
    }
  }
  if (scopes) {
    urlFormParams.append('scope', scopes);
  }

  const { codeVerifier } = JSON.parse(localStorage.getItem('openapi-explorer-oauth') || '{}');
  localStorage.removeItem('openapi-explorer-oauth');
  if (codeVerifier) {
    urlFormParams.append('code_verifier', codeVerifier);
  }

  try {
    const resp = await fetch(tokenUrl, { method: 'POST', headers, body: urlFormParams });
    const tokenResp = await resp.json();
    if (!resp.ok) {
      if (respDisplayEl) {
        respDisplayEl.innerHTML = `<span style="color:var(--red)">${tokenResp.error_description || tokenResp.error_description || 'Unable to get access token'}</span>`;
      }
      return;
    }

    if (tokenResp.token_type && tokenResp.access_token) {
      updateOAuthKey.call(this, apiKeyId, tokenResp.token_type, tokenResp.access_token);
      if (respDisplayEl) {
        respDisplayEl.innerHTML = '<span style="color:var(--green)">Access Token Received</span>';
      }
    }
  } catch (err) {
    if (respDisplayEl) {
      respDisplayEl.innerHTML = '<span style="color:var(--red)">Failed to get access token</span>';
    }
  }
}

function getCookieValue(keyId) {
  const foundCookie = (document.cookie || '').split(';').find(c => c.split('=')[0] === keyId);
  return foundCookie && foundCookie.split('=')[1] || '';
}

function toObject(urlSearchParams) {
  const result = {};

  const entries = urlSearchParams && urlSearchParams.entries() || [];
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
}

// Gets invoked when it receives the Authorization Code from the other window via message-event
export async function checkForAuthToken(redirectToApiLocation) {
  const parameters = toObject(new URLSearchParams(window.location.search));
  const hashQuery = toObject(new URLSearchParams(window.location.hash.slice(1)));

  Object.assign(parameters, hashQuery);

  const newUrl = new URL(window.location);
  newUrl.searchParams.delete('nonce');
  newUrl.searchParams.delete('expires_in');
  newUrl.searchParams.delete('access_token');
  newUrl.searchParams.delete('token_type');
  newUrl.searchParams.delete('id_token');
  newUrl.searchParams.delete('state');
  newUrl.searchParams.delete('code');
  newUrl.searchParams.delete('iss');
  newUrl.searchParams.delete('scope');
  newUrl.searchParams.delete('prompt');
  newUrl.searchParams.delete('hd');
  newUrl.searchParams.delete('authuser');
  newUrl.searchParams.delete('redirect_auth');
  if (!parameters.state) {
    return;
  }
  const sanitizedUrlWithHash = newUrl.toString().replace(/#((code|state|access_token|id_token|authuser|expires_in|hd|prompt|scope|token_type)=[^&]+&?)*$/ig, '');
  history.replaceState({}, undefined, sanitizedUrlWithHash);

  const { apiKeyId, flowId, url } = JSON.parse(base64url.decode(parameters.state));
  if (redirectToApiLocation && url && !parameters.redirect_auth) {
    const apiExplorerLocation = new URL(url);
    Object.keys(parameters).forEach(key => apiExplorerLocation.searchParams.append(key, parameters[key]));
    apiExplorerLocation.searchParams.append('redirect_auth', true);
    window.location.replace(apiExplorerLocation.toString());
    return;
  }
  if (parameters.code) {
    const securityObj = this.resolvedSpec.securitySchemes.find(v => v.apiKeyId === apiKeyId);
    const tokenUrl = securityObj && securityObj.flows[flowId] && new URL(securityObj.flows[flowId].tokenUrl || '', this.selectedServer?.computedUrl);
    await fetchAccessToken.call(this, tokenUrl, securityObj.clientId, securityObj.clientSecret, securityObj.redirectUri || window.location.href, 'authorization_code', parameters.code, null, apiKeyId);
    return;
  }

  updateOAuthKey.call(this, apiKeyId, parameters.token_type, parameters.access_token);
}

async function onInvokeOAuthFlow(apiKeyId, flowType, authUrl, tokenUrl, e) {
  const authFlowDivEl = e.target.closest('.oauth-flow');
  const clientId = authFlowDivEl.querySelector('.oauth-client-id') ? authFlowDivEl.querySelector('.oauth-client-id').value.trim() : '';
  const clientSecret = authFlowDivEl.querySelector('.oauth-client-secret') ? authFlowDivEl.querySelector('.oauth-client-secret').value.trim() : '';
  const sendClientSecretIn = authFlowDivEl.querySelector('.oauth-send-client-secret-in') ? authFlowDivEl.querySelector('.oauth-send-client-secret-in').value.trim() : 'header';

  const checkedScopeEls = [...authFlowDivEl.querySelectorAll('input[type="checkbox"]:checked')];
  const securityObj = this.resolvedSpec.securitySchemes.find(v => v.apiKeyId === apiKeyId);
  let grantType = '';
  let responseType = '';

  // clear previous error messages
  const errEls = [...authFlowDivEl.parentNode.querySelectorAll('.oauth-resp-display')];
  errEls.forEach((v) => { v.innerHTML = ''; });

  if (flowType === 'authorizationCode' || flowType === 'implicit') {
    const authUrlObj = new URL(authUrl);
    const authCodeParams = new URLSearchParams(authUrlObj.search);
    if (flowType === 'authorizationCode') {
      const randomBytes = new Uint32Array(3);
      (window.crypto || window.msCrypto).getRandomValues(randomBytes);
      authCodeParams.set('nonce', randomBytes.toString('hex').split(',').join(''));
      grantType = 'authorization_code';
      responseType = 'code';
      const codeVerifier = randomBytes.toString('hex').split(',').join('');
      const hash = await (window.crypto || window.msCrypto).subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
      const codeChallenge = base64url(hash);

      authCodeParams.set('code_challenge', codeChallenge);
      authCodeParams.set('code_challenge_method', 'S256');
      localStorage.setItem('openapi-explorer-oauth', JSON.stringify({ codeVerifier }));
    } else if (flowType === 'implicit') {
      responseType = 'token';
    }
    const selectedScopes = checkedScopeEls.map((v) => v.value).join(' ');
    if (selectedScopes) {
      authCodeParams.set('scope', selectedScopes);
    }
    authCodeParams.set('client_id', clientId);
    authCodeParams.set('redirect_uri', securityObj.redirectUri || window.location.href);
    authCodeParams.set('response_type', responseType);
    authCodeParams.set('state', base64url.encode(JSON.stringify({ apiKeyId, flowId: flowType, url: window.location.href })));

    authUrlObj.search = authCodeParams.toString();
    window.location.assign(authUrlObj.toString());
  } else if (flowType === 'clientCredentials') {
    grantType = 'client_credentials';
    const selectedScopes = checkedScopeEls.map((v) => v.value).join(' ');
    fetchAccessToken.call(this, tokenUrl, clientId, clientSecret, '', grantType, '', sendClientSecretIn, apiKeyId, authFlowDivEl, selectedScopes);
  }
}

/* eslint-disable indent */

function oAuthFlowTemplate(flowName, securityObj, authFlow) {
  const apiKeyId = securityObj.apiKeyId;
  const getFullUrl = url => (url ? new URL(url, this.selectedServer?.computedUrl) : undefined);
  const authorizationUrl = getFullUrl(authFlow.authorizationUrl, this.selectedServer?.computedUrl);
  const tokenUrl = getFullUrl(authFlow.tokenUrl, this.selectedServer?.computedUrl);
  const refreshUrl = getFullUrl(authFlow.refreshUrl, this.selectedServer?.computedUrl);
  let flowNameDisplay;
  if (flowName === 'authorizationCode') {
    flowNameDisplay = 'Authorization Code Flow';
  } else if (flowName === 'clientCredentials') {
    flowNameDisplay = 'Client Credentials Flow';
  } else if (flowName === 'implicit') {
    flowNameDisplay = 'Implicit Flow';
  } else {
    flowNameDisplay = flowName;
  }
  return html`
    <div class="oauth-flow" style="padding: 10px 0; margin-bottom:10px;"> 
      <div class="tiny-title upper" style="margin-bottom:5px;">${flowNameDisplay}</div> 
      ${authorizationUrl
        ? html`<div><span style="width:75px; display: inline-block;">Auth URL</span> <span class="mono-font"> ${authorizationUrl} </span></div>`
        : ''
      }
      ${tokenUrl
        ? html`<div><span style="width:75px; display: inline-block;">Token URL</span> <span class="mono-font">${tokenUrl}</span></div>`
        : ''
      }
      ${refreshUrl
        ? html`<div><span style="width:75px; display: inline-block;">Refresh URL</span> <span class="mono-font">${refreshUrl}</span></div>`
        : ''
      }
      ${flowName === 'authorizationCode' || flowName === 'clientCredentials' || flowName === 'implicit'
        ? html`
          ${authFlow.scopes
            ? html`
              <span> Scopes </span>
              <div class= "oauth-scopes" part="section-auth-scopes" style = "width:100%; display:flex; flex-direction:column; flex-wrap:wrap; margin:0 0 .125rem 0">
                ${Object.entries(authFlow.scopes).map((scopeAndDescr, index) => html`
                  <div class="m-checkbox" style="display:inline-flex; align-items:center">
                    <input type="checkbox" checked part="checkbox checkbox-auth-scope" id="${flowName}${index}" value="${scopeAndDescr[0]}">
                    <label for="${flowName}${index}" style="margin-left:5px">
                      <span class="mono-font">${scopeAndDescr[0]}</span>
                        ${scopeAndDescr[0] !== scopeAndDescr[1] ? ` - ${scopeAndDescr[1] || ''}` : ''}
                    </label>
                  </div>
                `)}
              </div>
            `
            : ''
          }
          <div style="display:flex;">
            <input type="text" part="textbox textbox-auth-client-id" value="${securityObj.clientId || ''}" placeholder="Client ID" spellcheck="false" class="oauth-client-id">
            ${flowName === 'clientCredentials'
              ? html`
                <input type="password" part="textbox textbox-auth-client-secret" value = "" placeholder="Client Secret" spellcheck="false" class="oauth-client-secret" style = "margin:0 5px;">
                <select aria-label='oauth client secret location' style="margin-right:5px;" class="oauth-send-client-secret-in">
                  <option value = 'header' selected> Authorization Header </option> 
                  <option value = 'request-body'> Request Body </option> 
                </select>`
              : html`<div style='width:5px'></div>`
            }
            ${flowName === 'authorizationCode' || flowName === 'clientCredentials' || flowName === 'implicit'
              ? html`
                <button class="m-btn thin-border" part="btn btn-outline"
                  @click="${(e) => { onInvokeOAuthFlow.call(this, apiKeyId, flowName, authorizationUrl, tokenUrl, e); }}"
                >GET TOKEN</button>`
              : ''
            }
          </div>  
          <div class="oauth-resp-display red-text small-font-size"></div>
          `
        : ''
      }
    </div>  
  `;
}

export default function securitySchemeTemplate() {
  const schemes = this.resolvedSpec && this.resolvedSpec.securitySchemes;
  if (!schemes) {
    return undefined;
  }
  const providedApiKeys = schemes.filter((v) => (v.finalKeyValue));
  return html`
  <section id='auth' part="section-auth" class = 'observe-me ${this.renderStyle === 'focused' ? 'section-gap--focused-mode' : 'section-gap'}'>
    <slot name="authentication">
      <div class="section-padding">
        <div class='sub-title regular-font'>${getI18nText('headers.authentication')}</div>
        <div class="small-font-size" style="display:flex; align-items: center; min-height:30px">
          ${providedApiKeys.length > 0
            ? html`
              <div class="blue-text"> ${providedApiKeys.length} API key applied </div>
              <div style="flex:1"></div>
              <button class="m-btn thin-border" part="btn btn-outline" @click=${() => { onClearAllApiKeys.call(this); }}>CLEAR ALL API KEYS</button>`
            : html`<div class="red-text">${getI18nText('authentication.no-api-key-applied')}</div>`
          }
        </div>
        ${schemes.length > 0
          ? html`  
            <table role="presentation" class='m-table' style="width:100%">
              ${schemes.map((v) => html`
                <tr>  
                  <td style="max-width:500px; overflow-wrap: break-word;">
                    <div style="min-height:24px"> 
                      <span style="font-weight:bold">${v.typeDisplay}</span> 
                      ${v.finalKeyValue
                        ? html`
                          <span class='blue-text'>  ${v.finalKeyValue ? 'Key Applied' : ''} </span> 
                          <button class="m-btn thin-border small" part="btn btn-outline" @click=${() => { v.finalKeyValue = ''; this.requestUpdate(); }}>REMOVE</button>
                          `
                        : ''
                      }
                    </div>
                    ${v.description
                      ? html`
                        <div class="m-markdown"> 
                          ${unsafeHTML(marked(v.description || ''))}
                        </div>`
                      : ''
                    }
                  </td>
                  <td>
                    ${v.type && (v.type.toLowerCase() === 'apikey' || v.type.toLowerCase() === 'http' && v.scheme && v.scheme.toLowerCase() === 'bearer')
                      ? html`
                        ${v.type.toLowerCase() === 'apikey'
                          ? html`Send <code>${v.name}</code> in <code>${v.in}</code> with the given value:`
                          : html`Send <code>Authorization</code> in <code>header</code> containing the word <code>Bearer</code> followed by a space and a Token String.`
                        }
                        <form style="display:flex;">
                          ${v.in === 'cookie'
                            ? html`
                            <div style="display: block">
                              <input type="text" value="${getCookieValue(v.apiKeyId)}" disabled class="api-key-input" placeholder="IygRVGf54B59e0GAkKmigGfuiVlp/uhFfk2ifA+jMMJzau2F1jPldc09gPTfnMw13BFBxqUZIFDm55DPfwkb0A==" spellcheck = "false" style="resize: horizontal; width: 100%">
                              <br>
                              <small>
                                <strong>Cookies</strong>&nbsp;are set and configured by the remote service, therefore it is not possible to configure them from the browser.
                              </small>
                            </div>`
                            : html`
                              <input type = "text" value = "${v.value}" placeholder = "api-token" spellcheck = "false" class="api-key-input fs-exclude" data-hj-suppress data-sl="mask">
                              <button type="submit" class="m-btn thin-border" style = "margin-left:5px;"
                                part = "btn btn-outline"
                                @click="${(e) => { onApiKeyChange.call(this, v.apiKeyId, e); }}"> 
                                ${v.finalKeyValue ? 'UPDATE' : 'SET'}
                              </button>`
                          }
                        </form>`
                      : ''
                    }
                    ${v.type && v.type.toLowerCase() === 'http' && v.scheme && v.scheme.toLowerCase() === 'basic'
                      ? html`
                      ${getI18nText('authentication.http-basic-desc')}
                        <form style="display:flex;">
                          <input type="text" value = "${v.user}" placeholder="${getI18nText('authentication.username')}" spellcheck="false" class="api-key-user" style="width:100px">
                          <input class="api-key-password fs-exclude" data-hj-suppress data-sl="mask"
                            type="password" value = "${v.password}" placeholder="${getI18nText('authentication.password')}" spellcheck="false" style = "width:100px; margin:0 5px;">
                          <button type="submit" class="m-btn thin-border"
                            @click="${(e) => { onApiKeyChange.call(this, v.apiKeyId, e); }}"
                            part = "btn btn-outline"
                          > 
                            ${v.finalKeyValue ? 'UPDATE' : getI18nText('authentication.set')}
                          </button>
                        </form>`
                      : ''
                    }
                  </td>
                </tr>
                ${v.type.toLowerCase() === 'oauth2'
                  ? html`
                    <tr>
                      <td colspan="2" style="border:none; padding-left:48px">
                        ${Object.keys(v.flows).map((f) => oAuthFlowTemplate.call(this, f, v, v.flows[f]))}
                      </td>
                    </tr>    
                    `
                  : ''
                }    
              `)}
            </table>`
          : ''
        }
      </div>
    </slot>
  </section>
`;
}

function getOauthScopeTemplate(rawScopes) {
  const scopes = Array.isArray(rawScopes) ? rawScopes.map(s => s?.trim()).filter(s => s) : [];
  if (!scopes.length) {
    return '';
  }

  return html`
    <div>
      <b>Required scopes:</b> 
      <br/> 
      <div style="margin-left:8px">  
        ${scopes.map(scope => html`<span>${scope}</span>&nbsp;`)}
      </div>  
    </div>`;
}

export function pathSecurityTemplate(pathSecurity) {
  if (this.resolvedSpec.securitySchemes && pathSecurity) {
    const orSecurityKeys1 = [];
    pathSecurity.forEach((pSecurity) => {
      const andSecurityKeys1 = [];
      const andKeyTypes = [];
      Object.keys(pSecurity).forEach((pathSecurityKey) => {
        const s = this.resolvedSpec.securitySchemes.find((ss) => ss.apiKeyId === pathSecurityKey);
        if (s) {
          andKeyTypes.push(s.typeDisplay);
          andSecurityKeys1.push({ ...s, scopes: pSecurity[pathSecurityKey] });
        }
      });
      orSecurityKeys1.push({
        securityTypes: andKeyTypes.length > 1 ? `${andKeyTypes[0]} + ${andKeyTypes.length - 1} more` : andKeyTypes[0],
        securityDefs: andSecurityKeys1,
      });
    });
    return html`<div class="security-info-button" data-content-id='auth' @click='${(e) => this.scrollToEventTarget(e, false)}'>
      <div style="position:relative; display:flex; min-width:350px; max-width:700px; justify-content: flex-end;">
        <svg width="16" height="24" style="cursor: pointer;">
          <g>
            <path style="fill: var(--fg3)" d="m13.8,8.5l0,-2.6l0,0c0,-3.2 -2.6,-5.8 -5.8,-5.8s-5.8,2.6 -5.8,5.8l0,0l0,2.6l-2.1,0l0,11.2l16,0l0,-11.2l-2.1,0l-0,0l0,0l0,0l-0,0zm-9.8,-2.6c0,0 0,0 0,0c0,-2.2 1.8,-4 4,-4c2.2,0 4,1.8 4,4c0,0 0,0 0,0l0,2.6l-8.03,0l0,-2.6l0,0l0,0z" />
          </g>
        </svg>
          ${orSecurityKeys1.map((orSecurityItem1, i) => html`
          ${i !== 0 ? html`<div style="padding:3px 4px;"> OR </div>` : ''}
          <div class="tooltip" style="cursor: pointer;">
            <div style="padding:2px 4px; white-space:nowrap; text-overflow:ellipsis;max-width:150px; overflow:hidden;">
              <span part="anchor anchor-operation-security"> ${orSecurityItem1.securityTypes} </span>
            </div>
            <div class="tooltip-text" style="position:absolute; color: var(--fg); top:26px; right:0; border:1px solid var(--border-color);padding:2px 4px; display:block;">
              ${orSecurityItem1.securityDefs.length > 1 ? html`<div>Requires <b>all</b> of the following </div>` : ''}
              <div style="padding-left: 8px">
                ${orSecurityItem1.securityDefs.map((andSecurityItem, j) => html`
                  ${andSecurityItem.type === 'oauth2'
                    ? html`
                      <div>
                        ${orSecurityItem1.securityDefs.length > 1 ? html`<b>${j + 1}.</b> &nbsp;` : html`Requires`}
                        OAuth token (${andSecurityItem.apiKeyId}) in <b>Authorization header</b>
                        ${getOauthScopeTemplate(andSecurityItem.scopes)}
                      </div>`
                    : andSecurityItem.type === 'http'
                      ? html`
                        <div>
                          ${orSecurityItem1.securityDefs.length > 1 ? html`<b>${j + 1}.</b> &nbsp;` : html`${getI18nText('authentication.requires')}`} 
                          ${andSecurityItem.scheme === 'basic' ? getI18nText('authentication.http-basic-note') : 'Bearer Token'} ${getI18nText('authentication.in-auth-header')}
                          ${getOauthScopeTemplate(andSecurityItem.scopes)}
                        </div>`
                      : html`
                        <div>
                          ${orSecurityItem1.securityDefs.length > 1 ? html`<b>${j + 1}.</b> &nbsp;` : html`Requires`} 
                          Token in <b>${andSecurityItem.name} ${andSecurityItem.in}</b>
                          ${getOauthScopeTemplate(andSecurityItem.scopes)}
                        </div>`
                  }
                `)}
              </div>  
            </div>
          </div>  
        `)
        }
      </div>
    `;
  }
  return '';
}

/* eslint-enable indent */
