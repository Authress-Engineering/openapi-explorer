import OpenApiResolver from 'openapi-resolver/dist/openapi-resolver.browser';
import { marked } from 'marked';
import { invalidCharsRegEx } from './common-utils';

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
  const infoDescriptionHeaders = (jsonParsedSpec.info && jsonParsedSpec.info.description) ? getHeadersFromMarkdown(jsonParsedSpec.info.description) : [];

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
      v.typeDisplay = v.scheme === 'basic' ? 'HTTP Basic' : 'HTTP Bearer';
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
    jsonParsedSpec.servers.forEach((v) => {
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
    if (serverUrl && !jsonParsedSpec.servers.some(s => s.url === serverUrl || s.computedUrl === serverUrl)) {
      jsonParsedSpec.servers.push({ url: serverUrl, computedUrl: serverUrl });
    }
  } else if (serverUrl) {
    jsonParsedSpec.servers = [{ url: serverUrl, computedUrl: serverUrl }];
  } else if (inputSpecIsAUrl) {
    jsonParsedSpec.servers = [{ url: new URL(specUrlOrObject).origin, computedUrl: new URL(specUrlOrObject).origin }];
  } else if (window.location.origin.startsWith('http')) {
    jsonParsedSpec.servers = [{ url: window.location.origin, computedUrl: window.location.origin }];
  } else {
    jsonParsedSpec.servers = [{ url: 'http://localhost', computedUrl: 'http://localhost' }];
  }
  servers = jsonParsedSpec.servers;
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
    const subComponents = [];
    for (const sComponent in openApiSpec.components[component]) {
      const scmp = {
        show: true,
        id: `${component.toLowerCase()}-${sComponent.toLowerCase()}`.replace(invalidCharsRegEx, '-'),
        name: sComponent,
        component: openApiSpec.components[component][sComponent],
      };
      subComponents.push(scmp);
    }

    let cmpDescription = component;
    let cmpName = component;

    switch (component) {
      case 'schemas':
        cmpName = 'Schemas';
        cmpDescription = 'Schemas allows the definition of input and output data types. These types can be objects, but also primitives and arrays.';
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
        cmpName = 'Request Bodies';
        cmpDescription = 'Describes common request bodies that are used across the API operations.';
        break;
      case 'headers':
        cmpName = 'Headers';
        cmpDescription = 'Headers follows the structure of the Parameters but they are explicitly in "header"';
        break;
      case 'securitySchemes':
        cmpName = 'Security Schemes';
        // eslint-disable-next-line max-len
        cmpDescription = 'Defines a security scheme that can be used by the operations. Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter or as a query parameter), OAuth2\'s common flows(client credentials and authorization code) as defined in RFC6749, and OpenID Connect Discovery.';
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

    const cmp = {
      show: true,
      name: cmpName,
      description: cmpDescription,
      subComponents,
    };
    components.push(cmp);
  }

  return components || [];
}

function groupByTags(openApiSpec) {
  const supportedMethods = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options']; // this is also used for ordering endpoints by methods
  const tags = openApiSpec.tags && Array.isArray(openApiSpec.tags)
    ? openApiSpec.tags.map((t) => ({
      show: true,
      elementId: `tag--${t.name.replace(invalidCharsRegEx, '-')}`,
      name: t.name,
      description: t.description || '',
      headers: t.description ? getHeadersFromMarkdown(t.description) : [],
      paths: [],
      expanded: t['x-tag-expanded'] !== false,
    }))
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
    const commonParams = pathsAndWebhooks[pathOrHookName].parameters;
    const commonPathProp = {
      servers: pathsAndWebhooks[pathOrHookName].servers || [],
      parameters: pathsAndWebhooks[pathOrHookName].parameters || [],
    };
    const isWebhook = pathsAndWebhooks[pathOrHookName]._type === 'webhook'; // eslint-disable-line no-underscore-dangle
    supportedMethods.forEach((methodName) => {
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
              show: true,
              elementId: `tag--${tag.replace(invalidCharsRegEx, '-')}`,
              name: tag,
              description: specTagsItem && specTagsItem.description || '',
              headers: specTagsItem && specTagsItem.description ? getHeadersFromMarkdown(specTagsItem.description) : [],
              paths: [],
              expanded: (specTagsItem ? specTagsItem['x-tag-expanded'] !== false : true),
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
            show: true,
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
            servers: pathOrHookObj.servers ? commonPathProp.servers.concat(pathOrHookObj.servers) : commonPathProp.servers,
            parameters: finalParameters,
            requestBody: pathOrHookObj.requestBody,
            responses: pathOrHookObj.responses,
            callbacks: pathOrHookObj.callbacks,
            deprecated: pathOrHookObj.deprecated,
            security: pathOrHookObj.security,
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
