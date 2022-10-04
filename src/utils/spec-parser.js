import OpenApiResolver from 'openapi-resolver/dist/openapi-resolver.browser';
import { marked } from 'marked';
import { invalidCharsRegEx, getI18nText } from './common-utils';
import cloneDeep from 'lodash.clonedeep';

export default async function ProcessSpec(specUrl, sortTags = false, sortEndpointsBy, attrApiKey = '', attrApiKeyLocation = '', attrApiKeyValue = '', serverUrl = '', allowDuplicatedPathsByTag = false) {
  let jsonParsedSpec;
  try {
    let specMeta;
    if (typeof specUrlOrObject === 'string') {
      specMeta = await OpenApiParser.resolve({ url: specUrlOrObject }); // Swagger(specUrl);
    } else {
      specMeta = await OpenApiParser.resolve({ spec: specUrlOrObject }); // Swagger({ spec: specUrl });
    }
    jsonParsedSpec = specMeta.spec;
  } catch (err) {
    console.info('OpenAPI Explorer: %c There was an issue while parsing the spec %o ', 'color:orange', err); // eslint-disable-line no-console
    throw err;
  }

  // const pathGroups = groupByPaths(jsonParsedSpec);

  // Tags
  const tags = groupByTags(jsonParsedSpec, sortEndpointsBy, allowDuplicatedPathsByTag, sortTags);

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
    if (serverUrl && !jsonParsedSpec.servers.some(s => s.url === serverUrl || s.computedUrl === serverUrl)) {
      servers = [{ url: serverUrl, computedUrl: serverUrl }].concat(jsonParsedSpec.servers);
    }
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

function groupByTags(openApiSpec, sortEndpointsBy, allowDuplicatedPathsByTag, sortTags = false) {
  const methods = ['get', 'put', 'post', 'delete', 'patch', 'head']; // this is also used for ordering endpoints by methods
  const tags = openApiSpec.tags && Array.isArray(openApiSpec.tags)
    ? openApiSpec.tags.map((t) => ({
      show: true,
      name: v.name.toLowerCase(),
      paths: [],
      expanded: true
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

    methods.forEach((methodName) => {
      let tagObj;
      let tagText;
      let specTagsObj;

      if (openApiSpec.paths[path][methodName]) {
        const fullPath = openApiSpec.paths[path][methodName];

        // If path.methods are tagged, else generate it from path
        if (fullPath.tags && fullPath.tags[0]) {
          tagText = fullPath.tags[0];
          if (openApiSpec.tags) {
            specTagsObj = openApiSpec.tags.find((v) => (v.name === tagText));
          }
        } else {
          let firstWordEndIndex = path.indexOf('/', 1);
          if (firstWordEndIndex === -1) {
            pathTags.push(pathOrHookNameKey);
          } else {
            pathTags.push('General ⦂');
          }
        }
        tagObj = tags.find((v) => v.name === tagText);
        if (!tagObj) {
          tagObj = {
            show: true,
            name: tagText,
            paths: [],
            description: specTagsObj ? specTagsObj.description : '',
            expanded: (specTagsObj ? specTagsObj['x-tag-expanded'] !== false : true),
          };
          tags.push(tagObj);
        }

          tag = tag.toLowerCase();

          if (openApiSpec.tags) {
            tagDescr = openApiSpec.tags.find((v) => (v.name.toLowerCase() === tag));
          }

          tagObj = tags.find((v) => v.name === tag);
          if (!tagObj) {
            tagObj = {
              elementId: `tag--${tag.replace(invalidCharsRegEx, '-')}`,
              name: tag,
              description: tagDescr ? tagDescr.description : '',
              paths: [],
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
        } else {
          finalParameters = fullPath.parameters ? fullPath.parameters.slice(0) : [];
        }
        // Update Responses
        tagObj.paths.push({
          show: true,
          expanded: false,
          expandedAtLeastOnce: false,
          summary,
          method: methodName,
          description: fullPath.description,
          path,
          operationId: fullPath.operationId,
          servers: fullPath.servers ? commonPathProp.servers.concat(fullPath.servers) : commonPathProp.servers,
          parameters: finalParameters,
          requestBody: fullPath.requestBody,
          responses: fullPath.responses,
          callbacks: fullPath.callbacks,
          deprecated: fullPath.deprecated,
          security: fullPath.security,
          commonSummary: commonPathProp.summary,
          commonDescription: commonPathProp.description,
          xCodeSamples: fullPath['x-code-samples'],
        });
      }
    }); // End of Methods
  }
  // sort paths by methods or path within each tags;
  const tagsWithSortedPaths = tags.filter((v) => v.paths && v.paths.length > 0);
  if (sortEndpointsBy === 'method') {
    tagsWithSortedPaths.forEach((v) => {
      if (v.paths) {
        // v.paths.sort((a, b) => a.method.localeCompare(b.method));
        v.paths.sort((a, b) => methods.indexOf(a.method).toString().localeCompare(methods.indexOf(b.method)));
      }
    });
  } else if (sortEndpointsBy === 'summary') {
    tagsWithSortedPaths.forEach((v) => {
      if (v.paths) {
        v.paths.sort((a, b) => (a.summary || a.description || a.path).localeCompare(b.summary || b.description || b.path));
      }
    });
  } else {
    tagsWithSortedPaths.forEach((v) => {
      if (v.paths) {
        v.paths.sort((a, b) => a.path.localeCompare(b.path));
      }
    });
  }
  */

  return tags.filter((tag) => tag.paths && tag.paths.length > 0);
}
