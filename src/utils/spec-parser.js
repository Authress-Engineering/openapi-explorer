import OpenApiResolver from 'openapi-resolver/dist/openapi-resolver.browser';
import { marked } from 'marked';
import { invalidCharsRegEx } from './common-utils';
import { getI18nText } from '../languages';
import cloneDeep from 'lodash.clonedeep';

export default async function ProcessSpec(specUrlOrObject, serverUrl = '') {
  const inputSpecIsAUrl = typeof specUrlOrObject === 'string' && specUrlOrObject.match(/^http/) || typeof specUrlOrObject === 'object' && typeof specUrlOrObject.href === 'string';

  let jsonParsedSpec;
  try {
    jsonParsedSpec = await OpenApiResolver(specUrlOrObject);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing specification', error);
    throw Error('SpecificationNotFound');
  }

  if (!jsonParsedSpec) {
    throw Error('SpecificationNotFound');
  }

  // Tags with Paths and WebHooks
  const tags = groupByTags(jsonParsedSpec);

  // Components
  const components = getComponents(jsonParsedSpec);

  // Info Description Headers
  const infoDescriptionHeaders = jsonParsedSpec.info?.description ? getHeadersFromMarkdown(jsonParsedSpec.info.description) : [];

  // Security Scheme
  const securitySchemes = [];
  if (jsonParsedSpec.components && jsonParsedSpec.components.securitySchemes) {
    Object.entries(jsonParsedSpec.components.securitySchemes).forEach((kv) => {
      const securityObj = { apiKeyId: kv[0], ...kv[1] };
      securityObj.value = '';
      securityObj.finalKeyValue = '';
      if (kv[1].type === 'apiKey' || kv[1].type === 'http') {
        securityObj.name = kv[1].name || 'Authorization';
        securityObj.user = '';
        securityObj.password = '';
      } else if (kv[1].type === 'oauth2') {
        securityObj.name = 'Authorization';
        securityObj.clientId = '';
        securityObj.clientSecret = '';
      }
      securitySchemes.push(securityObj);
    });
  }

  // Updated Security Type Display Text based on Type
  securitySchemes.forEach((v) => {
    if (v.type === 'http') {
      v.typeDisplay = v.scheme === 'basic' ? getI18nText('authentication.http-basic') : 'HTTP Bearer';
    } else if (v.type === 'apiKey') {
      v.typeDisplay = `API Key (${v.name})`;
    } else if (v.type === 'oauth2') {
      v.typeDisplay = 'OAuth2.0';
    } else {
      v.typeDisplay = v.type;
    }
  });

  // Servers
  let servers = [];
  if (Array.isArray(jsonParsedSpec.servers) && jsonParsedSpec.servers.length) {
    jsonParsedSpec.servers.filter(s => s).forEach((v) => {
      let computedUrl = v.url.trim();
      if (!(computedUrl.startsWith('http') || computedUrl.startsWith('//') || computedUrl.startsWith('{'))) {
        if (window.location.origin.startsWith('http')) {
          v.url = window.location.origin + v.url;
          computedUrl = v.url;
        }
      }
      // Apply server-variables to generate final computed-url
      if (v.variables) {
        Object.entries(v.variables).forEach((kv) => {
          const regex = new RegExp(`{${kv[0]}}`, 'g');
          computedUrl = computedUrl.replace(regex, kv[1].default || '');
          kv[1].value = kv[1].default || '';
        });
      }
      v.computedUrl = computedUrl;
    });
    const explicitServers = serverUrl && !jsonParsedSpec.servers.some(s => s.url === serverUrl || s.computedUrl === serverUrl) ? [{ url: serverUrl, computedUrl: serverUrl }] : [];
    servers = explicitServers.concat(jsonParsedSpec.servers);
  } else if (serverUrl) {
    servers = [{ url: serverUrl, computedUrl: serverUrl }];
  } else if (inputSpecIsAUrl) {
    servers = [{ url: new URL(specUrlOrObject).origin, computedUrl: new URL(specUrlOrObject).origin }];
  } else if (window.location.origin.startsWith('http')) {
    servers = [{ url: window.location.origin, computedUrl: window.location.origin }];
  } else {
    servers = [{ url: 'http://localhost', computedUrl: 'http://localhost' }];
  }

  const parsedSpec = {
    info: jsonParsedSpec.info,
    infoDescriptionHeaders,
    tags,
    components,
    // pathGroups,
    externalDocs: jsonParsedSpec.externalDocs,
    securitySchemes,
    servers,
  };
  return parsedSpec;
}

