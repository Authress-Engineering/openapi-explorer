import test from 'ava';
import http from 'http';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sinon from 'sinon';

import { buildFetchRequest, buildMultipartFormData } from '../../src/utils/request-utils.js';
import { schemaInObjectNotation } from '../../src/utils/schema-utils.js';

const execFileAsync = promisify(execFile);

// The generated curl is verified by actually running it through bash + curl against a local echo server, and then parsing the multipart body that curl sent.
// This validates shell quoting and curl's own -F parsing, instead of asserting on one specific string format.
let server;
let serverUrl;
let workingDirectory;

const testFiles = [
  new File(['png-content'], 'photo.png', { type: 'image/png' }),
  new File(['second-content'], 'second.txt', { type: 'text/plain' }),
  new File(['spaced-content'], 'my photo.png', { type: 'image/png' }),
  new File(['quoted-content'], 'my "quoted" photo.png', { type: 'image/png' }),
  new File(['apostrophe-content'], "it's.png", { type: 'image/png' })
];
const getFile = name => testFiles.find(f => f.name === name);

test.before(async () => {
  workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'openapi-explorer-form-data-'));
  for (const file of testFiles) {
    await fs.writeFile(path.join(workingDirectory, file.name), Buffer.from(await file.arrayBuffer()));
  }

  server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ contentType: req.headers['content-type'], body: Buffer.concat(chunks).toString('base64') }));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  serverUrl = `http://127.0.0.1:${server.address().port}/`;
});

test.after.always(async () => {
  await new Promise(resolve => server.close(resolve));
  await fs.rm(workingDirectory, { recursive: true, force: true });
});

async function normalizeEntries(formData) {
  const entries = [];
  for (const [name, value] of formData.entries()) {
    entries.push([name, typeof value === 'string' ? value : { fileName: value.name, content: await value.text() }]);
  }
  return entries;
}

async function getCurlParts(curlForm) {
  if (!curlForm) {
    return [];
  }
  const { stdout } = await execFileAsync('bash', ['-c', `curl -sS --fail '${serverUrl}'${curlForm}`], { cwd: workingDirectory, env: { PATH: process.env.PATH, HOME: '/home/test-user' } });
  const { contentType, body } = JSON.parse(stdout);
  const formData = await new Response(Buffer.from(body, 'base64'), { headers: { 'Content-Type': contentType } }).formData();
  return normalizeEntries(formData);
}

async function assertMultipart(t, fields, expectedParts) {
  const { body, curlForm } = buildMultipartFormData(fields);
  t.true(body instanceof FormData);
  t.deepEqual(await normalizeEntries(body), expectedParts, 'fetch FormData body');

  let curlParts;
  try {
    curlParts = await getCurlParts(curlForm);
  } catch (error) {
    t.fail(`Generated curl failed to execute: ${error.stderr || error.message}\n${curlForm}`);
    return;
  }
  t.deepEqual(curlParts, expectedParts, `curl form parts\n${curlForm}`);
}

const field = (name, value) => ({ name, value, isArray: false });
const arrayField = (name, value) => ({ name, value, isArray: true });
const fileField = (name, fileName) => ({ name, value: fileName ? `C:\\fakepath\\${fileName}` : '', isArray: false, file: fileName ? getFile(fileName) : undefined });
const filePart = fileName => ({ fileName, content: `${fileName === 'photo.png' ? 'png' : fileName === 'second.txt' ? 'second' : fileName === 'my photo.png' ? 'spaced' : fileName.startsWith('it') ? 'apostrophe' : 'quoted'}-content` });

// --- Empty ---
test('no fields produces an empty body and no curl form', async t => {
  const { body, curlForm } = buildMultipartFormData([]);
  t.deepEqual(await normalizeEntries(body), []);
  t.is(curlForm, '');
});

test('empty primitive values are skipped', t => assertMultipart(t, [field('name', ''), field('other', undefined)], []));

