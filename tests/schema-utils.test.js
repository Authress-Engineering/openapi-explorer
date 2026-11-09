import test from 'ava';
import { expect } from 'chai';

import xmlFormatter from '../src/utils/xml/xml.js';
import { getExampleValuesFromSchema, getTypeInfo, schemaInObjectNotation } from '../src/utils/schema-utils.js';

test('schema-utils.js getExampleValuesFromSchema', t => {
  const schema = {
    type: 'object',
    required: ['name', 'photoUrls'],
    properties: {
      id: { type: 'integer', format: 'int64' },
      category: {
        type: 'object',
        properties: {
          id: { type: 'integer', format: 'int64' },
          name: { type: 'string' },
        },
        xml: { name: 'Category' },
        $$ref: 'https://petstore.swagger.io/v2/swagger.json#/definitions/Category',
      },
      name: { type: 'string', example: 'doggie' },
      photoUrls: {
        type: 'array',
        xml: { wrapped: true },
        items: { type: 'string', xml: { name: 'photoUrl' } },
      },
      tags: {
        type: 'array',
        xml: { wrapped: true },
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer', format: 'int64' },
            name: { type: 'string' },
          },
          xml: { name: 'Tag' },
          $$ref: 'https://petstore.swagger.io/v2/swagger.json#/definitions/Tag',
        },
      },
      status: {
        type: 'string',
        description: 'pet status in the store',
        enum: ['available', 'pending', 'sold'],
      },
    },
    xml: { name: 'Pet' },
    $$ref: 'https://petstore.swagger.io/v2/swagger.json#/definitions/Pet',
  };
  const result = getExampleValuesFromSchema(schema, { xml: true });
  const formattedResult = xmlFormatter(result, { indent: '  ' });
  const expectedFormattedResult = `<Pet>
  <id>0</id>
  <Category>
    <id>0</id>
    <name>name</name>
  </Category>
  <name>doggie</name>
  <photoUrls>
    <photoUrl>photoUrl</photoUrl>
  </photoUrls>
  <tags>
    <Tag>
      <id>0</id>
      <name>name</name>
    </Tag>
  </tags>
  <status>available</status>
</Pet>`;
  expect(formattedResult).to.eql(expectedFormattedResult);
  t.pass();
});

const patternProperties = { '[a-z]{2}': { type: 'object', properties: { name: { type: 'string' } } } };
const patternKey = '<pattern: [a-z]{2}>';
const findPatternOwner = node => {
  if (!node || typeof node !== 'object') { return undefined; }
  if (node[patternKey]) { return node; }
  return Object.values(node).map(findPatternOwner).find(n => n);
};
[
  ['a multi-type object', { type: ['object', 'null'], patternProperties }],
  ['array items of a multi-type object', { type: 'array', items: { type: ['object', 'null'], patternProperties } }],
  ['additionalProperties of a multi-type object', { type: 'object', additionalProperties: { type: ['object', 'null'], patternProperties } }],
  ['a typed one-of option', { oneOf: [{ type: 'object', patternProperties }, { type: 'null' }] }],
  ['a typed any-of option', { anyOf: [{ type: 'object', patternProperties }, { type: 'string' }] }],
  ['an untyped one-of option', { oneOf: [{ patternProperties }, { type: 'null' }] }],
  ['an untyped any-of option', { anyOf: [{ patternProperties }, { type: 'string' }] }],
  ['a typed all-of member', { allOf: [{ type: 'object', patternProperties }] }],
  ['an untyped all-of member', { allOf: [{ patternProperties }] }],
  ['an untyped object', { patternProperties }]
].forEach(([name, schema]) => {
  test(`schema-utils.js schemaInObjectNotation renders patternProperties of ${name}`, t => {
    const owner = findPatternOwner(schemaInObjectNotation(schema, {}));
    expect(owner, 'pattern key rendered').to.not.equal(undefined);
    expect(owner[patternKey]).to.have.property('name');
    t.pass();
  });
});

const multiTypeProperty = {
  type: ['array', 'object', 'integer', 'null'],
  title: 'Tags',
  description: 'Property description',
  deprecated: true,
  uniqueItems: true,
  minItems: 1,
  minimum: 0,
  items: { type: 'object', description: 'Item description', properties: { id: { type: 'integer' } } },
  properties: { name: { type: 'string' } }
};
const optionsOf = result => Object.entries(Object.entries(result).find(([key]) => key.startsWith('::ONE~OF'))[1]).filter(([key]) => key.startsWith('::OPTION')).map(([, option]) => option);

test('schema-utils.js schemaInObjectNotation puts title, description and deprecation of a multi-type property on the property', t => {
  const result = schemaInObjectNotation(multiTypeProperty, {});
  expect(result['::title']).to.equal('Tags');
  expect(result['::description']).to.equal('Property description');
  expect(result['::deprecated']).to.equal(true);
  t.pass();
});

test('schema-utils.js schemaInObjectNotation does not copy the property description or deprecation down to the type options', t => {
  const [arrayOption, objectOption, ...primitiveOptions] = optionsOf(schemaInObjectNotation(multiTypeProperty, {}));
  expect(arrayOption['::description']).to.equal('Item description');
  expect(arrayOption['::deprecated'] || false).to.equal(false);
  expect(objectOption['::description'] || '').to.equal('');
  expect(objectOption['::deprecated'] || false).to.equal(false);
  primitiveOptions.filter(o => o.startsWith('{')).map(o => JSON.parse(o)).forEach(option => {
    expect(option.schemaDescription).to.equal('');
    expect(option.schemaTitle).to.equal('');
    expect(option.deprecated).to.equal(false);
  });
  t.pass();
});

test('schema-utils.js schemaInObjectNotation shows constraints only on the type option they apply to', t => {
  const [arrayOption, objectOption, ...primitiveOptions] = optionsOf(schemaInObjectNotation(multiTypeProperty, {}));
  expect(arrayOption['::metadata'].constraints).to.include('Requires unique items');
  expect(objectOption['::metadata']?.constraints || []).to.eql([]);
  const integerOption = primitiveOptions.filter(o => o.startsWith('{')).map(o => JSON.parse(o)).find(o => o.type.includes('integer'));
  expect(integerOption.constraints).to.eql(['Range: [0,)']);
  t.pass();
});

test('schema-utils.js schemaInObjectNotation marks a deprecated one-of property as deprecated', t => {
  const result = schemaInObjectNotation({ deprecated: true, oneOf: [{ type: 'string' }, { type: 'integer', deprecated: true }] }, {});
  expect(result['::deprecated']).to.equal(true);
  const [stringOption, integerOption] = optionsOf(result).map(o => JSON.parse(o));
  expect(stringOption.deprecated).to.equal(false);
  expect(integerOption.deprecated).to.equal(true);
  t.pass();
});

test('schema-utils.js getTypeInfo shows the unique items constraint only for array types', t => {
  expect(getTypeInfo({ type: ['integer', 'string', 'null'], uniqueItems: true }).constraints).to.eql([]);
  expect(getTypeInfo({ type: 'array', items: { type: 'string' }, uniqueItems: true }).constraints).to.eql(['Requires unique items']);
  expect(getTypeInfo({ type: 'string[]┃null', uniqueItems: true }).constraints).to.eql(['Requires unique items']);
  t.pass();
});