function getHeadersFromMarkdown(markdownContent) {
  const tokens = marked.lexer(markdownContent);
  const headers = tokens.filter((v) => v.type === 'heading' && v.depth <= 2);
  return headers || [];
}

function getComponents(openApiSpec) {
  if (!openApiSpec.components) {
    return [];
  }
  const components = [];
  for (const component in openApiSpec.components) {
    const subComponents = Object.keys(openApiSpec.components[component]).map(sComponent => ({
      expanded: true,
      id: `${component.toLowerCase()}-${sComponent.toLowerCase()}`.replace(invalidCharsRegEx, '-'),
      name: sComponent,
      component: openApiSpec.components[component][sComponent],
    })).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    let cmpDescription;
    let cmpName;

    switch (component) {
      case 'schemas':
        cmpName = getI18nText('menu.schemas');
        cmpDescription = '';
        break;
      case 'responses':
        cmpName = 'Responses';
        cmpDescription = 'Describes responses from an API Operation, including design-time, static links to operations based on the response.';
        break;
      case 'parameters':
        cmpName = 'Parameters';
        cmpDescription = 'Describes operation parameters. A unique parameter is defined by a combination of a name and location.';
        break;
      case 'examples':
        cmpName = 'Examples';
        cmpDescription = 'List of Examples for operations, can be requests, responses and objects examples.';
        break;
      case 'requestBodies':
        break;
      case 'headers':
        cmpName = 'Headers';
        cmpDescription = 'Headers follows the structure of the Parameters but they are explicitly in "header"';
        break;
      case 'securitySchemes':
      case 'securitySchemas':
        break;
      case 'links':
        cmpName = 'Links';
        cmpDescription = 'Links represent a possible design-time link for a response. The presence of a link does not guarantee the caller\'s ability to successfully invoke it, rather it provides a known relationship and traversal mechanism between responses and other operations.';
        break;
      case 'callbacks':
        cmpName = 'Callbacks';
        // eslint-disable-next-line max-len
        cmpDescription = 'A map of possible out-of band callbacks related to the parent operation. Each value in the map is a Path Item Object that describes a set of requests that may be initiated by the API provider and the expected responses. The key value used to identify the path item object is an expression, evaluated at runtime, that identifies a URL to use for the callback operation.';
        break;
      default:
        cmpName = component;
        cmpDescription = component;
        break;
    }

    if (cmpName) {
      components.push({
        expanded: true,
        name: cmpName,
        description: cmpDescription,
        subComponents,
      });
    }
  }

  return components;
}

