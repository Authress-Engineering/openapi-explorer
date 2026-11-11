import json5 from 'json5';

export const textFileRegex = RegExp('^font/|tar$|zip$|7z$|rtf$|msword$|excel$|/pdf$|/octet-stream$|^application/vnd.');
export const mediaFileRegex = RegExp('^audio/|^image/|^video/');

const serializeFormValue = v => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
// Save single quotes wrapped => 'text' => `"'"text"'"`
const shellEscape = s => s.replace(/'/g, '\'"\'"\'');

/**
 * Builds the multipart/form-data request body and the matching curl arguments.
 * @param {Array<{ name: string, value: any, isArray: boolean, file?: File }>} fields - The form fields in display order
 * @returns {{ body: FormData, curlForm: string }}
 */
export function buildMultipartFormData(fields) {
  const body = new FormData();
  fields.forEach(({ name, value, isArray, file }) => {
    if (!isArray) {
      if (file) {
        body.append(name, file, file.name);
      } else if (value) {
        body.append(name, serializeFormValue(value));
      }
    } else if (value && Array.isArray(value)) {
      value.forEach(v => body.append(name, serializeFormValue(v)));
    }
  });

  // Generate the curl from the FormData so that it always matches what is actually sent
  const curlForm = [...body.entries()].map(([key, value]) => {
    if (value instanceof File) {
      const type = value.type ? `;type=${value.type}` : '';
      return ` \\\n  -F '${shellEscape(`${key}=@${value.name}${type}`)}'`;
    }
    return ` \\\n  --form-string '${shellEscape(`${key}=${value}`)}'`;
  }).join('');
  return { body, curlForm };
}

function buildUrlEncodedFormData(fields) {
  const body = new URLSearchParams();
  fields.forEach(({ name, value, isArray, isFile }) => {
    if (isFile) { return; }
    if (!isArray) {
      if (value) {
        body.append(name, value);
      }
    } else {
      const vals = (value && Array.isArray(value)) ? value.join(',') : '';
      body.append(name, vals);
    }
  });
  return { body, curlData: ` \\\n  -d ${body.toString()}` };
}

function buildDynamicUrlEncodedFormData(jsonValue) {
  if (!jsonValue) {
    return {};
  }
  let parsedObject;
  try {
    parsedObject = JSON.parse(jsonValue);
  } catch (err) {
    console.warn('OpenAPI Explorer: Invalid JSON provided', err); // eslint-disable-line no-console
    return {};
  }
  const body = new URLSearchParams();
  for (const prop in parsedObject) {
    body.append(prop, JSON.stringify(parsedObject[prop]));
  }
  return { body, curlData: ` \\\n  -d ${body.toString()}` };
}

function buildTextBody(mimeType, text) {
  if (!text) {
    return {};
  }
  if (mimeType.includes('json')) {
    try {
      const body = JSON.stringify(json5.parse(text), null, 4);
      return { body, curlData: ` \\\n  -d '${body}'` };
    } catch (err) {
      /* Ignore unparseable JSON, falls back automatically to the original value, which is better than nothing */
    }
  }
  // Save single quotes wrapped => 'text' => `"'"text"'"`
  return { body: text, curlData: ` \\\n  -d '${text.replace(/'/g, '\'"\'"\'')}'` };
}

function buildRequestBody(requestBody) {
  const { mimeType, dynamicFormValue, formFields, text, file } = requestBody;
  if (mimeType.includes('form-urlencoded')) {
    return dynamicFormValue !== undefined ? buildDynamicUrlEncodedFormData(dynamicFormValue) : buildUrlEncodedFormData(formFields);
  }
  if (mimeType.includes('form-data')) {
    return buildMultipartFormData(formFields);
  }
  if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('text')) {
    return buildTextBody(mimeType, text);
  }
  if ((mediaFileRegex.test(mimeType) || textFileRegex.test(mimeType)) && file) {
    return { body: file, curlData: ` \\\n  --data-binary @${file.name}` };
  }
  return {};
}

