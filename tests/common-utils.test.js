import test from 'ava';
import { expect } from 'chai';

import { convertToDisplayString, formatExamples } from '../src/utils/common-utils.js';

test('common-utils.js formatExamples separates multiple examples', t => {
  expect(formatExamples(['apple', 'banana', 'pear'])).to.equal('apple ┃ banana ┃ pear');
  t.pass();
});

test('common-utils.js formatExamples keeps a single entry as is', t => {
  expect(formatExamples(['apple'])).to.equal('apple');
  t.pass();
});

test('common-utils.js formatExamples writes examples which are not text as JSON', t => {
  expect(formatExamples([1, 2, 3])).to.equal('1 ┃ 2 ┃ 3');
  expect(formatExamples([true, null])).to.equal('true ┃ null');
  expect(formatExamples([{ id: 1 }, { id: 2 }])).to.equal('{"id":1} ┃ {"id":2}');
  expect(formatExamples([['a', 'b'], ['c']])).to.equal('["a","b"] ┃ ["c"]');
  t.pass();
});

test('common-utils.js formatExamples gives an empty list no text', t => {
  expect(formatExamples([])).to.equal('');
  t.pass();
});

test('common-utils.js formatExamples prints one legacy example, kept as a one entry list, as text', t => {
  expect(formatExamples(['apple'])).to.equal('apple');
  expect(formatExamples([5])).to.equal('5');
  expect(formatExamples([''])).to.equal('');
  expect(formatExamples([{ id: 1 }])).to.equal('{"id":1}');
  expect(formatExamples([['a', 'b']])).to.equal('["a","b"]');
  t.pass();
});

test('common-utils.js convertToDisplayString keeps text as is and writes any other value as JSON', t => {
  expect(convertToDisplayString('apple')).to.equal('apple');
  expect(convertToDisplayString('')).to.equal('');
  expect(convertToDisplayString(0)).to.equal('0');
  expect(convertToDisplayString(false)).to.equal('false');
  expect(convertToDisplayString(null)).to.equal('null');
  expect(convertToDisplayString(['a', 'b'])).to.equal('["a","b"]');
  expect(convertToDisplayString({ id: 1 })).to.equal('{"id":1}');
  t.pass();
});