function groupByTags(openApiSpec) {
  const supportedMethods = ['get', 'query', 'put', 'post', 'patch', 'delete', 'head', 'options']; // this is also used for ordering endpoints by methods
  const tags = openApiSpec.tags && Array.isArray(openApiSpec.tags)
    ? openApiSpec.tags.map((t) => {
      const name = typeof t === 'string' ? t : t.name;
      return {
        elementId: `tag--${name.replace(invalidCharsRegEx, '-')}`,
        name: name,
        description: t.description || '',
        headers: t.description ? getHeadersFromMarkdown(t.description) : [],
        paths: [],
        expanded: true
      };
    })
    : [];

  const pathsAndWebhooks = openApiSpec.paths || {};
  if (openApiSpec.webhooks) {
    for (const [key, value] of Object.entries(openApiSpec.webhooks)) {
      value._type = 'webhook'; // eslint-disable-line no-underscore-dangle
      pathsAndWebhooks[key] = value;
    }
  }
  // For each path find the tag and push it into the corresponding tag
  for (const pathOrHookName in pathsAndWebhooks) {
    const commonPathPropServers = pathsAndWebhooks[pathOrHookName].servers || [];
    const isWebhook = pathsAndWebhooks[pathOrHookName]._type === 'webhook'; // eslint-disable-line no-underscore-dangle
    supportedMethods.forEach((methodName) => {
      const commonParams = cloneDeep(pathsAndWebhooks[pathOrHookName].parameters);
      if (pathsAndWebhooks[pathOrHookName][methodName]) {
        const pathOrHookObj = openApiSpec.paths[pathOrHookName][methodName];
        // If path.methods are tagged, else generate it from path
        const pathTags = Array.isArray(pathOrHookObj.tags) ? pathOrHookObj.tags : pathOrHookObj.tags && [pathOrHookObj.tags] || [];
        if (pathTags.length === 0) {
          pathTags.push('General ⦂');
        }

        pathTags.forEach((tag) => {
          let tagObj;
          let specTagsItem;

          if (openApiSpec.tags) {
            specTagsItem = openApiSpec.tags.find((v) => (v.name.toLowerCase() === tag.toLowerCase()));
          }

          tagObj = tags.find((v) => v.name === tag);
          if (!tagObj) {
            tagObj = {
              elementId: `tag--${tag.replace(invalidCharsRegEx, '-')}`,
              name: tag,
              description: specTagsItem && specTagsItem.description || '',
              headers: specTagsItem && specTagsItem.description ? getHeadersFromMarkdown(specTagsItem.description) : [],
              paths: [],
              expanded: true,
            };
            tags.push(tagObj);
          }

          // Generate a short summary which is broken
          let shortSummary = (pathOrHookObj.summary || pathOrHookObj.description || `${methodName.toUpperCase()} ${pathOrHookName}`).trim();
          if (shortSummary.length > 100) {
            shortSummary = shortSummary.split(/[.|!|?]\s|[\r?\n]/)[0]; // take the first line (period or carriage return)
          }
          // Merge Common Parameters with This methods parameters
          let finalParameters = [];
          if (commonParams) {
            if (pathOrHookObj.parameters) {
              finalParameters = commonParams.filter((commonParam) => {
                if (!pathOrHookObj.parameters.some((param) => (commonParam.name === param.name && commonParam.in === param.in))) {
                  return commonParam;
                }
                return undefined;
              }).concat(pathOrHookObj.parameters);
            } else {
              finalParameters = commonParams.slice(0);
            }
          } else {
            finalParameters = pathOrHookObj.parameters ? pathOrHookObj.parameters.slice(0) : [];
          }

          // Remove bad callbacks
          if (pathOrHookObj.callbacks) {
            for (const [callbackName, callbackConfig] of Object.entries(pathOrHookObj.callbacks)) {
              const originalCallbackEntries = Object.entries(callbackConfig);
              const filteredCallbacks = originalCallbackEntries.filter((entry) => typeof entry[1] === 'object') || [];
              pathOrHookObj.callbacks[callbackName] = Object.fromEntries(filteredCallbacks);
              if (filteredCallbacks.length !== originalCallbackEntries.length) {
                console.warn(`OpenAPI Explorer: Invalid Callback found in ${callbackName}`); // eslint-disable-line no-console
              }
            }
          }

          // Update Responses
          tagObj.paths.push({
            expanded: false,
            isWebhook,
            expandedAtLeastOnce: false,
            summary: (pathOrHookObj.summary || ''),
            description: (pathOrHookObj.description || ''),
            shortSummary,
            method: methodName,
            path: pathOrHookName,
            operationId: pathOrHookObj.operationId,
            elementId: `${methodName}-${pathOrHookName.replace(invalidCharsRegEx, '-')}`,
            servers: pathOrHookObj.servers ? commonPathPropServers.concat(pathOrHookObj.servers) : commonPathPropServers,
            parameters: finalParameters,
            requestBody: pathOrHookObj.requestBody,
            responses: pathOrHookObj.responses,
            callbacks: pathOrHookObj.callbacks,
            deprecated: pathOrHookObj.deprecated,
            security: pathOrHookObj.security || openApiSpec.security,
            // commonSummary: commonPathProp.summary,
            // commonDescription: commonPathProp.description,
            xCodeSamples: pathOrHookObj['x-codeSamples'] || pathOrHookObj['x-code-samples'] || '',
          });
        });// End of tag path create
      }
    }); // End of Methods
  }

  return tags.filter((tag) => tag.paths && tag.paths.length > 0);
}
