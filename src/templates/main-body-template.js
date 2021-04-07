import { html } from 'lit-element';

// Templates
import expandedEndpointTemplate from './expanded-endpoint-template';
import focusedEndpointTemplate from './focused-endpoint-template';
import overviewTemplate from './overview-template';
import endpointTemplate from './endpoint-template';
import serverTemplate from './server-template';
import securitySchemeTemplate from './security-scheme-template';
import navbarTemplate from './navbar-template';
import advancedSearchTemplate from './advance-search-template';
import SetTheme from '../utils/theme';
import ColorUtils from '../utils/color-utils';

export default function mainBodyTemplate() {
  const newTheme = {
    bg1: ColorUtils.isValidHexColor(this.bgColor) ? this.bgColor : '',
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
    ${SetTheme.call(this, newTheme, this.disableDefaultColors)}
    
    <!-- Advanced Search -->
    ${this.allowAdvancedSearch === 'false' ? '' : advancedSearchTemplate.call(this)}

    <div id='the-main-body' class="body">
      <!-- Side Nav -->
      ${((this.renderStyle === 'read' || this.renderStyle === 'focused')
          && this.showSideNav === 'true'
          && this.resolvedSpec
        ) ? navbarTemplate.call(this) : ''
      }

      <!-- Main Content -->
      ${this.loading === true
        ? html`<slot name="loader"><div class="loader"></div></slot>`
        : html`
        <main class="main-content regular-font" part="section-main-content">
          <slot></slot>
          <div class="main-content-inner">
            ${this.loadFailed === true
              ? html`<div style="text-align: center;margin: 16px;">Unable to load the Spec${this.specUrl ? ': ' : ''}<strong>${this.specUrl}</strong></div>`
              : html`
                <div class="operations-root" @click="${(e) => { this.handleHref(e); }}">
                ${this.renderStyle === 'focused'
                  ? html`${focusedEndpointTemplate.call(this)}`
                  : html`
                    ${this.showInfo === 'true' ? overviewTemplate.call(this) : ''}
                    ${this.allowServerSelection === 'true' ? serverTemplate.call(this) : ''}
                    ${this.allowAuthentication === 'true' ? securitySchemeTemplate.call(this) : ''}
                    ${this.renderStyle === 'read'
                      ? expandedEndpointTemplate.call(this)
                      : endpointTemplate.call(this)
                    }
                  `
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
