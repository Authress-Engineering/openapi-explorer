import i18next from 'i18next';
import i18nextHttpBackend from 'i18next-http-backend';
import i18nextResourcesToBackend from 'i18next-resources-to-backend';
import i18nextChainedBackend from 'i18next-chained-backend';


const fallbackResources = {
  en: {
    translation: {
      "menu":{
        "filter": "Filter",
        "search": "Search",
        "overview": "Overview",
        "api-servers": "API Servers",
        "authentication": "Authentication",
        "operations": "OPERATIONS",
        "components": "COMPONENTS",
        "schemas": "Schemas"
      },
      "headers":{
        "api-servers": "API SERVER",
        "authentication": "AUTHENTICATION",		
      },
      "overview":{
        "email": "Email",
        "terms-of-service": "Terms of Service"
      },      
      "api-servers":{
        "server-variables": "SERVER VARIABLES",
        "selected": "SELECTED"
      },
      "authentication":{
        "no-api-key-applied": "No API key applied",
        "http-basic": "HTTP Basic",
        "http-basic-desc":"Send the Authorization header containing the type Basic followed by a space and a base64 encoded string of username:password",
        "username":"username",
        "password":"password",
        "requires": "Requires",
        "http-basic-note": "Base 64 encoded username:password",
        "in-auth-header": "in Authorization header",
        "set": "SET"
      },      
      "operations":{
        "request": "REQUEST",
        "request-body": "REQUEST BODY",
        "model": "MODEL",
        "body": "BODY",
        "request-headers": "REQUEST HEADERS",
        "clear": "CLEAR",
        "clear-response": "CLEAR RESPONSE",		
        "execute": "EXECUTE",
        "response": "RESPONSE",
        "response-headers": "RESPONSE HEADERS",
        "model": "MODEL",
        "example": "EXAMPLE",
        "response-status": "Response Status",
        "fetch-fail": "Failed to fetch (Check the browser network tab for more information.)",
        "copy": "Copy",
        "copied": "Copied"
      },
      "common":{
        "collapse-desc": "Collapse",
        "expand-desc": "Expand",
        "schema-missing": "Schema not found"
      }
    }
  }
}

let i18nextReady = false;

export function initI18n(baseUrl, initLang){
  i18next.use(i18nextChainedBackend).init({
		lng: initLang, 
    fallbackLng: 'en',
		debug: true,
    ns: [ 'translation' ],
    defaultNS: 'translation',
    backend:{
      backends: [
        i18nextHttpBackend,
        i18nextResourcesToBackend(fallbackResources)
      ],
      backendOptions: [{
        loadPath: baseUrl ? baseUrl + '/{{ns}}_{{lng}}.json' : null
      }]
    }
	}).then(function(){ i18nextReady = true;});
}

export function changeI18nLang(newLang){
  i18next.changeLanguage(newLang);
}

export function isI18nReady(){
  return i18nextReady;
}


export function getI18nText(key){
  return i18next.t(key);
}


/* For Delayed Event Handler Execution */
export function debounce(fn, delay) {
  let timeoutID = null;
  return (...args) => {
    clearTimeout(timeoutID);
    const that = this;
    timeoutID = setTimeout(() => {
      fn.apply(that, args);
    }, delay);
  };
}

export const invalidCharsRegEx = new RegExp(/[\s#:?&={}]/, 'g'); // used for generating valid html element ids by replacing the invalid chars with hyphen (-)

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function copyToClipboard(data, e) {
  const btnEl = e.currentTarget;
  const textArea = document.createElement('textarea');
  textArea.value = data;
  textArea.style.position = 'fixed'; // avoid scrolling to bottom
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    btnEl.innerText = getI18nText('operations.copied');
    setTimeout(() => {
      btnEl.innerText = getI18nText('operations.copy');
    }, 5000);
  } catch (err) {
    console.error('Unable to copy', err); // eslint-disable-line no-console
  }
  document.body.removeChild(textArea);
}

export function getBaseUrlFromUrl(url) {
  const pathArray = url.split('/');
  return `${pathArray[0]}//${pathArray[2]}`;
}

export function componentIsInSearch(searchVal, component) {
  return !searchVal || component.name.toLowerCase().includes(searchVal.toLowerCase());
}

export function pathIsInSearch(searchVal, path) {
  if (!searchVal) {
    return true;
  }
  const stringToSearch = `${path.method} ${path.path} ${path.summary || path.description || ''} ${path.operationId || ''}`.toLowerCase();
  return stringToSearch.includes(searchVal.toLowerCase());
}

export function schemaKeys(schemaProps, result = new Set()) {
  if (!schemaProps) {
    return result;
  }
  Object.keys(schemaProps).forEach((key) => {
    result.add(key);
    if (schemaProps[key].properties) {
      schemaKeys(schemaProps[key].properties, result);
    } else if (schemaProps[key].items && schemaProps[key].items.properties) {
      schemaKeys(schemaProps[key].items.properties, result);
    }
  });
  return result;
}

export function advancedSearch(searchVal, allSpecTags, searchOptions = []) {
  if (!searchVal.trim() || searchOptions.length === 0) {
    return undefined;
  }

  const pathsMatched = [];
  allSpecTags.forEach((tag) => {
    tag.paths.forEach((path) => {
      let stringToSearch = '';
      if (searchOptions.includes('search-api-path')) {
        stringToSearch = path.path;
      }
      if (searchOptions.includes('search-api-descr')) {
        stringToSearch = `${stringToSearch} ${path.summary || path.description || ''}`;
      }
      if (searchOptions.includes('search-api-params')) {
        stringToSearch = `${stringToSearch} ${path.parameters && path.parameters.map((v) => v.name).join(' ') || ''}`;
      }

      if (searchOptions.includes('search-api-request-body') && path.requestBody) {
        let schemaKeySet = new Set();
        for (const contentType in path.requestBody && path.requestBody.content) {
          if (path.requestBody.content[contentType].schema && path.requestBody.content[contentType].schema.properties) {
            schemaKeySet = schemaKeys(path.requestBody.content[contentType].schema.properties);
          }
          stringToSearch = `${stringToSearch} ${[...schemaKeySet].join(' ')}`;
        }
      }

      if (searchOptions.includes('search-api-resp-descr')) {
        stringToSearch = `${stringToSearch} ${Object.values(path.responses).map((v) => v.description || '').join(' ')}`;
      }

      if (stringToSearch.toLowerCase().includes(searchVal.trim().toLowerCase())) {
        pathsMatched.push({
          elementId: path.elementId,
          method: path.method,
          path: path.path,
          summary: path.summary || path.description || '',
          deprecated: path.deprecated,
        });
      }
    });
  });
  return pathsMatched;
}

export function getCurrentElement() {
  const currentQuery = (window.location.hash || '').split('?')[1];
  const query = new URLSearchParams(currentQuery);
  return decodeURIComponent(query.get('route') || '');
}

export function replaceState(rawElementId) {
  const elementId = rawElementId && rawElementId.replace(/^#/, '') || '';

  const currentNavigationHashPart = (window.location.hash || '').split('?')[0].replace(/^#/, '');
  const currentQuery = (window.location.hash || '').split('?')[1];
  const query = new URLSearchParams(currentQuery);
  query.delete('route');
  const newQuery = query.toString().length > 1 ? `${query.toString()}&route=${elementId}` : `route=${elementId}`;
  window.history.replaceState(null, null, `#${currentNavigationHashPart}?${newQuery}`);
}