test('empty arrays are skipped', t => assertMultipart(t, [arrayField('tags', [])], []));

test('file input with no file selected is skipped', t => assertMultipart(t, [fileField('upload')], []));

// --- Primitives ---
test('single primitive', t => assertMultipart(t, [field('name', 'value')], [['name', 'value']]));

test('multiple primitives preserve order', t => assertMultipart(t,
  [field('b', '2'), field('a', '1'), field('c', '3')],
  [['b', '2'], ['a', '1'], ['c', '3']]));

test('primitive with spaces', t => assertMultipart(t, [field('name', 'hello world')], [['name', 'hello world']]));

test('primitive with unicode', t => assertMultipart(t, [field('name', 'café 日本 🚀')], [['name', 'café 日本 🚀']]));

test('primitive with double quotes', t => assertMultipart(t, [field('name', 'say "hi"')], [['name', 'say "hi"']]));

test('primitive with single quotes', t => assertMultipart(t, [field('name', "it's")], [['name', "it's"]]));

test('primitive with a shell variable is not expanded', t => assertMultipart(t, [field('name', '$HOME')], [['name', '$HOME']]));

test('primitive with a command substitution is not executed', t => assertMultipart(t,
  [field('a', '`echo pwned`'), field('b', '$(echo pwned)')],
  [['a', '`echo pwned`'], ['b', '$(echo pwned)']]));

test('primitive with backslashes', t => assertMultipart(t, [field('path', 'C:\\Users\\test\\$file')], [['path', 'C:\\Users\\test\\$file']]));

test('primitive with a newline', t => assertMultipart(t, [field('name', 'line1\nline2')], [['name', 'line1\nline2']]));

test('primitive starting with @ is not read as a file by curl', t => assertMultipart(t, [field('handle', '@photo.png')], [['handle', '@photo.png']]));

test('primitive starting with < is not read as file contents by curl', t => assertMultipart(t, [field('html', '<photo.png')], [['html', '<photo.png']]));

test('primitive containing ;type= is not treated as a curl part option', t => assertMultipart(t, [field('name', 'value;type=text/html')], [['name', 'value;type=text/html']]));

test('primitive containing semicolons and commas', t => assertMultipart(t, [field('name', 'a;b,c')], [['name', 'a;b,c']]));

test('primitive containing an equals sign', t => assertMultipart(t, [field('query', 'a=b&c=d')], [['query', 'a=b&c=d']]));

// --- Keys ---
test('pattern property key with special characters', t => assertMultipart(t,
  [field('x-"custom" $key\'s', 'value')],
  [['x-"custom" $key\'s', 'value']]));

// --- Arrays of primitives ---
test('array of primitives sends one part per item with the same key', t => assertMultipart(t,
  [arrayField('tags', ['a', 'b', 'c'])],
  [['tags', 'a'], ['tags', 'b'], ['tags', 'c']]));

test('array with a single item', t => assertMultipart(t, [arrayField('tags', ['only'])], [['tags', 'only']]));

test('array items containing commas are not merged or split', t => assertMultipart(t,
  [arrayField('tags', ['a,b', 'c'])],
  [['tags', 'a,b'], ['tags', 'c']]));

test('array items with special characters', t => assertMultipart(t,
  [arrayField('tags', ['say "hi"', "it's", '$HOME', '@photo.png'])],
  [['tags', 'say "hi"'], ['tags', "it's"], ['tags', '$HOME'], ['tags', '@photo.png']]));

// --- Objects ---
test('object value is serialized as JSON', t => assertMultipart(t,
  [field('metadata', { fileName: 'report.pdf', fileSize: 1024 })],
  [['metadata', '{"fileName":"report.pdf","fileSize":1024}']]));

test('nested object value is serialized as JSON', t => assertMultipart(t,
  [field('config', { a: { b: { c: [1, 2, { d: "it's \"deep\"" }] } }, e: null, f: true })],
  [['config', '{"a":{"b":{"c":[1,2,{"d":"it\'s \\"deep\\""}]}},"e":null,"f":true}']]));

