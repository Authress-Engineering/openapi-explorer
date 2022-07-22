import { html } from 'lit-element';
import { pathIsInSearch } from '../utils/common-utils';

function onExpandCollapse(tagId) {
  const tag = this.resolvedSpec.tags.find(t => t.elementId === tagId);
  if (!tag) {
    return;
  }
  tag.expanded = !tag.expanded;
  if (tag.expanded && this.operationsCollapsed) {
    this.resolvedSpec.tags.filter(t => t.elementId !== tagId).forEach(t => t.expanded = false);
  }
  this.requestUpdate();
}

export function expandCollapseAll() {
  const expand = this.operationsCollapsed;
  this.operationsCollapsed = !expand;
  this.resolvedSpec.tags.forEach(t => { t.expanded = expand; });
}

/* eslint-disable indent */
export default function navbarTemplate() {
  return html`
  <nav class='nav-bar ${this.renderStyle}' part="section-navbar">
    ${(this.allowSearch === 'false' && this.allowAdvancedSearch === 'false')
      ? ''
      : html`
        <div style="display:flex; flex-direction:row; justify-content:center; align-items:center; padding:24px; ${this.allowAdvancedSearch === 'false' ? 'border-bottom: 1px solid var(--nav-hover-bg-color)' : ''}">
          ${this.allowSearch === 'false'
            ? ''
            : html`
              <div style="display:flex; flex:1; line-height:22px;">
                <input id="nav-bar-search" 
                  part = "textbox textbox-nav-filter"
                  style = "width:100%; padding-right:20px; color:var(--nav-hover-text-color); border-color:var(--secondary-color); background-color:var(--nav-hover-bg-color)" 
                  type = "text"
                  placeholder = "Filter" 
                  @change = "${this.onSearchChange}"  
                  spellcheck = "false" 
                >
                <div style="margin: 6px 5px 0 -24px; font-size:var(--font-size-regular); cursor: pointer;">&#x21a9;</div>
              </div>  
              ${this.matchPaths
                ? html`
                  <div @click = '${this.onClearSearch}' style='margin-left:5px; cursor: pointer; align-self:center; color:var(--nav-text-color)' class='small-font-size primary-text bold-text'> CLEAR </div>`
                : ''
              }
            `
          }
          ${this.allowAdvancedSearch === 'false' || this.matchPaths
            ? ''
            : html`
              <button class="m-btn primary" part="btn btn-fill btn-search" style="margin-left:5px;" @click="${this.onShowSearchModalClicked}">
                Search
              </button>
            `
          }
        </div>
      `
    }
    ${html`<nav class='nav-scroll' part="navbar-scroll">
      ${(this.showInfo === 'false' || !this.resolvedSpec.info)
        ? ''
        : html`<div class='nav-bar-info'  id='link-overview' data-content-id='overview' @click = '${(e) => this.scrollToEventTarget(e, false)}'>
          ${this.isV1 && this.resolvedSpec.info.title || 'Overview'}
        </div>`
      }
    
      ${this.allowServerSelection === 'false'
        ? ''
        : html`<div class='nav-bar-info' id='link-servers' data-content-id='servers' @click = '${(e) => this.scrollToEventTarget(e, false)}'> API Servers </div>`
      }
      ${(this.allowAuthentication === 'false' || !this.resolvedSpec.securitySchemes)
        ? ''
        : html`<div class='nav-bar-info' id='link-auth' data-content-id='auth' @click = '${(e) => this.scrollToEventTarget(e, false)}'> Authentication </div>`
      }

      <slot name="nav-section" class="custom-nav-section" data-content-id='section' @click = '${(e) => this.scrollToEventTarget(e, false)}'></slot>

      <div class="sticky-scroll-element">
        <div class='nav-bar-section' part="navbar-operations-header">
          <slot name="operations-header">
            <div class='nav-bar-section-title'>OPERATIONS</div>  
          </slot>
          <div style="" part="navbar-operations-header-collapse">
            ${this.resolvedSpec.tags.length > 1
              ? html`
                ${this.operationsCollapsed
                  ? html`<div @click="${(e) => { expandCollapseAll.call(this, e); }}" style="font-size: 16px; transform: rotate(0deg); cursor: pointer;">▸</div>`
                  : html`<div @click="${(e) => { expandCollapseAll.call(this, e); }}" style="font-size: 16px;  transform: rotate(90deg); cursor: pointer;">▸</div>`
                }`
              : ''
            }  
          </div>
        </div>
      </div>

      <!-- TAGS AND PATHS-->
      ${this.resolvedSpec.tags
        .filter((tag) => tag.paths.filter((path) => pathIsInSearch(this.matchPaths, path)).length)
        .map((tag) => html`
          <slot name="nav-${tag.elementId}">
            <div class='nav-bar-tag-and-paths ${tag.expanded ? 'expanded' : 'collapsed'}'>
              ${tag.name === 'General ⦂'
                ? html``
                : html`
                  <div  class='nav-bar-tag' id="link-${tag.elementId}" data-content-id='${tag.elementId}'
                    @click='${() => { onExpandCollapse.call(this, tag.elementId); }}'>

                    <div style="display: flex; justify-content: space-between; width: 100%;">
                      <div>${tag.name}</div>
                      <div class="nav-bar-tag-icon expand-button-arrow">▸</div>
                      <div class="nav-bar-tag-icon collapse-button-arrow">▾</div>
                    </div>
                  </div>
                `
              }

              
              <div class='nav-bar-paths-under-tag'>
                <!-- Paths in each tag (endpoints) -->
                ${tag.paths.filter((v) => {
                  if (this.matchPaths) {
                    return pathIsInSearch(this.matchPaths, v);
                  }
                  return true;
                }).map((p) => html`
                <div class='nav-bar-path ${this.usePathInNavBar === 'true' ? 'small-font' : ''}'
                  data-content-id='${p.elementId}' id='link-${p.elementId}' @click = '${(e) => { this.scrollToEventTarget(e, false); }}'>
                  <span style="line-break: anywhere; ${p.deprecated ? 'filter:opacity(0.5)' : ''}">
                    ${this.usePathInNavBar === 'true'
                      ? html`<span class='mono-font'>${p.method.toUpperCase()} ${p.path}</span>`
                      : p.summary || p.shortSummary
                    }
                    ${p.isWebhook ? '(Webhook)' : ''}
                  </span>
                </div>`)}
              </div>
            </div>
          </slot>
        `)
      }

      <!-- COMPONENTS -->
      ${this.resolvedSpec.components && this.showComponents === 'true'
        ? html`
          <div class="sticky-scroll-element">
            <div id='link-components' class='nav-bar-section'>
              <div class='nav-bar-section-title'>COMPONENTS</div>
            </div>
          </div>
          ${this.resolvedSpec.components.map((component) => (component.subComponents.length
            ? html`
              <div class='nav-bar-tag' 
                data-content-id='cmp--${component.name.toLowerCase()}' 
                id='link-cmp--${component.name.toLowerCase()}' 
                @click='${(e) => this.scrollToEventTarget(e, false)}'>
                ${component.name}
              </div>
              ${component.subComponents.map((p) => html`
                <div class='nav-bar-path' data-content-id='cmp--${p.id}' id='link-cmp--${p.id}' @click='${(e) => this.scrollToEventTarget(e, false)}'>
                  <span> ${p.name} </span>
                </div>`)
              }`
            : ''))
          }`
        : ''
      }
    </nav>`
  }
</nav>
`;
}
/* eslint-enable indent */
