/* eslint-disable no-use-before-define */
import OpenApiParser from '@apitools/openapi-parser';
import marked from 'marked';
import { invalidCharsRegEx, rapidocApiKey } from '~/utils/common-utils';

export default async function ProcessSpec(specUrl, sortTags = false, sortEndpointsBy, attrApiKey = '', attrApiKeyLocation = '', attrApiKeyValue = '', serverUrl = '', allowDuplicatedPathsByTag = false) {
  let jsonParsedSpec;
  try {
    let specMeta;
    if (typeof specUrl === 'string') {
      specMeta = await OpenApiParser.resolve({ url: specUrl }); // Swagger(specUrl);
    } else {
      specMeta = await OpenApiParser.resolve({ spec: specUrl }); // Swagger({ spec: specUrl });
    }
    jsonParsedSpec = specMeta.spec;
  } catch (err) {
    console.info('RapiDoc: %c There was an issue while parsing the spec %o ', 'color:orangered', err); // eslint-disable-line no-console
  }

  // const pathGroups = groupByPaths(jsonParsedSpec);

  // Tags
  const tags = groupByTags(jsonParsedSpec, sortEndpointsBy, allowDuplicatedPathsByTag, sortTags);

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
        securityObj.in = kv[1].in || 'header';
        securityObj.name = kv[1].name || 'Authorization';
        securityObj.user = '';
        securityObj.password = '';
      } else if (kv[1].type === 'oauth2') {
        securityObj.in = 'header';
        securityObj.name = 'Authorization';
        securityObj.clientId = '';
        securityObj.clientSecret = '';
      }
      securitySchemes.push(securityObj);
    });
  }

  if (attrApiKey && attrApiKeyLocation && attrApiKeyValue) {
    securitySchemes.push({
      apiKeyId: rapidocApiKey,
      description: 'api-key provided in rapidoc element attributes',
      type: 'apiKey',
      oAuthFlow: '',
      name: attrApiKey,
      in: attrApiKeyLocation,
      value: attrApiKeyValue,
      finalKeyValue: attrApiKeyValue,
    });
  }

  // Updated Security Type Display Text based on Type
  securitySchemes.forEach((v) => {
    if (v.type === 'http') {
      v.typeDisplay = v.scheme === 'basic' ? 'HTTP Basic' : 'HTTP Bearer';
    } else if (v.type === 'apiKey') {
      v.typeDisplay = `API Key (${v.name})`;
    } else if (v.type === 'oauth2') {
      v.typeDisplay = `OAuth (${v.apiKeyId})`;
    } else {
      v.typeDisplay = v.type;
    }
  });

  // Servers
  let servers = [];
  if (jsonParsedSpec.servers && Array.isArray(jsonParsedSpec.servers)) {
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
    if (serverUrl) {
      jsonParsedSpec.servers.push({ url: serverUrl, computedUrl: serverUrl });
    }
  } else if (serverUrl) {
    jsonParsedSpec.servers = [{ url: serverUrl, computedUrl: serverUrl }];
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
        cmpDescription = 'Defines a security scheme that can be used by the operations. Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter or as a query parameter), OAuth2\'s common flows(implicit, password, client credentials and authorization code) as defined in RFC6749, and OpenID Connect Discovery.';
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

function groupByTags(openApiSpec, sortEndpointsBy, allowDuplicatedPathsByTag, sortTags = false) {
  const methods = ['get', 'put', 'post', 'delete', 'patch', 'head']; // this is also used for ordering endpoints by methods
  const tags = openApiSpec.tags && Array.isArray(openApiSpec.tags)
    ? openApiSpec.tags.map((v) => ({
      show: true,
      name: v.name.toLowerCase(),
      paths: [],
      expanded: v['x-tag-expanded'] !== false,
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
              show: true,
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

  const tagsWithSortedPaths = tags.filter((tag) => tag.paths && tag.paths.length > 0);
  tagsWithSortedPaths.forEach((tag) => {
    if (sortEndpointsBy === 'method') {
      tag.paths.sort((a, b) => supportedMethods.indexOf(a.method).toString().localeCompare(supportedMethods.indexOf(b.method)));
    } else if (sortEndpointsBy === 'summary') {
      tag.paths.sort((a, b) => (a.shortSummary).localeCompare(b.shortSummary));
    } else {
      tag.paths.sort((a, b) => a.path.localeCompare(b.path));
    }
    tag.firstPathId = tag.paths[0].elementId;
  });
  return sortTags ? tagsWithSortedPaths.sort((a, b) => a.name.localeCompare(b.name)) : tagsWithSortedPaths;
}
