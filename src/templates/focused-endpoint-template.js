import { html } from 'lit';
import { expandedEndpointBodyTemplate, expandedTagTemplate } from './expanded-endpoint-template.js';
import '../components/api-request.js';
import '../components/api-response.js';
import componentsTemplate from './components-template.js';
import overviewTemplate from './overview-template.js';
import serverTemplate from './server-template.js';
import securitySchemeTemplate from './security-scheme-template.js';

function wrapFocusedTemplate(templateToWrap) {
  return html`
    <div class='regular-font section-gap--focused-mode' part="section-operations-in-tag">
      ${templateToWrap}
    </div>`;
}

function defaultContentTemplate() {
  // In focused mode default content is overview or first path
  if (!this.hideInfo) {
    return overviewTemplate.call(this);
  }
  const selectedTagObj = this.resolvedSpec.tags[0];
  const selectedPathObj = selectedTagObj?.paths[0];
  return (selectedPathObj)
    ? wrapFocusedTemplate(expandedEndpointBodyTemplate.call(this, selectedPathObj, selectedTagObj.name))
    : wrapFocusedTemplate('');
}

export default function focusedEndpointTemplate() {
  if (!this.explorerLocation || !this.resolvedSpec) {
    return undefined;
  }
  const focusElId = this.explorerLocation;
  let selectedPathObj = null;
  let selectedTagObj = null;
  let focusedTemplate;
  let i = 0;
  if (focusElId.startsWith('overview') && !this.hideInfo) {
    focusedTemplate = overviewTemplate.call(this);
  } else if (focusElId === 'auth' && !this.hideAuthentication) {
    focusedTemplate = securitySchemeTemplate.call(this);
  } else if (focusElId === 'servers' && !this.hideServerSelection) {
    focusedTemplate = serverTemplate.call(this);
  } else if (focusElId.startsWith('section')) {
    focusedTemplate = html`
      <section id='section' class='observe-me'>
        <slot class="conditional-custom-section custom-section" name="custom-section"></slot>
      </section>`;
  } else if (focusElId.startsWith('cmp--') && !this.hideComponents) {
    focusedTemplate = componentsTemplate.call(this);
  } else if (focusElId.startsWith('tag--')) {
    const idToFocus = focusElId.indexOf('--', 4) > 0 ? focusElId.substring(0, focusElId.indexOf('--', 5)) : focusElId;
    selectedTagObj = this.resolvedSpec.tags.find((v) => v.elementId === idToFocus);
    if (selectedTagObj) {
      focusedTemplate = expandedTagTemplate.call(this, idToFocus, focusElId);
    } else {
      focusedTemplate = defaultContentTemplate.call(this);
    }
  } else {
    for (i = 0; i < this.resolvedSpec.tags.length; i += 1) {
      selectedTagObj = this.resolvedSpec.tags[i];
      selectedPathObj = this.resolvedSpec.tags[i].paths.find((v) => `${v.elementId}` === focusElId);
      if (selectedPathObj) {
        break;
      }
    }
    if (selectedPathObj) {
      focusedTemplate = wrapFocusedTemplate.call(this, expandedEndpointBodyTemplate.call(this, selectedPathObj, selectedTagObj.name));
    } else {
      // if explorerLocation is not found then show the default content (overview or first-path)
      focusedTemplate = defaultContentTemplate.call(this);
    }
  }
  return focusedTemplate;
}
/* eslint-enable indent */
