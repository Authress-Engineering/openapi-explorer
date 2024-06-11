import { marked } from 'marked';

import { getI18nText } from '../languages/index.js';

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

export function copyToClipboard(copyData, eventTarget) {
  // In lots of places we have more than a couple of spaces for <pre> display purposes, we remove those extra spaces here.
  let data = copyData?.trim().replace(/\s{8}/g, '  ');
  try {
    // If the parsed type is a number, then leave it alone
    if (typeof JSON.parse(data) === 'object') {
      // Convert to 2 spaces in all JSON text
      data = JSON.stringify(JSON.parse(data), null, 2).trim();
    }
  } catch (error) {
    // Ignore non JSON text;
  }

  const textArea = document.createElement('textarea');
  textArea.value = data;
  textArea.style.position = 'fixed'; // avoid scrolling to bottom
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    const btnEl = eventTarget?.target;
    if (btnEl) {
      btnEl.innerText = getI18nText('operations.copied');
      setTimeout(() => {
        btnEl.innerText = getI18nText('operations.copy');
      }, 5000);
    }
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
  const stringToSearch = `${path.method} ${path.path} ${path.summary || ''} ${path.description || ''} ${path.operationId || ''}`;
  return stringToSearch.includes(searchVal) || stringToSearch.toLowerCase().includes(searchVal)
    || stringToSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchVal)
    || stringToSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchVal);
}

function schemaKeys(schemaProps, result = new Set()) {
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
  window.history.pushState(null, null, `#${currentNavigationHashPart}?${newQuery}`);
}

export function toMarkdown(markdownStringRaw) {
  const sanitizedMarkdownString = (markdownStringRaw || '')
    // Convert scripts tags to correct markdown format
    .replace(/[<]script[^>]*>/gi, '<div>```')
    .replace(/[<][/]script/gi, '```</div')
    // Remove unnecessary attributes from img tag
    .replace(/onerror=/ig, 'attribute');
  const markdownResult = marked(sanitizedMarkdownString || '');
  return markdownResult;
}

export function getSanitizedUrl(urlString) {
  if (!urlString) {
    return '';
  }
  try {
    // eslint-disable-next-line no-new
    const url = new URL(urlString);
    return url.protocol === 'http' || url.protocol === 'https' ? url : '';
  } catch (error) {
    return '';
  }
}

export function getSanitizedEmail(emailRaw) {
  if (!emailRaw) {
    return '';
  }

  // eslint-disable-next-line max-len, no-control-regex
  if (emailRaw.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)) {
    return emailRaw;
  }

  return '';
}