test('array of objects sends one JSON part per item', t => assertMultipart(t,
  [arrayField('items', [{ id: 1, name: 'one' }, { id: 2, name: "two's" }])],
  [['items', '{"id":1,"name":"one"}'], ['items', '{"id":2,"name":"two\'s"}']]));

test('array of nested arrays sends one JSON part per item', t => assertMultipart(t,
  [arrayField('matrix', [[1, 2], [3, 4]])],
  [['matrix', '[1,2]'], ['matrix', '[3,4]']]));

// --- Files ---
test('single file', t => assertMultipart(t, [fileField('upload', 'photo.png')], [['upload', filePart('photo.png')]]));

test('multiple file inputs with the same key', t => assertMultipart(t,
  [fileField('uploads', 'photo.png'), fileField('uploads', 'second.txt')],
  [['uploads', filePart('photo.png')], ['uploads', filePart('second.txt')]]));

test('file name with spaces', t => assertMultipart(t, [fileField('upload', 'my photo.png')], [['upload', filePart('my photo.png')]]));

test('file name with single quotes', t => assertMultipart(t, [fileField('upload', "it's.png")], [['upload', filePart("it's.png")]]));

test('file name with double quotes', t => assertMultipart(t, [fileField('upload', 'my "quoted" photo.png')], [['upload', filePart('my "quoted" photo.png')]]));

// --- Mixed ---
test('mixed fields preserve order across types', t => assertMultipart(t, [
  field('name', 'test'),
  fileField('upload', 'photo.png'),
  arrayField('tags', ['a', 'b']),
  field('metadata', { x: 1 }),
  field('empty', '')
], [
  ['name', 'test'],
  ['upload', filePart('photo.png')],
  ['tags', 'a'],
  ['tags', 'b'],
  ['metadata', '{"x":1}']
]));

// --- Specification based ---
test('string property with contentMediaType application/json sends the typed JSON unchanged', async t => {
  /*
   openapi: 3.2.0
   paths:
     "/api/v3/attachments/prepare":
       post:
         requestBody:
           content:
             multipart/form-data:
               schema:
                 type: object
                 properties:
                   metadata:
                     type: string
                     contentMediaType: application/json
                     contentSchema:
                       type: object
                       properties:
                         fileName: { type: string }
                         fileSize: { type: integer, minimum: 0 }
  */
  const schema = {
    type: 'object',
    properties: {
      metadata: {
        type: 'string',
        contentMediaType: 'application/json',
        contentSchema: { type: 'object', properties: { fileName: { type: 'string' }, fileSize: { type: 'integer', minimum: 0 } } }
      }
    }
  };
  // The form renders `metadata` as a single (non array) text input, so the user types the JSON in directly
  const metadataSchema = JSON.parse(schemaInObjectNotation(schema, {}).metadata);
  t.is(metadataSchema.type, 'string');

  const typedJson = '{"fileName":"report.pdf","fileSize":1024}';
  await assertMultipart(t, [field('metadata', typedJson)], [['metadata', typedJson]]);
});

// --- buildFetchRequest ---
const buildRequest = (overrides = {}) => buildFetchRequest({
  serverUrl: 'https://api.example.com/',
  path: '/items',
  method: 'post',
  baseUrl: 'https://docs.example.com/explorer/',
  pathParams: [],
  queryParams: [],
  headerParams: [],
  apiKeys: [],
  ...overrides
});

test('buildFetchRequest: method is upper cased and there is no body by default', t => {
  const { fetchOptions, fetchUrl, path: pathParameterMap, query, curlParts } = buildRequest();
  t.is(fetchOptions.method, 'POST');
  t.is(fetchUrl.toString(), 'https://api.example.com/items');
  t.is(fetchOptions.body, undefined);
  t.deepEqual([...fetchOptions.headers.entries()], []);
  t.deepEqual(pathParameterMap, {});
  t.deepEqual(query, {});
  t.deepEqual(curlParts, { data: '', form: '' });
});

