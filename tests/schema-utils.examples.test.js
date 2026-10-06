import test from 'ava';
import { expect } from 'chai';

import { getTypeInfo } from '../src/utils/schema-utils.js';

test('schema-utils.js getTypeInfo returns the examples of a schema as they are', t => {
  expect(getTypeInfo({ type: 'string', examples: ['apple', 'banana', 'pear'] }).example).to.deep.equal(['apple', 'banana', 'pear']);
  expect(getTypeInfo({ type: 'integer', examples: [1, 2, 3] }).example).to.deep.equal([1, 2, 3]);
  expect(getTypeInfo({ type: 'object', examples: [{ id: 1 }, { id: 2 }] }).example).to.deep.equal([{ id: 1 }, { id: 2 }]);
  t.pass();
});

test('schema-utils.js getTypeInfo keeps a single entry of examples as a list', t => {
  expect(getTypeInfo({ type: 'string', examples: ['apple'] }).example).to.deep.equal(['apple']);
  t.pass();
});

test('schema-utils.js getTypeInfo hands the examples to the schema views as a list', t => {
  const info = getTypeInfo({ type: 'string', examples: ['apple', 'banana'] });

  expect(JSON.parse(info.html).example).to.deep.equal(['apple', 'banana']);
  t.pass();
});

test('schema-utils.js getTypeInfo wraps a legacy example as one entry', t => {
  expect(getTypeInfo({ type: 'string', example: 'apple' }).example).to.deep.equal(['apple']);
  // The example value is an array, so the list has one entry and the value stays intact
  expect(getTypeInfo({ type: 'array', items: { type: 'string' }, example: ['a', 'b'] }).example).to.deep.equal([['a', 'b']]);
  expect(getTypeInfo({ type: 'integer', example: 0 }).example).to.deep.equal([0]);
  expect(getTypeInfo({ type: 'boolean', example: false }).example).to.deep.equal([false]);
  t.pass();
});

test('schema-utils.js getTypeInfo prefers the examples over a single example', t => {
  expect(getTypeInfo({ type: 'string', examples: ['apple', 'banana'], example: 'pear' }).example).to.deep.equal(['apple', 'banana']);
  t.pass();
});

test('schema-utils.js getTypeInfo uses a legacy example when the examples list is empty', t => {
  expect(getTypeInfo({ type: 'string', examples: [], example: 'pear' }).example).to.deep.equal(['pear']);
  t.pass();
});

test('schema-utils.js getTypeInfo reads values from an examples map', t => {
  const info = getTypeInfo({
    type: 'string',
    examples: { red: { value: 'red' }, blue: { value: 'blue' }, none: { summary: 'missing value' } }
  });

  expect(info.example).to.deep.equal(['red', 'blue']);
  t.pass();
});

test('schema-utils.js getTypeInfo returns an empty list when a schema has no example', t => {
  expect(getTypeInfo({ type: 'string' }).example).to.deep.equal([]);
  expect(JSON.parse(getTypeInfo({ type: 'string' }).html).example).to.deep.equal([]);
  t.pass();
});

test('schema-utils.js getTypeInfo generates one example only when asked and none is present', t => {
  expect(getTypeInfo({ type: 'string' }, { enableExampleGeneration: true }).example).to.deep.equal(['string']);
  expect(getTypeInfo({ type: 'boolean' }, { enableExampleGeneration: true }).example).to.deep.equal([false]);
  expect(getTypeInfo({ type: 'string', example: 'apple' }, { enableExampleGeneration: true }).example).to.deep.equal(['apple']);
  t.pass();
});
