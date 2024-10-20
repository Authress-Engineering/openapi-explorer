// To inline test changes to the OpenAPiResolver, it must be copied into the node_modules directory. The builder for this package will not work across repositories.
import OpenApiResolver from 'openapi-resolver/dist/openapi-resolver.browser.js';
import { marked } from 'marked';
import { invalidCharsRegEx } from './common-utils.js';
import cloneDeep from 'lodash.clonedeep';

export default async function ProcessSpec(specUrlOrObject, serverUrl = '') {
  const inputSpecIsAUrl = typeof specUrlOrObject === 'string' && specUrlOrObject.match(/^http/) || typeof specUrlOrObject === 'object' && typeof specUrlOrObject.href === 'string';

  let jsonParsedSpec;
  let errorToDisplay;
  for (let iteration = 0; iteration < 7; iteration++) {
    try {
      jsonParsedSpec = await OpenApiResolver(specUrlOrObject);
      break;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing specification', error);
      errorToDisplay = error.message;
      await new Promise(resolve => setTimeout(resolve, 100 * 2 ** iteration));
    }
  }

  if (!jsonParsedSpec) {
    if (errorToDisplay) {
      if (inputSpecIsAUrl && specUrlOrObject.toString().match('localhost')) {
        throw Error(`Cannot connect to your localhost running spec because your webserver is blocking requests. To the load the spec from ${specUrlOrObject.toString()}, return the following CORS header \`"Access-Control-Allow-Private-Network": "true"\`.`);
      }
      const message = `Failed to resolve the spec: ${errorToDisplay}`;
      throw Error(message);
    }
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
  if (jsonParsedSpec.components?.securitySchemes) {
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
  for (const componentKeyId in openApiSpec.components) {
    const subComponents = Object.keys(openApiSpec.components[componentKeyId]).map(sComponent => ({
      expanded: true,
      id: `${componentKeyId.toLowerCase()}-${sComponent.toLowerCase()}`.replace(invalidCharsRegEx, '-'),
      name: sComponent,
      component: openApiSpec.components[componentKeyId][sComponent],
    })).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    if (componentKeyId === 'requestBodies' || componentKeyId === 'securitySchemes' || componentKeyId === 'securitySchemas') {
      continue;
    }

    components.push({
      expanded: true,
      componentKeyId,
      subComponents,
    });
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
      const commonParams = cloneDeep(pathsAndWebhooks[pathOrHookName].parameters || []);
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
            specTagsItem = tags.find((v) => (v.name.toLowerCase() === tag.toLowerCase()));
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
          const finalParameters = pathOrHookObj.parameters?.slice(0) || [];
          finalParameters.push(...commonParams.filter((commonParam) => !finalParameters.some((param) => (commonParam.name === param.name && commonParam.in === param.in))));

          const successResponseKeys = Object.keys(pathOrHookObj.responses || {}).filter(r => !r.match(/^\d{3}$/i) || r.match(/^[23]\d{2}$/i));
          const responseContentTypesMap = successResponseKeys.map(key => pathOrHookObj.responses[key]).reduce((acc, response) => Object.assign({}, acc, response.content || {}), {});
          const responseContentTypes = Object.keys(responseContentTypesMap).sort((a, b) => a.localeCompare(b));
          if (!finalParameters.some(p => p.in === 'header' && p.name.match(/^accept$/i)) && Object.keys(responseContentTypesMap).length > 1) {
            finalParameters.push({
              in: 'header',
              name: 'Accept',
              description: 'Select the response body Content-Type. By default, the service will return a Content-Type that best matches the requested type.',
              schema: {
                type: 'string',
                enum: responseContentTypes
              },
              default: responseContentTypes[0],
              example: responseContentTypes[0]
            });
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
          const pathObject = {
            expanded: false,
            isWebhook,
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
            externalDocs: pathOrHookObj.externalDocs,
            // commonSummary: commonPathProp.summary,
            // commonDescription: commonPathProp.description,
            xCodeSamples: pathOrHookObj['x-code-samples'] || '',
            extensions: Object.keys(pathOrHookObj).filter(k => k.startsWith('x-') && k !== 'x-code-samples').reduce((acc, extensionKey) => {
              acc[extensionKey] = pathOrHookObj[extensionKey];
              return acc;
            }, {})
          };
          tagObj.paths.push(pathObject);
        });// End of tag path create
      }
    }); // End of Methods
  }

  return tags;
}
