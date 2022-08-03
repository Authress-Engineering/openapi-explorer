import { html } from 'lit-element';
import { expandedEndpointBodyTemplate } from './expanded-endpoint-template';
import '../components/api-request';
import '../components/api-response';
import componentsTemplate from './components-template';
import overviewTemplate from './overview-template';
import serverTemplate from './server-template';
import securitySchemeTemplate from './security-scheme-template';

function wrapFocusedTemplate(templateToWrap) {
  return html`
    <div class='regular-font section-gap--focused-mode' part="section-operations-in-tag">
      ${templateToWrap}
    </div>`;
}

function defaultContentTemplate() {
  // In focused mode default content is overview or first path
  if (this.showInfo === 'true') {
    return overviewTemplate.call(this);
  }
  const selectedTagObj = this.resolvedSpec.tags[0];
  const selectedPathObj = selectedTagObj && selectedTagObj.paths[0];
  return (selectedTagObj && selectedPathObj)
    ? wrapFocusedTemplate(expandedEndpointBodyTemplate.call(this, selectedPathObj, selectedTagObj.name))
    : wrapFocusedTemplate('');
}

/* eslint-disable indent */
function focusedTagBodyTemplate(tag) {
  return html`<h1 id="${tag.elementId}">${tag.name}</h1>`;
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
  if (focusElId.startsWith('overview') && this.showInfo === 'true') {
    focusedTemplate = overviewTemplate.call(this);
  } else if (focusElId === 'auth' && this.allowAuthentication === 'true') {
    focusedTemplate = securitySchemeTemplate.call(this);
  } else if (focusElId === 'servers' && this.allowServerSelection === 'true') {
    focusedTemplate = serverTemplate.call(this);
  } else if (focusElId.startsWith('section')) {
    focusedTemplate = html`
      <section id='section' class='observe-me'>
        <slot name="custom-section"></slot>
      </section>`;
  } else if (focusElId.startsWith('cmp--') && !this.hideComponents) {
    focusedTemplate = componentsTemplate.call(this);
  } else if (focusElId.startsWith('tag--')) {
    const idToFocus = focusElId.indexOf('--', 4) > 0 ? focusElId.substring(0, focusElId.indexOf('--', 5)) : focusElId;
    selectedTagObj = this.resolvedSpec.tags.find((v) => v.elementId === idToFocus);
    if (selectedTagObj) {
      focusedTemplate = wrapFocusedTemplate.call(this, focusedTagBodyTemplate.call(this, selectedTagObj));
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
