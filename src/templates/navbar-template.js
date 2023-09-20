import { html } from 'lit-element';
import { pathIsInSearch, invalidCharsRegEx } from '@/utils/common-utils';
import marked from 'marked';

export function expandCollapseNavBarTag(navLinkEl, action = 'toggle') {
  const tagAndPathEl = navLinkEl.closest('.nav-bar-tag-and-paths');
  if (tagAndPathEl) {
    const isExpanded = tagAndPathEl.classList.contains('expanded');
    if (isExpanded && (action === 'toggle' || action === 'collapse')) {
      tagAndPathEl.classList.replace('expanded', 'collapsed');
    } else if (!isExpanded && (action === 'toggle' || action === 'expand')) {
      tagAndPathEl.classList.replace('collapsed', 'expanded');
    }
  }
}

export function expandCollapseAll(navEl, action = 'expand-all') {
  const elList = [...navEl.querySelectorAll('.nav-bar-tag-and-paths')];
  if (action === 'expand-all') {
    elList.map((el) => {
      el.classList.replace('collapsed', 'expanded');
    });
  } else {
    elList.map((el) => {
      el.classList.replace('expanded', 'collapsed');
    });
  }
}

function onExpandCollapse(e) {
  expandCollapseNavBarTag(e.target, 'toggle');
}

function onExpandCollapseAll(e, action = 'expand-all') {
  expandCollapseAll(e.target.closest('.nav-scroll'), action);
}

