import { css, LitElement, unsafeCSS } from 'lit-element';
import { marked } from 'marked';
import Prism from 'prismjs';

// It's possible none of these imports are actually necessary and should just be removed
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-http';
import 'prismjs/components/prism-csharp';

// Styles
import FontStyles from './styles/font-styles';
import InputStyles from './styles/input-styles';
import FlexStyles from './styles/flex-styles';
import TableStyles from './styles/table-styles';
import EndpointStyles from './styles/endpoint-styles';
import PrismStyles from './styles/prism-styles';
import TabStyles from './styles/tab-styles';
import NavStyles from './styles/nav-styles';
import InfoStyles from './styles/info-styles';
import advancedSearchStyles from './styles/advanced-search-styles';

import { advancedSearch, getCurrentElement, replaceState, sleep, initI18n, isI18nReady, changeI18nLang } from './utils/common-utils';
import ProcessSpec from './utils/spec-parser';
import responsiveViewMainBodyTemplate from './templates/responsiveViewMainBodyTemplate';
import apiRequestStyles from './styles/api-request-styles';
import { checkForAuthToken } from './templates/security-scheme-template';

export default class OpenApiExplorer extends LitElement {
  constructor() {
    super();
    this.isV1 = false;
    this.loading = true;
    const intersectionObserverOptions = {
      root: this.getRootNode().host,
      rootMargin: '-50px 0px -50px 0px', // when the element is visible 100px from bottom
      threshold: 0,
    };
    this.isIntersectionObserverActive = true;
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver((entries) => { this.onIntersect(entries); }, intersectionObserverOptions);
    } else {
      this.intersectionObserver = { disconnect() {}, observe() {} };
    }
  }

  static get properties() {
    return {
      // Heading
      headingText: { type: String, attribute: 'heading-text' },
      explorerLocation: { type: String, attribute: 'explorer-location' },

      // Spec
      specUrl: { type: String, attribute: 'spec-url' },

      // UI Layouts
      layout: { type: String },

      collapsed: { type: Boolean, attribute: 'collapse' },
      operationsCollapsed: { type: Boolean },
      componentsCollapsed: { type: Boolean },

      defaultSchemaTab: { type: String, attribute: 'default-schema-tab' },
      responseAreaHeight: { type: String, attribute: 'response-area-height' },
      fillRequestWithDefault: { type: String, attribute: 'fill-defaults' },

      // Schema Styles
      displaySchemaAsTable: { type: Boolean, attribute: 'table' },
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },

      // API Server
      serverUrl: { type: String, attribute: 'server-url' },

      // Hide/Show Sections & Enable Disable actions
      showInfo: { type: String, attribute: 'show-info' },
      allowAuthentication: { type: String, attribute: 'show-authentication' },
      allowTry: { type: String, attribute: 'enable-console' },
      includeNulls: { type: Boolean, attribute: 'display-nulls' },
      allowSearch: { type: String, attribute: 'allow-search' },
      allowAdvancedSearch: { type: String, attribute: 'allow-advanced-search' },
      allowServerSelection: { type: String, attribute: 'show-server-selection' },
      hideComponents: { type: Boolean, attribute: 'hide-components' },

      // Main Colors and Font
      primaryColor: { type: String, attribute: 'primary-color' },
      secondaryColor: { type: String, attribute: 'secondary-color' },
      bgColor: { type: String, attribute: 'bg-color' },
      textColor: { type: String, attribute: 'text-color' },
      headerColor: { type: String, attribute: 'header-color' },
      fontSize: { type: String, attribute: 'font-size' },

      // Nav Bar Colors
      navBgColor: { type: String, attribute: 'nav-bg-color' },
      navTextColor: { type: String, attribute: 'nav-text-color' },
      navHoverBgColor: { type: String, attribute: 'nav-hover-bg-color' },
      navHoverTextColor: { type: String, attribute: 'nav-hover-text-color' },
      navItemSpacing: { type: String, attribute: 'nav-item-spacing' },
      usePathInNavBar: { type: String, attribute: 'use-path-in-nav-bar' },

      // Fetch Options
      fetchCredentials: { type: String, attribute: 'fetch-credentials' },

      // Filters
      matchPaths: { type: String, attribute: 'match-paths' },

      // Internal Properties
      loading: { type: Boolean }, // indicates spec is being loaded
      showAdvancedSearchDialog: { type: Boolean },
      advancedSearchMatches: { type: Object }
    };
  }

  static get styles() {
    return [
      FontStyles,
      InputStyles,
      FlexStyles,
      TableStyles,
      EndpointStyles,
      PrismStyles,
      TabStyles,
      NavStyles,
      InfoStyles,
      advancedSearchStyles,
      apiRequestStyles,
      css`
      *:not(:defined) { display:none }

      :host {
        display:flex;
        flex-direction: column;
        width:100%;
        height:100%;
        margin:0;
        padding:0;
        overflow: hidden;
        letter-spacing:normal;
        color:var(--fg);
        background-color:var(--bg);
        font-family: var(--font-regular);
      }
      .body {
        display:flex;
        height:100%;
        width:100%;
        overflow:hidden;
      }

      .main-content { 
        margin:0;
        padding: 0; 
        display:block;
        flex:1;
        height:100%;
        overflow-y: overlay;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: var(--border-color) transparent;
      }

      .main-content::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .main-content::-webkit-scrollbar-track {
        background:transparent;
      }
      .main-content::-webkit-scrollbar-thumb {
        background-color: var(--border-color);
      }

      .section-gap.section-tag {
        border-bottom:1px solid var(--border-color);
      }
      .method-section-gap {
        padding: 24px 8px 0px 4px;
      }
      .section-gap { 
        padding: 24px 0px 0px;
      }
      .section-tag-header {
        position:relative;
        cursor: n-resize;
        padding: 12px 0;
      }
      .collapsed .section-tag-header:hover{
        cursor: s-resize;
      }

      .section-tag-header:hover{
        background-image: linear-gradient(to right, rgba(0,0,0,0), var(--border-color), rgba(0,0,0,0));
      }

      .collapsed .section-tag-header:hover::after {
        color:var(--primary-color);
      }

      .collapsed .section-tag-body {
        display:none;
      }

      .logo {
        height:36px;
        width:36px;
        margin-left:5px; 
      }
      .only-large-screen-flex,
      .only-large-screen{
        display:none;
      }
      .header-title{
        font-size:calc(var(--font-size-regular) + 8px); 
        padding:0 8px;
      }
      .tag.title {
        text-transform: uppercase;
      }
      .header{
        background-color:var(--header-bg);
        color:var(--header-fg);
        width:100%;
      }

      input.header-input{
        background:var(--header-color-darker);
        color:var(--header-fg);
        border:1px solid var(--header-color-border);
        flex:1; 
        padding-right:24px;
        border-radius:3px;
      }
      input.header-input::placeholder {
        opacity:0.4;
      }
      input:disabled {
        cursor: not-allowed;
      }
      .loader {
        margin: 16px auto 16px auto; 
        border: 4px solid var(--bg3);
        border-radius: 50%;
        border-top: 4px solid var(--primary-color);
        width: 36px;
        height: 36px;
        animation: spin 2s linear infinite;
      }
      .expanded-endpoint-body{ 
        position: relative;
        padding: 6px 0px; 
      }
      .divider { 
        border-top: 2px solid var(--border-color);
        margin: 24px 0;
        width:100%;
      }

      .tooltip {
        border: 1px solid var(--border-color);
        border-left-width: 4px;
        margin-left:2px;
      }
      .tooltip a {
        color: var(--fg2);
        text-decoration: none;
      }
      .tooltip-text {
        color: var(--fg2);
        background-color: var(--bg2);
        visibility: hidden;
        overflow-wrap: break-word;
      }
      .tooltip:hover {
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
      .tooltip:hover a:hover {
        color: var(--primary-color);
      }

      .tooltip:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @media only screen and (max-width: 767.98px) {
        .section-padding {
          // margin-right: 1rem;
          margin: 1rem;
        }

        .sub-title.tag {
          margin-left: 1rem;
        }
        .section-tag-body .description {
          margin-left: 1rem;
          margin-right: 1rem;
        }
      }

      @media only screen and (min-width: 768px) {
        .nav-bar {
          width: 260px;
          display:flex;
        }
        .only-large-screen{
          display:block;
        }
        .only-large-screen-flex{
          display:flex;
        }
        .section-gap {
          padding: 24px 24px; 
        }
        .section-gap--read-mode { 
          padding: 24px 8px; 
        }
        .section-gap--focused-mode {
          padding: 1.5rem;
        }
        .endpoint-body {
          position: relative;
          padding:36px 0 48px 0;
        }
      }

      @media only screen and (min-width: 1024px) {
        .nav-bar {
          width: ${unsafeCSS(this.fontSize === 'default' ? '300px' : this.fontSize === 'large' ? '315px' : '330px')};
          display:flex;
        }
        .section-gap--read-mode { 
          padding: 24px 24px 12px;
        }
        .main-content-inner {
          padding: 24px;
        }
      }`,
    ];
  }

  // Startup
  connectedCallback() {
    super.connectedCallback();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.loading = true;
    initI18n();
    const parent = this.parentElement;
    if (parent) {
      if (parent.offsetWidth === 0 && parent.style.width === '') {
        parent.style.width = '100vw';
      }
      if (parent.offsetHeight === 0 && parent.style.height === '') {
        parent.style.height = '100vh';
      }
      if (parent.tagName === 'BODY') {
        if (!parent.style.marginTop) { parent.style.marginTop = '0'; }
        if (!parent.style.marginRight) { parent.style.marginRight = '0'; }
        if (!parent.style.marginBottom) { parent.style.marginBottom = '0'; }
        if (!parent.style.marginLeft) { parent.style.marginLeft = '0'; }
      }
    }

    this.renderStyle = 'focused';
    this.operationsCollapsed = this.collapsed;
    this.componentsCollapsed = this.collapsed;
    this.explorerLocation = this.explorerLocation || getCurrentElement();

    if (!this.defaultSchemaTab || !'body, model,'.includes(`${this.defaultSchemaTab},`)) { this.defaultSchemaTab = 'model'; }
    if (!this.schemaExpandLevel || this.schemaExpandLevel < 1) { this.schemaExpandLevel = 99999; }
    this.schemaHideReadOnly = ['post', 'put', 'patch'].join(',');
    this.schemaHideWriteOnly = true;
    if (!this.fillRequestWithDefault || !'true, false,'.includes(`${this.fillRequestWithDefault},`)) { this.fillRequestWithDefault = 'true'; }
    if (!this.responseAreaHeight) {
      this.responseAreaHeight = '300px';
    }

    if (!this.allowSearch || !'true, false,'.includes(`${this.allowSearch},`)) { this.allowSearch = 'true'; }
    if (!this.allowAdvancedSearch || !'true, false,'.includes(`${this.allowAdvancedSearch},`)) { this.allowAdvancedSearch = 'true'; }

    if (!this.allowTry || !'true, false,'.includes(`${this.allowTry},`)) { this.allowTry = 'true'; }

    if (!this.navItemSpacing || !'compact, relaxed, default,'.includes(`${this.navItemSpacing},`)) { this.navItemSpacing = 'default'; }
    if (!this.usePathInNavBar || !'true, false,'.includes(`${this.usePathInNavBar},`)) { this.usePathInNavBar = 'false'; }
    if (!this.fontSize || !'default, large, largest,'.includes(`${this.fontSize},`)) { this.fontSize = 'default'; }

    if (!this.showInfo || !'true, false,'.includes(`${this.showInfo},`)) { this.showInfo = 'true'; }
    if (!this.allowServerSelection || !'true, false,'.includes(`${this.allowServerSelection},`)) { this.allowServerSelection = 'true'; }
    if (!this.allowAuthentication || !'true, false,'.includes(`${this.allowAuthentication},`)) { this.allowAuthentication = 'true'; }

    if (!this.fetchCredentials || !'omit, same-origin, include,'.includes(`${this.fetchCredentials},`)) { this.fetchCredentials = ''; }

    if (!this.showAdvancedSearchDialog) { this.showAdvancedSearchDialog = false; }

    marked.setOptions({
      highlight(code, lang) {
        if (Prism.languages[lang]) {
          return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
      },
    });

    window.addEventListener('hashchange', () => {
      this.scrollTo(getCurrentElement());
    }, true);
    this.handleResize();
  }

  // Cleanup
  disconnectedCallback() {
    this.intersectionObserver.disconnect();
    window.removeEventListener('resize', this.handleResize);
    super.disconnectedCallback();
  }

  render() {
    return responsiveViewMainBodyTemplate.call(this);
  }

  observeExpandedContent() {
    // Main Container
    const observeOverviewEls = this.shadowRoot.querySelectorAll('.observe-me');
    observeOverviewEls.forEach((targetEl) => {
      this.intersectionObserver.observe(targetEl);
    });
  }

  handleResize() {
    const mediaQueryResult = window.matchMedia('(min-width: 768px)');
    const newDisplay = mediaQueryResult.matches ? 'focused' : 'view';
    if (this.renderStyle !== newDisplay) {
      this.renderStyle = newDisplay;
      this.requestUpdate();
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'spec-url') {
      if (oldVal !== newVal) {
        window.setTimeout(async () => {
          await this.loadSpec(newVal);
          // If the initial location is set, then attempt to scroll there
          if (this.explorerLocation) {
            this.scrollTo(this.explorerLocation);
          }
        }, 0);
      }
    }

    if (name === 'render-style') {
      if (newVal === 'read') {
        window.setTimeout(() => {
          this.observeExpandedContent();
        }, 100);
      } else {
        this.intersectionObserver.disconnect();
      }
    }
    if (name === 'explorer-location') {
      window.setTimeout(() => {
        this.scrollTo(newVal);
      }, 0);
    }

    if (name === 'collapsed') {
      this.operationsCollapsed = newVal;
      this.componentsCollapsed = newVal;
    }
    super.attributeChangedCallback(name, oldVal, newVal);
  }

  onSearchChange(e) {
    this.matchPaths = e.target.value;
    this.requestUpdate();
  }

  onClearSearch() {
    const searchEl = this.shadowRoot.getElementById('nav-bar-search');
    searchEl.value = '';
    this.matchPaths = '';
  }

  async onShowSearchModalClicked() {
    this.showAdvancedSearchDialog = true;
    // wait for the dialog to render
    await sleep(10);
    const inputEl = this.shadowRoot.getElementById('advanced-search-dialog-input');
    if (inputEl) {
      inputEl.focus();
    }
  }

  // Public Method
  async loadSpec(specUrlOrObject) {
    if (!specUrlOrObject) {
      return;
    }
    this.matchPaths = '';
    try {
      this.resolvedSpec = null;
      this.loading = true;
      this.loadFailed = false;
      const spec = await ProcessSpec(specUrlOrObject, this.serverUrl);
      this.loading = false;
      if (spec === undefined || spec === null) {
        console.error('Unable to resolve the API spec. '); // eslint-disable-line no-console
        return;
      }
      if (!this.serverUrl) {
        this.serverUrl = spec.servers[0].computedUrl || spec.servers[0].url;
      }
      this.selectedServer = spec.servers.find((s) => s.url === this.serverUrl || !this.serverUrl) || spec.servers[0];
      this.afterSpecParsedAndValidated(spec);
    } catch (err) {
      this.loading = false;
      this.loadFailed = true;
      this.resolvedSpec = null;
      console.error('OpenAPI Explorer: Unable to resolve the API spec..', err); // eslint-disable-line no-console
    }
  }

  // Public Method
  async setAuthenticationConfiguration(apiKeyId, { token, clientId, clientSecret, redirectUri }) {
    const securityObj = this.resolvedSpec && this.resolvedSpec.securitySchemes.find((v) => (v.apiKeyId === apiKeyId));
    if (!securityObj) {
      throw Error('SecuritySchemeNotFound');
    }

    let authorizationToken = token && token.replace(/^(Bearer|Basic)\s+/i, '').trim();
    if (authorizationToken && securityObj.type && securityObj.type === 'http' && securityObj.scheme && securityObj.scheme.toLowerCase() === 'basic') {
      authorizationToken = `Basic ${btoa(authorizationToken)}`;
    } else if (authorizationToken && securityObj.scheme && securityObj.scheme.toLowerCase() === 'bearer') {
      authorizationToken = `Bearer ${authorizationToken}`;
    } else {
      authorizationToken = null;
    }

    securityObj.clientId = clientId && clientId.trim();
    securityObj.clientSecret = clientSecret && clientSecret.trim();
    securityObj.redirectUri = new URL(redirectUri && redirectUri.trim() || '', window.location.href).toString();

    securityObj.finalKeyValue = authorizationToken;
    await checkForAuthToken.call(this);
    this.requestUpdate();
  }

  afterSpecParsedAndValidated(spec) {
    this.resolvedSpec = spec;

    if (this.operationsCollapsed) {
      this.resolvedSpec.tags.forEach(t => t.expanded = false);
    }
    if (this.componentsCollapsed) {
      this.resolvedSpec.components.forEach(c => c.expanded = false);
    }

    this.dispatchEvent(new CustomEvent('spec-loaded', { bubbles: true, detail: spec }));
    this.requestUpdate();

    // Initiate IntersectionObserver and put it at the end of event loop, to allow loading all the child elements (must for larger specs)
    this.intersectionObserver.disconnect();

    if (this.renderStyle === 'focused') {
      const defaultElementId = this.showInfo ? 'overview' : this.resolvedSpec.tags && this.resolvedSpec.tags[0] && this.resolvedSpec.tags[0].paths[0];
      this.scrollTo(this.explorerLocation || defaultElementId);
    }

    if (this.renderStyle === 'view' && this.explorerLocation) {
      this.expandAndGotoOperation(this.explorerLocation);
    }
  }

  expandAndGotoOperation(elementId) {
    // Expand full operation and tag
    let isExpandingNeeded = false;
    
    const tag = this.resolvedSpec.tags.find(t => t.paths && t.paths.find(p => p.elementId === elementId));
    const path = tag && tag.paths && tag.paths.find((p) => p.elementId === elementId);
    if (path && (!path.expanded || !tag.expanded)) {
      isExpandingNeeded = true;
      path.expanded = true;
      tag.expanded = true;
      this.requestUpdate();
    }

    // requestUpdate() and delay required, else we cant find element because it won't exist immediately
    const tmpElementId = elementId.indexOf('#') === -1 ? elementId : elementId.substring(1);
    window.setTimeout(() => {
      const gotoEl = this.shadowRoot.getElementById(tmpElementId);
      if (gotoEl) {
        gotoEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        replaceState(tmpElementId);
      }
    }, isExpandingNeeded ? 150 : 0);
  }

  isValidTopId(id) {
    return (id.startsWith('overview') || id === 'servers' || id === 'auth');
  }

  isValidPathId(id) {
    if (id === 'overview' && this.showInfo) {
      return true;
    }
    if (id === 'servers' && this.allowServerSelection) {
      return true;
    }
    if (id === 'auth' && this.allowAuthentication) {
      return true;
    }
    if (id.startsWith('tag--')) {
      return this.resolvedSpec.tags && this.resolvedSpec.tags.find((tag) => tag.elementId === id);
    }
    return this.resolvedSpec.tags && this.resolvedSpec.tags.find((tag) => tag.paths.find((path) => path.elementId === id));
  }

  onIntersect(entries) {
    if (this.isIntersectionObserverActive === false) {
      return;
    }
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0) {
        const oldNavEl = this.shadowRoot.querySelector('.nav-bar-tag.active, .nav-bar-path.active, .nav-bar-info.active, .nav-bar-h1.active, .nav-bar-h2.active');
        const newNavEl = this.shadowRoot.getElementById(`link-${entry.target.id}`);

        // Add active class in the new element
        if (newNavEl) {
          replaceState(entry.target.id);
          newNavEl.scrollIntoView({ behavior: 'auto', block: 'center' });
          newNavEl.classList.add('active');
        }
        // Remove active class from previous element
        if (oldNavEl) {
          oldNavEl.classList.remove('active');
        }
      }
    });
  }

  // Called by anchor tags created using markdown
  handleHref(e) {
    if (e.target.tagName.toLowerCase() === 'a') {
      const anchor = e.target.getAttribute('href');
      if (anchor && anchor.startsWith('#')) {
        const gotoEl = this.shadowRoot.getElementById(anchor.replace('#', ''));
        if (gotoEl) {
          gotoEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }
    }
  }

  /**
   * Called by
   *  - onClick of Navigation Bar
   *  - onClick of Advanced Search items
   *
   * Functionality:
   *  1. First deactivate IntersectionObserver
   *  2. Scroll to the element
   *  3. Activate IntersectionObserver (after little delay)
   *
  */
  scrollToEventTarget(event, scrollNavItemToView = true) {
    const navEl = event.currentTarget;
    if (!navEl.dataset.contentId) {
      return;
    }

    this.isIntersectionObserverActive = false;
    this.scrollTo(navEl.dataset.contentId, scrollNavItemToView);
    setTimeout(() => {
      this.isIntersectionObserverActive = true;
    }, 300);
  }

  scrollToCustomNavSectionTarget(event, scrollNavItemToView = true) {
    const navEl = event.currentTarget;
    if (!navEl.dataset.contentId) {
      return;
    }

    const navSectionSlot = this.shadowRoot.querySelector('slot.custom-nav-section');
    const assignedNodes = navSectionSlot?.assignedNodes();
    const repeatedElementIndex = assignedNodes && [].findIndex.call(assignedNodes, (slot) => slot === event.target);
    this.isIntersectionObserverActive = false;
    this.scrollTo(navEl.dataset.contentId, scrollNavItemToView, repeatedElementIndex);
    setTimeout(() => {
      this.isIntersectionObserverActive = true;
    }, 300);
  }

  // Public Method (scrolls to a given path and highlights the left-nav selection)
  async scrollTo(elementId, scrollNavItemToView = true, repeatedElementIndex) {
    if (!this.resolvedSpec) {
      return;
    }

    if (this.renderStyle === 'view') {
      this.expandAndGotoOperation(elementId);
      return;
    }

    // explorerLocation will get validated in the focused-endpoint-template
    this.explorerLocation = elementId;
    // Convert to Async and to the background, so that we can be sure that the operation has been expanded and put into view before trying to directly scroll to it (or it won't be found in the next line and even if it is, it might not be able to be scrolled into view)
    await sleep(0);

    // In the case of section scrolling, these are hard swaps, so just load "section". In the case of `tags` the headers have the element html Id in the last `--id`, so split that off and check for it
    const contentEl = this.shadowRoot.getElementById(elementId?.startsWith('section') ? 'section' : elementId) || this.shadowRoot.getElementById(elementId.split('--').slice(-1)[0]);
    if (!contentEl) {
      return;
    }

    // For focused APIs, always scroll to the top of the component
    if (!elementId.match('cmp--') && !elementId.match('tag--')) {
      this.shadowRoot.getElementById('operations-root').scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      contentEl.scrollIntoView({ behavior: 'auto', block: 'start' });
    }

    // for focused style it is important to reset request-body-selection and response selection which maintains the state for in case of multiple req-body or multiple response mime-type
    const requestEl = this.shadowRoot.querySelector('api-request');
    if (requestEl) {
      requestEl.resetRequestBodySelection();
    }
    const responseEl = this.shadowRoot.querySelector('api-response');
    if (responseEl) {
      responseEl.resetSelection();
    }

    // Update NavBar View and Styles
    let newNavEl = this.shadowRoot.getElementById(`link-${elementId}`);
    if (elementId?.startsWith('section')) {
      const navSectionSlot = this.shadowRoot.querySelector('slot.custom-nav-section');
      const assignedNodes = navSectionSlot?.assignedNodes();
      const customSectionRepeatedElementIndex = (elementId.replace('section--', '') || 1) - 1;
      newNavEl = assignedNodes?.[customSectionRepeatedElementIndex || repeatedElementIndex || 0];

      // Update Location Hash
      replaceState(`section--${repeatedElementIndex + 1 || 1}`);
    } else {
      // Update Location Hash
      replaceState(elementId);
    }

    if (!newNavEl) {
      return;
    }

    if (scrollNavItemToView) {
      newNavEl.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
    await sleep(0);
    const oldNavEl = this.shadowRoot.querySelector('.nav-bar-tag.active, .nav-bar-path.active, .nav-bar-info.active, .nav-bar-h1.active, .nav-bar-h2.active');
    if (oldNavEl) {
      oldNavEl.classList.remove('active');
    }
    const navSectionSlot = this.shadowRoot.querySelector('slot.custom-nav-section');
    const assignedNodes = navSectionSlot?.assignedNodes();
    (assignedNodes || []).filter((n, nodeIndex) => nodeIndex !== repeatedElementIndex).forEach((node) => {
      node.classList.remove('active');
    });

    newNavEl.classList.add('active'); // must add the class after scrolling
    this.requestUpdate();
  }

  // Event handler for Advanced Search text-inputs and checkboxes
  onAdvancedSearch(ev, delay) {
    const eventTargetEl = ev.target;
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      let searchInputEl;
      if (eventTargetEl.type === 'text') {
        searchInputEl = eventTargetEl;
      } else {
        searchInputEl = eventTargetEl.closest('.advanced-search-options').querySelector('input[type=text]');
      }
      const searchOptions = [...eventTargetEl.closest('.advanced-search-options').querySelectorAll('input:checked')].map((v) => v.id);
      this.advancedSearchMatches = advancedSearch(searchInputEl.value, this.resolvedSpec.tags, searchOptions);
    }, delay);
  }
}

if (!customElements.get('openapi-explorer')) {
  customElements.define('openapi-explorer', OpenApiExplorer);
}
import './openapi-explorer-oauth-handler';
