import test from 'ava';
import { expect } from 'chai';

import xmlFormatter from '../src/utils/xml/xml.js';
import { getExampleValuesFromSchema } from '../src/utils/schema-utils.js';

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