/* eslint-disable indent */
export default function navbarTemplate() {
  return html`
  <aside class='nav-bar ${this.renderStyle}' >
    <div style="padding:16px 30px 0 16px;">
      <slot name="nav-logo" class="logo"></slot>
    </div>
    ${(this.allowSearch === 'false' && this.allowAdvancedSearch === 'false')
      ? ''
      : html`
        <div style="position:sticky; top:0; display:flex; flex-direction:row; align-items: stretch; justify-content:center; padding:24px; ${this.allowAdvancedSearch === 'false' ? 'border-bottom: 1px solid var(--nav-hover-bg-color)' : ''}">
          ${this.allowSearch === 'false'
            ? ''
            : html`
              <div style="display:flex; flex:1">
                <input id="nav-bar-search" 
                  style = "width:100%; padding-right:20px; color:var(--nav-hover-text-color); border-color:var(--nav-accent-color); background-color:var(--nav-hover-bg-color)" 
                  type = "text"
                  placeholder = "Quick Search" 
                  @change = "${this.onSearchChange}"  
                  spellcheck = "false" 
                >
                <div style="margin: 6px 5px 0 -24px; font-size:var(--title-font-size); cursor:pointer;">&#x21a9;</div>
              </div>  
              ${this.matchPaths
                ? html`
                  <div @click = '${this.onClearSearch}' style='margin-left:5px; cursor:pointer; align-self:center; color:var(--nav-text-color)' class='small-font-size primary-text bold-text'> CLEAR </div>`
                : ''
              }
            `
          }
          ${this.allowAdvancedSearch === 'false' || this.matchPaths
            ? ''
            : html`
              <button class="m-btn primary" style="margin-left:5px;" @click="${this.onShowSearchModalClicked}">
                ${this.allowSearch === 'false' ? 'Search' : 'Adv. Search'}
              </button>
            `
          }
        </div>
      `
    }
    ${html`<nav class='nav-scroll'>
      ${(this.showInfo === 'false' || !this.resolvedSpec.info)
        ? ''
        : html`
          ${(this.infoDescriptionHeadingsInNavBar === 'true')
            ? html`
              ${this.resolvedSpec.infoDescriptionHeaders.length > 0 ? html`<div class='nav-bar-info' id='link-overview' data-content-id='overview' @click = '${(e) => this.scrollToEl(e)}' > Overview </div>` : ''}          
              ${this.resolvedSpec.infoDescriptionHeaders.map((header) => html`
                <div class='nav-bar-h${header.depth}' id="link-overview--${new marked.Slugger().slug(header.text)}"  data-content-id='overview--${new marked.Slugger().slug(header.text)}' @click='${(e) => this.scrollToEl(e)}'>
                  ${header.text}
                </div>`)
              }
              ${this.resolvedSpec.infoDescriptionHeaders.length > 0 ? html`<hr style='border-top: 1px solid var(--nav-hover-bg-color); border-width:1px 0 0 0; margin: 15px 0 0 0'/>` : ''}
            `
            : html`<div class='nav-bar-info'  id='link-overview' data-content-id='overview' @click = '${(e) => this.scrollToEl(e)}' > Overview </div>`
          }
        `
      }
    
    ${(this.allowTry === 'false' || this.allowServerSelection === 'false')
      ? ''
      : html`<div class='nav-bar-info' id='link-api-servers' data-content-id='api-servers' @click = '${(e) => this.scrollToEl(e)}' > API Servers </div>`
    }
    ${(this.allowAuthentication === 'false' || !this.resolvedSpec.securitySchemes)
      ? ''
      : html`<div class='nav-bar-info' id='link-authentication' data-content-id='authentication' @click = '${(e) => this.scrollToEl(e)}' > Authentication </div>`
    }

    <div id='link-paths' class='nav-bar-section'>
      <div style="font-size:16px; display:flex; margin-left:10px;">
        ${this.renderStyle === 'focused'
          ? html`
            <div @click="${(e) => { onExpandCollapseAll.call(this, e, 'expand-all'); }}" title="Expand all" style="transform: rotate(90deg); cursor:pointer; margin-right:10px;">▸</div>
            <div @click="${(e) => { onExpandCollapseAll.call(this, e, 'collapse-all'); }}" title="Collapse all" style="transform: rotate(270deg); cursor:pointer;">▸</div>`
          : ''
        }  
      </div>
      <div class='nav-bar-section-title'> OPERATIONS </div>
    </div>
    ${this.resolvedSpec.tags.map((tag) => html`
      <!-- Tag -->
      <div class='nav-bar-tag-and-paths ${tag.expanded ? 'expanded' : 'collapsed'}'>
        <div class='nav-bar-tag' id="link-tag--${tag.name.replace(invalidCharsRegEx, '-')}" data-content-id='tag--${tag.name.replace(invalidCharsRegEx, '-')}' @click='${(e) => this.scrollToEl(e)}'>
          <div>${tag.name}</div>
          <div class="nav-bar-tag-icon" @click="${(e) => { onExpandCollapse.call(this, e); }}"></div>
        </div>
        <div class='nav-bar-paths-under-tag'>
          <!-- Paths in each tag (endpoints) -->
          ${tag.paths.filter((v) => {
            if (this.matchPaths) {
              return pathIsInSearch(this.matchPaths, v);
            }
            return true;
          }).map((p) => html`
          <div 
            class='nav-bar-path
            ${this.usePathInNavBar === 'true' ? 'small-font' : ''}'
            data-content-id='${p.method}-${p.path.replace(invalidCharsRegEx, '-')}'
            id='link-${p.method}-${p.path.replace(invalidCharsRegEx, '-')}'
            @click = '${(e) => this.scrollToEl(e)}'
          >
            <span style = "${p.deprecated ? 'filter:opacity(0.5)' : ''}">
              ${this.usePathInNavBar === 'true'
                ? html`<span class='mono-font'>${p.method.toUpperCase()} ${p.path}</span>`
                : p.summary
              }
            </span>
          </div>`)}
        </div>
      </div>
    `)}

    <!-- Components -->
    ${(this.showComponents === 'false' || !this.resolvedSpec.components)
    ? ''
    : html`
      <div id='link-components' class='nav-bar-section'>
        <div></div>
        <div class='nav-bar-section-title'>COMPONENTS</div>
      </div>
      ${this.resolvedSpec.components.map((component) => (component.subComponents.length ? html`
        <div class='nav-bar-tag' data-content-id='cmp-${component.name.toLowerCase()}' id='link-cmp-${component.name.toLowerCase()}' @click='${(e) => this.scrollToEl(e)}'>
          ${component.name}
        </div>
        ${component.subComponents.map((p) => html`
        <div class='nav-bar-path' data-content-id='cmp-${p.id}' id='link-cmp-${p.id}' @click='${(e) => this.scrollToEl(e)}'>
          <span> ${p.name} </span>
        </div>`)}
      ` : ''))}
    `}
    </nav>`
    }
  </aside>
`;
}
/* eslint-enable indent */
