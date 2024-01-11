import { html } from 'lit';
import { marked } from 'marked';
import { componentIsInSearch, pathIsInSearch } from '../utils/common-utils.js';
import { getI18nText } from '../languages/index.js';
import { expandCollapseComponent } from './endpoint-template.js';
import { getComponentInfo } from './components-template.js';

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
  this.resolvedSpec.tags.forEach((tag) => { tag.expanded = expand; });
  this.requestUpdate();
}

export function expandCollapseAllComponents() {
  const expand = this.componentsCollapsed;
  this.componentsCollapsed = !expand;
  this.resolvedSpec.components.forEach((component) => { component.expanded = expand; });
  this.requestUpdate();
}

/* eslint-disable indent */
export default function navbarTemplate() {
  return html`
  <nav class='nav-bar ${this.renderStyle}' part="section-navbar">
    <slot name="nav-header"></slot>
    ${this.hideSearch ? ''
      : html`
        <div style="display:flex; flex-direction:row; justify-content:center; align-items:center; padding:24px;">
          <div style="display:flex; flex:1; line-height:22px;">
            <input id="nav-bar-search" 
              part = "textbox textbox-nav-filter"
              style = "width:100%; padding-right:20px; color:var(--nav-hover-text-color); border-color:var(--secondary-color); background-color:var(--nav-hover-bg-color)" 
              type = "text"
              placeholder = "${getI18nText('menu.filter')}"
              @input = "${this.onSearchChange}"  
              spellcheck = "false">
          </div>
          <button class="m-btn outline-primary" part="btn btn-fill btn-search" style="margin-left:5px;" @click="${this.onShowSearchModalClicked}">
            ${getI18nText('menu.search')}
          </button>
        </div>
      `
    }
    ${html`<nav class='nav-scroll' part="navbar-scroll">
      ${(this.hideInfo || !this.resolvedSpec.info)
        ? ''
        : html`<div class='nav-bar-info'  id='link-overview' data-content-id='overview' @click = '${(e) => this.scrollToEventTarget(e, false)}'>
          ${this.resolvedSpec.info.title || getI18nText('menu.overview')}
        </div>`
      }
    
      ${this.hideServerSelection
        ? ''
        : html`<div class='nav-bar-info' id='link-servers' data-content-id='servers' @click = '${(e) => this.scrollToEventTarget(e, false)}'> ${getI18nText('menu.api-servers')} </div>`
      }
      ${(this.hideAuthentication || !this.resolvedSpec.securitySchemes)
        ? ''
        : html`<div class='nav-bar-info' id='link-auth' data-content-id='auth' @click = '${(e) => this.scrollToEventTarget(e, false)}'> ${getI18nText('menu.authentication')} </div>`
      }

      <slot name="nav-section" class="custom-nav-section" data-content-id='section' @click = '${(e) => this.scrollToCustomNavSectionTarget(e, false)}'></slot>

      <div class="sticky-scroll-element ${this.operationsCollapsed ? 'collapsed' : ''}" @click="${() => { expandCollapseAll.call(this); }}">
        <div class='nav-bar-section' part="navbar-operations-header">
          <slot name="operations-header">
            <div class='nav-bar-section-title'>${getI18nText('menu.operations')}</div>  
          </slot>
          <div style="" part="navbar-operations-header-collapse">
            ${this.resolvedSpec.tags.length > 1 && this.resolvedSpec.tags.some((tag) => !tag.paths.length && !this.matchPaths || tag.paths.some((path) => pathIsInSearch(this.matchPaths, path)))
              ? html`
                <div class="toggle">▾</div>`
              : ''
            }  
          </div>
        </div>
      </div>

      <!-- TAGS AND PATHS-->
      ${this.resolvedSpec.tags
        .filter((tag) => !tag.paths.length && !this.matchPaths || tag.paths.some((path) => pathIsInSearch(this.matchPaths, path)))
        .map((tag) => html`
          <slot name="nav-${tag.elementId}">
            <div class='nav-bar-tag-and-paths ${tag.expanded ? '' : 'collapsed'}'>
              ${tag.name === 'General ⦂'
                ? html``
                : html`
                  <div class='nav-bar-tag' id="link-${tag.elementId}" data-content-id='${tag.elementId}'
                    @click='${() => { onExpandCollapse.call(this, tag.elementId); }}'>

                    <div style="display: flex; justify-content: space-between; width: 100%;">
                      <div style="margin-right: .5rem">${tag.name}</div>
                      <div class="toggle">▾</div>
                    </div>
                  </div>
                `
              }

              <div class="nav-bar-section-wrapper">
                <div>
                  ${tag.headers.map((header) => html`
                    <div 
                      class='nav-bar-h${header.depth}' 
                      id="link-${tag.elementId}--${new marked.Slugger().slug(header.text)}"  
                      data-content-id='${tag.elementId}--${new marked.Slugger().slug(header.text)}' 
                      @click='${(e) => this.scrollToEventTarget(e, false)}'>
                      ${header.text}
                    </div>`
                  )}
                </div>
                <div class='nav-bar-paths-under-tag'>
                  <!-- Paths in each tag (endpoints) -->
                  ${tag.paths.filter((v) => pathIsInSearch(this.matchPaths, v)).map((p) => html`
                  <div class='nav-bar-path ${this.usePathInNavBar ? 'small-font' : ''}'
                    data-content-id='${p.elementId}' id='link-${p.elementId}' @click = '${(e) => { this.scrollToEventTarget(e, false); }}'>
                    <span style="${p.deprecated ? 'filter:opacity(0.5)' : ''}">
                      ${this.usePathInNavBar
                        ? html`<div class='mono-font' style="display: flex; align-items: center;">
                            <div class="method ${p.method}"><span style="line-height: 1;">${p.method}</span></div> 
                            <div style="display: flex; flex-wrap: wrap;">${p.path.split('/').filter(t => t.trim()).map(t => html`<span>/${t}</span>`)}</div>
                          </div>`
                        : p.summary || p.shortSummary
                      }
                      ${p.isWebhook ? '(Webhook)' : ''}
                    </span>
                  </div>`)}
                </div>
              </div>
            </div>
          </slot>
        `)
      }

      <!-- COMPONENTS -->
      ${this.resolvedSpec.components?.length && !this.hideComponents
        ? html`
          <div class="sticky-scroll-element"">
            <div id='link-components' class='nav-bar-section'>
              <slot name="components-header">
                <div class='nav-bar-section-title'>${getI18nText('menu.components')}</div>
              </slot>
            </div>
          </div>

          ${this.resolvedSpec.components.filter((c) => c.subComponents.some(s => componentIsInSearch(this.matchPaths, s))).map((component) => {
            const componentInfo = getComponentInfo(component.componentKeyId);
            return html`
              <div class="nav-bar-tag-and-paths ${component.expanded ? '' : 'collapsed'}">
                <div class='nav-bar-tag'
                  data-content-id='cmp--${componentInfo.name.toLowerCase()}' 
                  id='link-cmp--${componentInfo.name.toLowerCase()}' 
                  @click="${(e) => {
                    expandCollapseComponent.call(this, component);
                    this.scrollToEventTarget(e, false);
                  }}">
                  <div>
                    ${componentInfo.name}
                  </div>

                  <div style="" part="navbar-components-header-collapse">
                    <div class="toggle">▾</div>
                  </div>
                </div>

                <div class="nav-bar-section-wrapper">
                  <div class="nav-bar-paths-under-tag">
                    ${component.subComponents.filter(s => componentIsInSearch(this.matchPaths, s)).map((p) => html`
                      <div class='nav-bar-path' data-content-id='cmp--${p.id}' id='link-cmp--${p.id}' @click='${(e) => this.scrollToEventTarget(e, false)}'>
                        <span> ${p.name} </span>
                      </div>`
                    )}
                  </div>
                </div>
              </div>`;
          })}`
        : ''
      }
    </nav>`
  }
</nav>
`;
}
/* eslint-enable indent */
