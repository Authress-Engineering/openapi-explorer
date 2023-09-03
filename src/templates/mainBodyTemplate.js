import { html } from 'lit';

// Templates
import focusedEndpointTemplate from './focused-endpoint-template.js';
import overviewTemplate from './overview-template.js';
import endpointTemplate from './endpoint-template.js';
import serverTemplate from './server-template.js';
import securitySchemeTemplate from './security-scheme-template.js';
import navbarTemplate from './navbar-template.js';
import advancedSearchTemplate from './advance-search-template.js';
import SetTheme from '../utils/theme.js';
import ColorUtils from '../utils/color-utils.js';

export default function mainBodyTemplate() {
  const newTheme = {
    bg1: ColorUtils.isValidHexColor(this.bgColor) ? this.bgColor : '',
    bg2: ColorUtils.isValidHexColor(this.bgHeaderColor) ? this.bgHeaderColor : '',
    fg1: ColorUtils.isValidHexColor(this.textColor) ? this.textColor : '',
    primaryColor: ColorUtils.isValidHexColor(this.primaryColor) ? this.primaryColor : '#3E6077',
    secondaryColor: ColorUtils.isValidHexColor(this.secondaryColor) ? this.secondaryColor : '#FBAF0B',
    headerColor: ColorUtils.isValidHexColor(this.headerColor) ? this.headerColor : '',
    navBgColor: ColorUtils.isValidHexColor(this.navBgColor) ? this.navBgColor : '',
    navTextColor: ColorUtils.isValidHexColor(this.navTextColor) ? this.navTextColor : '',
    navHoverBgColor: ColorUtils.isValidHexColor(this.navHoverBgColor) ? this.navHoverBgColor : '',
    navHoverTextColor: ColorUtils.isValidHexColor(this.navHoverTextColor) ? this.navHoverTextColor : '',
  };

  /* eslint-disable indent */
  return html`
    ${SetTheme.call(this, newTheme)}
    
    <!-- Advanced Search -->
    ${this.hideSearch ? '' : advancedSearchTemplate.call(this)}

    <div id='the-main-body' class="body">
      <!-- Side Nav -->
      ${(this.renderStyle === 'focused' && this.resolvedSpec) ? navbarTemplate.call(this) : ''
      }

      <!-- Main Content -->
      ${this.loading === true
        ? html`<slot name="loader"><div class="loader"></div></slot>`
        : html`
        <main class="main-content regular-font" part="section-main-content">
          <slot></slot>
          <div id="operations-root" class="main-content-inner">
            ${this.loadFailed === true
              ? html`<div style="text-align: center;margin: 16px;">Unable to load the Spec${this.specUrl ? ': ' : ''}<strong>${this.specUrl}</strong></div>`
              : html`
                <div class="operations-root" @click="${(e) => { this.handleHref(e); }}">
                ${this.renderStyle === 'focused'
                  ? html`${focusedEndpointTemplate.call(this)}`
                  : html`
                    ${this.showInfo === 'true' ? overviewTemplate.call(this) : ''}
                    ${!this.hideServerSelection ? serverTemplate.call(this) : ''}
                    ${!this.hideAuthentication ? securitySchemeTemplate.call(this) : ''}
                    <section id='section'
                      class='observe-me ${this.renderStyle === 'focused' ? 'section-gap--focused-mode' : 'section-gap'}'>
                      <slot name="custom-section"></slot>
                    </section>
                    ${endpointTemplate.call(this)}`
                }
                </div>
              `
            }`
          }
        </div>
        <slot name="footer"></slot>
      </main>
    </div>  
  `;
}
/* eslint-enable indent */