function appendQueryParam(searchParams, { name, value, isArray, style, explode }, queryParameterMap) {
  if (!isArray) {
    if (value !== '') {
      queryParameterMap[name] = value;
      searchParams.append(name, value);
    }
    return;
  }

  const values = Array.isArray(value) ? value.filter((v) => v !== '') : [];
  queryParameterMap[name] = values;
  if (values.length === 0) {
    return;
  }

  if (style === 'spaceDelimited') {
    searchParams.append(name, values.join(' ').replace(/^\s|\s$/g, ''));
  } else if (style === 'pipeDelimited') {
    searchParams.append(name, values.join('|').replace(/^\||\|$/g, ''));
  } else if (explode === 'true' || explode === true) {
    values.forEach((v) => { searchParams.append(name, v); });
  } else {
    searchParams.append(name, values.join(',').replace(/^,|,$/g, ''));
  }
}

/**
 * Builds the fetch request and the matching curl parts from the current request panel values.
 * @param {Object} request
 * @param {string} request.serverUrl
 * @param {string} request.path
 * @param {string} request.method
 * @param {string} request.baseUrl - Used to resolve relative server urls, i.e. window.location.href
 * @param {string} [request.fetchCredentials]
 * @param {Array<{ name: string, value: string }>} request.pathParams
 * @param {Array<{ name: string, value: string | string[], isArray: boolean, style?: string, explode?: string | boolean }>} request.queryParams
 * @param {Array<{ name: string, value: string }>} request.headerParams
 * @param {Array<{ name: string, in: string, finalKeyValue: string }>} request.apiKeys
 * @param {{ mimeType: string, dynamicFormValue?: string, formFields: Array<{ name: string, value: any, isArray: boolean, isFile: boolean, file?: File }>, text?: string, file?: File }} [request.requestBody]
 */
export function buildFetchRequest({ serverUrl, path, method, baseUrl, fetchCredentials, pathParams, queryParams, headerParams, apiKeys, requestBody }) {
  let pathUrl = `${serverUrl.replace(/\/$/, '')}${path.replaceAll(' ', '')}`;

  // Generate URL using Path Params
  const pathParameterMap = {};
  pathParams.forEach(({ name, value }) => {
    pathParameterMap[name] = value;
    pathUrl = pathUrl.replace(`{${name}}`, encodeURIComponent(value) || '-');
  });

  // Handle relative serverUrls
  if (!pathUrl.startsWith('http')) {
    pathUrl = new URL(pathUrl, baseUrl).toString();
  }

  const fetchUrl = new URL(pathUrl);
  const fetchOptions = {
    method: method.toUpperCase(),
    headers: new Headers()
  };

  const queryParameterMap = {};
  queryParams.forEach(param => appendQueryParam(fetchUrl.searchParams, param, queryParameterMap));

  // Add Authentication api keys if provided
  apiKeys.filter((v) => v.finalKeyValue).forEach((v) => {
    if (v.in === 'query') {
      fetchUrl.searchParams.append(v.name, v.finalKeyValue);
      return;
    }

    // Otherwise put it in the header
    fetchOptions.headers.append(v.name, v.finalKeyValue);
  });

  headerParams.forEach(({ name, value }) => {
    if (value) {
      fetchOptions.headers.append(name, value);
    }
  });

  let curlData = '';
  let curlForm = '';
  if (requestBody) {
    const builtBody = buildRequestBody(requestBody);
    if (builtBody.body !== undefined) {
      fetchOptions.body = builtBody.body;
    }
    curlData = builtBody.curlData || '';
    curlForm = builtBody.curlForm || '';

    // For multipart/form-data don't set the content-type to allow creation of browser generated part boundaries
    if (!requestBody.mimeType.includes('form-data')) {
      fetchOptions.headers.append('Content-Type', requestBody.mimeType);
    }
  }

  if (fetchCredentials) {
    fetchOptions.credentials = fetchCredentials;
  }

  return {
    fetchOptions,
    fetchUrl,
    path: pathParameterMap,
    query: queryParameterMap,
    curlParts: {
      data: curlData,
      form: curlForm
    }
  };
}
