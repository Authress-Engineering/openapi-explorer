import test from 'ava';
import { expect } from 'chai';

import xmlFormatter from '../src/utils/xml/xml.js';
import { getExampleValuesFromSchema, schemaInObjectNotation } from '../src/utils/schema-utils.js';

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

test('schema-utils.js schemaInObjectNotation keeps patternProperties of a nullable object', t => {
  const schema = {
    type: ['object', 'null'],
    patternProperties: { '[a-z]{2}': { type: 'object', properties: { name: { type: 'string' } } } }
  };
  const result = schemaInObjectNotation(schema, {});
  const objectOption = Object.values(result['::ONE~OF']).find(option => option['::type'] === 'object');
  expect(objectOption).to.have.property('<pattern: [a-z]{2}>');
  expect(objectOption['<pattern: [a-z]{2}>']).to.have.property('name');
  t.pass();
});

test('schema-utils.js schemaInObjectNotation puts the description of a multi-type property on the property only', t => {
  const schema = { type: ['object', 'null'], description: 'Localized variants', patternProperties: { '[a-z]{2}': { type: 'string' } } };
  const result = schemaInObjectNotation(schema, {});
  expect(result['::description']).to.equal('Localized variants');
  const objectOption = Object.values(result['::ONE~OF']).find(option => option['::type'] === 'object');
  expect(objectOption['::description'] || '').to.equal('');
  t.pass();
});

test('schema-utils.js schemaInObjectNotation renders the null option of a multi-type property without description', t => {
  const schema = { type: ['object', 'null'], description: 'Localized variants', patternProperties: { '[a-z]{2}': { type: 'string' } } };
  const result = schemaInObjectNotation(schema, {});
  const primitiveOptions = Object.values(result['::ONE~OF']).filter(option => typeof option === 'string' && option.startsWith('{'));
  expect(primitiveOptions).to.not.be.empty;
  primitiveOptions.forEach(option => expect(JSON.parse(option).schemaDescription || '').to.equal(''));
  t.pass();
});