test('buildFetchRequest: relative server url is resolved against the base url', t => {
  const { fetchUrl } = buildRequest({ serverUrl: '/api', path: '/items' });
  t.is(fetchUrl.toString(), 'https://docs.example.com/api/items');
});

test('buildFetchRequest: spaces are removed from the path', t => {
  t.is(buildRequest({ path: '/items / all' }).fetchUrl.toString(), 'https://api.example.com/items/all');
});

test('buildFetchRequest: path params are encoded and empty ones replaced with -', t => {
  const { fetchUrl, path: pathParameterMap } = buildRequest({
    path: '/users/{userId}/items/{itemId}',
    pathParams: [{ name: 'userId', value: 'a/b c' }, { name: 'itemId', value: '' }]
  });
  t.is(fetchUrl.toString(), 'https://api.example.com/users/a%2Fb%20c/items/-');
  t.deepEqual(pathParameterMap, { userId: 'a/b c', itemId: '' });
});

test('buildFetchRequest: primitive query params skip empty values', t => {
  const { fetchUrl, query } = buildRequest({
    queryParams: [{ name: 'q', value: 'a b&c', isArray: false }, { name: 'empty', value: '', isArray: false }]
  });
  t.deepEqual([...fetchUrl.searchParams.entries()], [['q', 'a b&c']]);
  t.deepEqual(query, { q: 'a b&c' });
});

test('buildFetchRequest: array query params serialization styles', t => {
  const value = ['a', '', 'b'];
  const { fetchUrl, query } = buildRequest({
    queryParams: [
      { name: 'form', value, isArray: true },
      { name: 'exploded', value, isArray: true, explode: 'true' },
      { name: 'space', value, isArray: true, style: 'spaceDelimited' },
      { name: 'pipe', value, isArray: true, style: 'pipeDelimited' },
      { name: 'none', value: [], isArray: true }
    ]
  });
  t.deepEqual([...fetchUrl.searchParams.entries()], [['form', 'a,b'], ['exploded', 'a'], ['exploded', 'b'], ['space', 'a b'], ['pipe', 'a|b']]);
  t.deepEqual(query, { form: ['a', 'b'], exploded: ['a', 'b'], space: ['a', 'b'], pipe: ['a', 'b'], none: [] });
});

test('buildFetchRequest: api keys go to the query or headers and empty keys are skipped', t => {
  const { fetchUrl, fetchOptions } = buildRequest({
    apiKeys: [{ name: 'api_key', in: 'query', finalKeyValue: 'q-key' }, { name: 'Authorization', in: 'header', finalKeyValue: 'Bearer token' }, { name: 'X-Empty', in: 'header', finalKeyValue: '' }]
  });
  t.deepEqual([...fetchUrl.searchParams.entries()], [['api_key', 'q-key']]);
  t.deepEqual([...fetchOptions.headers.entries()], [['authorization', 'Bearer token']]);
});

test('buildFetchRequest: header params skip empty values', t => {
  const { fetchOptions } = buildRequest({ headerParams: [{ name: 'X-Request-Id', value: '123' }, { name: 'X-Empty', value: '' }] });
  t.deepEqual([...fetchOptions.headers.entries()], [['x-request-id', '123']]);
});

test('buildFetchRequest: fetch credentials are passed through', t => {
  t.is(buildRequest({ fetchCredentials: 'include' }).fetchOptions.credentials, 'include');
  t.is(buildRequest().fetchOptions.credentials, undefined);
});

const requestBody = (mimeType, overrides = {}) => ({ mimeType, formFields: [], ...overrides });

test('buildFetchRequest: json body is normalized from json5', t => {
  const { fetchOptions, curlParts } = buildRequest({ requestBody: requestBody('application/json', { text: "{ name: 'test', }" }) });
  t.is(fetchOptions.body, '{\n    "name": "test"\n}');
  t.is(fetchOptions.headers.get('content-type'), 'application/json');
  t.is(curlParts.data, ' \\\n  -d \'{\n    "name": "test"\n}\'');
});

