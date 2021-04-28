import { css, LitElement, unsafeCSS } from 'lit-element';
import marked from 'marked';
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

import { advancedSearch, pathIsInSearch, sleep } from './utils/common-utils';
import ProcessSpec from './utils/spec-parser';
import mainBodyTemplate from './templates/main-body-template';
import apiRequestStyles from './styles/api-request-styles';

export default class OpenApiExplorer extends LitElement {
  constructor() {
    super();
    const intersectionObserverOptions = {
      root: this.getRootNode().host,
      rootMargin: '-50px 0px -50px 0px', // when the element is visible 100px from bottom
      threshold: 0,
    };
    this.isIntersectionObserverActive = true;
    this.intersectionObserver = new IntersectionObserver((entries) => { this.onIntersect(entries); }, intersectionObserverOptions);
  }

  static get properties() {
    return {
      // Heading
      headingText: { type: String, attribute: 'heading-text' },
      explorerLocation: { type: String, attribute: 'explorer-location' },

      // Spec
      specUrl: { type: String, attribute: 'spec-url' },
      sortTags: { type: String, attribute: 'sort-tags' },
      generateMissingTags: { type: String, attribute: 'generate-missing-tags' },
      sortEndpointsBy: { type: String, attribute: 'sort-endpoints-by' },
      specFile: { type: String, attribute: false },

      // UI Layouts
      layout: { type: String },
      defaultSchemaTab: { type: String, attribute: 'default-schema-tab' },
      responseAreaHeight: { type: String, attribute: 'response-area-height' },
      fillRequestWithDefault: { type: String, attribute: 'fill-defaults' },
      onNavTagClick: { type: String, attribute: 'on-nav-tag-click' },

      // Schema Styles
      schemaStyle: { type: String, attribute: 'schema-style' },
      schemaExpandLevel: { type: Number, attribute: 'schema-expand-level' },
      schemaDescriptionExpanded: { type: String, attribute: 'schema-description-expanded' },
      schemaHideReadOnly: { type: String, attribute: 'schema-hide-read-only' },
      schemaHideWriteOnly: { type: String, attribute: 'schema-hide-write-only' },

      // API Server
      serverUrl: { type: String, attribute: 'server-url' },
      oauthReceiver: { type: String, attribute: 'oauth-redirect-url' },

      // Hide/Show Sections & Enable Disable actions
      showSideNav: { type: String, attribute: 'show-side-nav' },
      showInfo: { type: String, attribute: 'show-info' },
      allowAuthentication: { type: String, attribute: 'show-authentication' },
      allowTry: { type: String, attribute: 'enable-console' },
      allowSpecUrlLoad: { type: String, attribute: 'allow-spec-url-load' },
      allowSpecFileLoad: { type: String, attribute: 'allow-spec-file-load' },
      allowSearch: { type: String, attribute: 'allow-search' },
      allowAdvancedSearch: { type: String, attribute: 'allow-advanced-search' },
      allowServerSelection: { type: String, attribute: 'show-server-selection' },
      allowSchemaDescriptionExpandToggle: { type: String, attribute: 'allow-schema-description-expand-toggle' },
      showComponents: { type: String, attribute: 'show-components' },

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
      infoDescriptionHeadingsInNavBar: { type: String, attribute: 'info-description-headings-in-navbar' },

      // Fetch Options
      fetchCredentials: { type: String, attribute: 'fetch-credentials' },

      // Filters
      matchPaths: { type: String, attribute: 'match-paths' },

      // Internal Properties
      loading: { type: Boolean }, // indicates spec is being loaded
      showAdvancedSearchDialog: { type: Boolean },
      advancedSearchMatches: { type: Object },
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

      .main-content-inner {
        padding: 0 8px;
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
      .section-gap,
      .section-gap--focused-mode,
      .section-gap--read-mode { 
        padding: 0px 4px; 
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

      .section-tag-header:hover::after {
        position:absolute;
        margin-left:-24px;
        font-size:20px;
        top: calc(50% - 14px);
        color:var(--primary-color);
        content: '⬆'; 
      }

      .collapsed .section-tag-header::after {
        position:absolute;
        margin-left:-24px;
        font-size:20px;
        top: calc(50% - 14px);
        color: var(--border-color);
        content: '⬇'; 
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
        .section-gap,
        .section-gap--focused-mode {
          padding: 24px 24px; 
        }
        .section-gap--read-mode { 
          padding: 24px 8px; 
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
        .section-gap--focused-mode { 
          padding: 12px 24px 12px 24px;
        }
        .section-gap--read-mode { 
          padding: 24px 24px 12px;
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
    this.explorerLocation = this.explorerLocation || window.location.hash.substring(1);

    if (!this.schemaStyle || !'tree, table,'.includes(`${this.schemaStyle},`)) { this.schemaStyle = 'tree'; }
    if (!this.defaultSchemaTab || !'example, model,'.includes(`${this.defaultSchemaTab},`)) { this.defaultSchemaTab = 'model'; }
    if (!this.schemaExpandLevel || this.schemaExpandLevel < 1) { this.schemaExpandLevel = 99999; }
    if (!this.schemaDescriptionExpanded || !'true, false,'.includes(`${this.schemaDescriptionExpanded},`)) { this.schemaDescriptionExpanded = 'true'; }
    const writeMethodsWithBody = ['post', 'put', 'patch'];
    if (!this.schemaHideReadOnly) {
      this.schemaHideReadOnly = writeMethodsWithBody;
    } else if (this.schemaHideReadOnly !== 'never') {
      this.schemaHideReadOnly = writeMethodsWithBody.filter((value) => this.schemaHideReadOnly.includes(value));
      if (this.schemaHideReadOnly.length === 0) {
        this.schemaHideReadOnly = writeMethodsWithBody;
      }
    }
    this.schemaHideReadOnly += ['get', 'head', 'delete', 'options'];
    this.schemaHideWriteOnly = this.schemaHideWriteOnly !== 'never';
    if (!this.fillRequestWithDefault || !'true, false,'.includes(`${this.fillRequestWithDefault},`)) { this.fillRequestWithDefault = 'true'; }
    if (!this.onNavTagClick || !'expand-collapse, show-description,'.includes(`${this.onNavTagClick},`)) { this.onNavTagClick = 'expand-collapse'; }
    if (!this.responseAreaHeight) {
      this.responseAreaHeight = '300px';
    }

    if (!this.allowSearch || !'true, false,'.includes(`${this.allowSearch},`)) { this.allowSearch = 'true'; }
    if (!this.allowAdvancedSearch || !'true, false,'.includes(`${this.allowAdvancedSearch},`)) { this.allowAdvancedSearch = 'true'; }

    if (!this.allowTry || !'true, false,'.includes(`${this.allowTry},`)) { this.allowTry = 'true'; }

    if (!this.sortTags || !'true, false,'.includes(`${this.sortTags},`)) { this.sortTags = 'false'; }
    if (!this.generateMissingTags || !'true, false,'.includes(`${this.generateMissingTags},`)) { this.generateMissingTags = 'false'; }
    if (!this.sortEndpointsBy || !'method, path, summary,'.includes(`${this.sortEndpointsBy},`)) { this.sortEndpointsBy = 'path'; }
    if (!this.navItemSpacing || !'compact, relaxed, default,'.includes(`${this.navItemSpacing},`)) { this.navItemSpacing = 'default'; }
    if (!this.usePathInNavBar || !'true, false,'.includes(`${this.usePathInNavBar},`)) { this.usePathInNavBar = 'false'; }
    if (!this.fontSize || !'default, large, largest,'.includes(`${this.fontSize},`)) { this.fontSize = 'default'; }

    if (!this.showInfo || !'true, false,'.includes(`${this.showInfo},`)) { this.showInfo = 'true'; }
    if (!this.allowServerSelection || !'true, false,'.includes(`${this.allowServerSelection},`)) { this.allowServerSelection = 'true'; }
    if (!this.allowAuthentication || !'true, false,'.includes(`${this.allowAuthentication},`)) { this.allowAuthentication = 'true'; }
    if (!this.allowSchemaDescriptionExpandToggle || !'true, false,'.includes(`${this.allowSchemaDescriptionExpandToggle},`)) { this.allowSchemaDescriptionExpandToggle = 'true'; }

    if (!this.showSideNav || !'true false'.includes(this.showSideNav)) { this.showSideNav = 'true'; }
    if (!this.showComponents || !'true false'.includes(this.showComponents)) { this.showComponents = 'false'; }
    if (!this.infoDescriptionHeadingsInNavBar || !'true, false,'.includes(`${this.infoDescriptionHeadingsInNavBar},`)) { this.infoDescriptionHeadingsInNavBar = 'false'; }
    if (!this.fetchCredentials || !'omit, same-origin, include,'.includes(`${this.fetchCredentials},`)) { this.fetchCredentials = ''; }

    if (!this.showAdvancedSearchDialog) { this.showAdvancedSearchDialog = false; }

    marked.setOptions({
      highlight: (code, lang) => {
        if (Prism.languages[lang]) {
          return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
      },
    });

    window.addEventListener('hashchange', () => {
      this.scrollTo(window.location.hash.substring(1));
    }, true);
    this.handleResize();
  }

  // Cleanup
  disconnectedCallback() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    window.removeEventListener('resize', this.handleResize);
    super.disconnectedCallback();
  }

  infoDescriptionHeadingRenderer() {
    const renderer = new marked.Renderer();
    renderer.heading = ((text, level, raw, slugger) => `<h${level} class="observe-me" id="${slugger.slug(raw)}">${text}</h${level}>`);
    return renderer;
  }

  render() {
    return mainBodyTemplate.call(this);
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
        // put it at the end of event-loop to load all the attributes
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
    super.attributeChangedCallback(name, oldVal, newVal);
  }

  onSearchChange(e) {
    this.matchPaths = e.target.value;
    this.resolvedSpec.tags.forEach((tag) => tag.paths.filter((v) => {
      if (this.matchPaths) {
        // v.expanded = false;
        if (pathIsInSearch(this.matchPaths, v)) {
          tag.expanded = true;
        }
      }
    }));
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
      const isServerUrl = typeof specUrlOrObject === 'string' && specUrlOrObject.match(/^http/);
      if (!this.serverUrl && isServerUrl) {
        this.serverUrl = new URL(specUrlOrObject).origin;
      }
      const spec = await ProcessSpec(isServerUrl, specUrlOrObject, this.generateMissingTags === 'true', this.sortTags === 'true', this.sortEndpointsBy, this.serverUrl);
      this.loading = false;
      if (spec === undefined || spec === null) {
        console.error('Unable to resolve the API spec. '); // eslint-disable-line no-console
        return;
      }
      this.afterSpecParsedAndValidated(spec);
    } catch (err) {
      this.loading = false;
      this.loadFailed = true;
      this.resolvedSpec = null;
      console.error('OpenAPI Explorer: Unable to resolve the API spec..', err); // eslint-disable-line no-console
    }
  }

  async setSecuritySchemeToken(apiKeyId, token) {
    const securityObj = this.resolvedSpec.securitySchemes.find((v) => (v.apiKeyId === apiKeyId));
    if (!securityObj) {
      throw Error('SecuritySchemeNotFound');
    }

    let authorizationToken = token.replace(/^(Bearer|Basic)\s+/i, '');
    if (securityObj.type && securityObj.type === 'http' && securityObj.scheme && securityObj.scheme.toLowerCase() === 'basic') {
      authorizationToken = `Basic ${btoa(authorizationToken)}`;
    } else if (securityObj.scheme && securityObj.scheme.toLowerCase() === 'bearer') {
      authorizationToken = `Bearer ${authorizationToken}`;
    }
    securityObj.finalKeyValue = authorizationToken;
    this.requestUpdate();
  }

  async afterSpecParsedAndValidated(spec) {
    this.resolvedSpec = spec;
    this.selectedServer = this.resolvedSpec.servers.find((s) => s.url === this.serverUrl || !this.serverUrl);
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('spec-loaded', { detail: spec }));

    // Initiate IntersectionObserver and put it at the end of event loop, to allow loading all the child elements (must for larger specs)
    this.intersectionObserver.disconnect();
    if (this.renderStyle === 'read') {
      await sleep(100);
      this.observeExpandedContent(); // This will auto-highlight the selected nav-item in read-mode
    }

    // On first time Spec load, try to navigate to location hash if provided
    const locationHash = this.explorerLocation;
    if (locationHash) {
      if (this.renderStyle === 'view') {
        this.expandAndGotoOperation(locationHash, true, true);
      } else if (this.renderStyle === 'focused') {
        this.scrollTo(locationHash);
      }
    } else if (this.renderStyle === 'focused') {
      const defaultElementId = this.showInfo ? 'overview' : this.resolvedSpec.tags[0] && this.resolvedSpec.tags[0].paths[0];
      this.scrollTo(defaultElementId);
    }
  }

  expandAndGotoOperation(elementId, scrollToElement = true) {
    // Expand full operation and tag
    let isExpandingNeeded = true;
    const tmpElementId = elementId.indexOf('#') === -1 ? elementId : elementId.substring(1);
    if (tmpElementId.startsWith('overview') || tmpElementId === 'servers' || tmpElementId === 'auth') {
      isExpandingNeeded = false;
    } else {
      for (let i = 0; i < this.resolvedSpec.tags && this.resolvedSpec.tags.length; i++) {
        const tag = this.resolvedSpec.tags[i];
        const path = tag.paths && tag.paths.find((p) => p.elementId === elementId);
        if (path) {
          if (path.expanded && tag.expanded) {
            isExpandingNeeded = false;
          } else {
            path.expanded = true;
            tag.expanded = true;
          }
        }
      }
    }
    if (scrollToElement) {
      // requestUpdate() and delay required, else we cant find element
      if (isExpandingNeeded) {
        this.requestUpdate();
      }
      window.setTimeout(() => {
        const gotoEl = this.shadowRoot.getElementById(tmpElementId);
        if (gotoEl) {
          gotoEl.scrollIntoView({ behavior: 'auto', block: 'start' });
          window.history.replaceState(null, null, `#${tmpElementId}`);
        }
      }, isExpandingNeeded ? 150 : 0);
    }
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
          window.history.replaceState(null, null, `${window.location.href.split('#')[0]}#${entry.target.id}`);
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
  async scrollToEventTarget(event, scrollNavItemToView = true) {
    const navEl = event.currentTarget;
    if (!navEl.dataset.contentId) {
      return;
    }
    this.isIntersectionObserverActive = false;
    this.scrollTo(navEl.dataset.contentId, true, scrollNavItemToView);
    setTimeout(() => {
      this.isIntersectionObserverActive = true;
    }, 300);
  }

  // Public Method (scrolls to a given path and highlights the left-nav selection)
  async scrollTo(elementId, expandPath = true, scrollNavItemToView = true) {
    if (!this.resolvedSpec) {
      return;
    }

    if (this.renderStyle === 'focused') {
      // explorerLocation will get validated in the focused-endpoint-template
      this.explorerLocation = elementId;
      await sleep(0);
    }
    if (this.renderStyle === 'view') {
      this.expandAndGotoOperation(elementId, expandPath, true);
    } else {
      let isValidElementId = false;
      const contentEl = this.shadowRoot.getElementById(elementId);
      if (contentEl) {
        isValidElementId = true;
        // ScrollIntoView is needed for read-mode and overview and tag section in focused-mode
        if (this.renderStyle === 'read' || elementId.startsWith('overview') || elementId.startsWith('tag--')) {
          contentEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      } else {
        isValidElementId = false;
      }
      if (isValidElementId) {
        // for focused style it is important to reset request-body-selection and response selection which maintains the state for in case of multiple req-body or multiple response mime-type
        if (this.renderStyle === 'focused') {
          const requestEl = this.shadowRoot.querySelector('api-request');
          if (requestEl) {
            requestEl.resetRequestBodySelection();
          }
          const responseEl = this.shadowRoot.querySelector('api-response');
          if (responseEl) {
            responseEl.resetSelection();
          }
        }

        // Update Location Hash
        window.history.replaceState(null, null, `#${elementId}`);

        // Update NavBar View and Styles
        const newNavEl = this.shadowRoot.getElementById(`link-${elementId}`);

        if (newNavEl) {
          if (scrollNavItemToView) {
            newNavEl.scrollIntoView({ behavior: 'auto', block: 'center' });
          }
          await sleep(0);
          const oldNavEl = this.shadowRoot.querySelector('.nav-bar-tag.active, .nav-bar-path.active, .nav-bar-info.active, .nav-bar-h1.active, .nav-bar-h2.active');
          if (oldNavEl) {
            oldNavEl.classList.remove('active');
          }
          newNavEl.classList.add('active'); // must add the class after scrolling
          // this.requestUpdate();
        }
      }
    }
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
customElements.define('openapi-explorer', OpenApiExplorer);