test('buildFetchRequest: unparseable json body is sent as is', t => {
  const { fetchOptions, curlParts } = buildRequest({ requestBody: requestBody('application/json', { text: "{ it's broken" }) });
  t.is(fetchOptions.body, "{ it's broken");
  t.is(curlParts.data, ' \\\n  -d \'{ it\'"\'"\'s broken\'');
});

test('buildFetchRequest: text and xml bodies are sent as is', t => {
  const { fetchOptions } = buildRequest({ requestBody: requestBody('application/xml', { text: '<a>1</a>' }) });
  t.is(fetchOptions.body, '<a>1</a>');
  t.is(fetchOptions.headers.get('content-type'), 'application/xml');
});

test('buildFetchRequest: empty text body sends no body but still sets the content type', t => {
  const { fetchOptions, curlParts } = buildRequest({ requestBody: requestBody('application/json', { text: '' }) });
  t.is(fetchOptions.body, undefined);
  t.is(fetchOptions.headers.get('content-type'), 'application/json');
  t.is(curlParts.data, '');
});

test('buildFetchRequest: binary file body', t => {
  const file = getFile('photo.png');
  const { fetchOptions, curlParts } = buildRequest({ requestBody: requestBody('image/png', { file }) });
  t.is(fetchOptions.body, file);
  t.is(fetchOptions.headers.get('content-type'), 'image/png');
  t.is(curlParts.data, ' \\\n  --data-binary @photo.png');
});

test('buildFetchRequest: url encoded form fields skip files and join arrays', t => {
  const { fetchOptions, curlParts } = buildRequest({
    requestBody: requestBody('application/x-www-form-urlencoded', {
      formFields: [field('name', 'a b'), field('empty', ''), arrayField('tags', ['x', 'y']), { ...fileField('upload', 'photo.png'), isFile: true }]
    })
  });
  t.true(fetchOptions.body instanceof URLSearchParams);
  t.is(fetchOptions.body.toString(), 'name=a+b&tags=x%2Cy');
  t.is(fetchOptions.headers.get('content-type'), 'application/x-www-form-urlencoded');
  t.is(curlParts.data, ' \\\n  -d name=a+b&tags=x%2Cy');
});

test('buildFetchRequest: dynamic url encoded form is built from the JSON object', t => {
  const { fetchOptions } = buildRequest({ requestBody: requestBody('application/x-www-form-urlencoded', { dynamicFormValue: '{"a":"b","c":[1,2]}' }) });
  t.is(fetchOptions.body.toString(), 'a=%22b%22&c=%5B1%2C2%5D');
});

test('buildFetchRequest: invalid dynamic url encoded form sends no body', t => {
  const consoleMock = sinon.mock(console);
  consoleMock.expects('warn').once().withArgs('OpenAPI Explorer: Invalid JSON provided', sinon.match.instanceOf(SyntaxError));
  try {
    const { fetchOptions, curlParts } = buildRequest({ requestBody: requestBody('application/x-www-form-urlencoded', { dynamicFormValue: '{ invalid' }) });
    t.is(fetchOptions.body, undefined);
    t.is(curlParts.data, '');
    consoleMock.verify();
  } finally {
    consoleMock.restore();
  }
});

test('buildFetchRequest: multipart form data does not set the content type and uses the multipart builder', async t => {
  const { fetchOptions, curlParts } = buildRequest({ requestBody: requestBody('multipart/form-data', { formFields: [field('name', 'value')] }) });
  t.true(fetchOptions.body instanceof FormData);
  t.is(fetchOptions.headers.get('content-type'), null);
  t.deepEqual(await normalizeEntries(fetchOptions.body), [['name', 'value']]);
  t.deepEqual(await getCurlParts(curlParts.form), [['name', 'value']]);
  t.is(curlParts.data, '');
});
