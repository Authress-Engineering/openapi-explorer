import test from 'ava';
import xml from '../../../src/utils/xml/xml.js';

test('no elements', t => {
  t.is(xml(), '');
  t.is(xml([]), '');
  t.is(xml('test'), 'test');
  t.is(xml('scotch & whisky'), 'scotch &amp; whisky');
  t.is(xml('bob\'s escape character'), 'bob&apos;s escape character');
});

test('simple options', t => {
  t.is(xml([{ a: {} }]), '<a/>');
  t.is(xml([{ a: null }]), '<a/>');
  t.is(xml([{ a: [] }]), '<a></a>');
  t.is(xml([{ a: -1 }]), '<a>-1</a>');
  t.is(xml([{ a: false }]), '<a>false</a>');
  t.is(xml([{ a: 'test' }]), '<a>test</a>');
  t.is(xml({ a: {} }), '<a/>');
  t.is(xml({ a: null }), '<a/>');
  t.is(xml({ a: [] }), '<a></a>');
  t.is(xml({ a: -1 }), '<a>-1</a>');
  t.is(xml({ a: false }), '<a>false</a>');
  t.is(xml({ a: 'test' }), '<a>test</a>');
  t.is(xml([{ a: 'test' }, { b: 123 }, { c: -0.5 }]), '<a>test</a><b>123</b><c>-0.5</c>');
});

test('deeply nested objects', t => {
  t.is(xml([{ a: [{ b: [{ c: 1 }, { c: 2 }, { c: 3 }] }] }]), '<a><b><c>1</c><c>2</c><c>3</c></b></a>');
});

test('indents property', t => {
  t.is(xml([{ a: [{ b: [{ c: 1 }, { c: 2 }, { c: 3 }] }] }], true), '<a>\n    <b>\n        <c>1</c>\n        <c>2</c>\n        <c>3</c>\n    </b>\n</a>');
  t.is(xml([{ a: [{ b: [{ c: 1 }, { c: 2 }, { c: 3 }] }] }], '  '), '<a>\n  <b>\n    <c>1</c>\n    <c>2</c>\n    <c>3</c>\n  </b>\n</a>');
  t.is(xml([{ a: [{ b: [{ c: 1 }, { c: 2 }, { c: 3 }] }] }], '\t'), '<a>\n\t<b>\n\t\t<c>1</c>\n\t\t<c>2</c>\n\t\t<c>3</c>\n\t</b>\n</a>');
  t.is(xml({ guid: [{ _attr: { premalink: true } }, 'content'] }, true), '<guid premalink="true">content</guid>');
});

test('supports xml attributes', t => {
  t.is(xml([{ b: { _attr: {} } }]), '<b/>');
  t.is(xml([{
    a: {
      _attr: {
        attribute1: 'some value',
        attribute2: 12345
      }
    }
  }]), '<a attribute1="some value" attribute2="12345"/>');
  t.is(xml([{
    a: [{
      _attr: {
        attribute1: 'some value',
        attribute2: 12345
      }
    }]
  }]), '<a attribute1="some value" attribute2="12345"></a>');
  t.is(xml([{
    a: [{
      _attr: {
        attribute1: 'some value',
        attribute2: 12345
      }
    }, 'content']
  }]), '<a attribute1="some value" attribute2="12345">content</a>');
});

test('supports cdata', t => {
  t.is(xml([{ a: { _cdata: 'This is some <strong>CDATA</strong>' } }]), '<a><![CDATA[This is some <strong>CDATA</strong>]]></a>');
  t.is(xml([{
    a: {
      _attr: { attribute1: 'some value', attribute2: 12345 },
      _cdata: 'This is some <strong>CDATA</strong>'
    }
  }]), '<a attribute1="some value" attribute2="12345"><![CDATA[This is some <strong>CDATA</strong>]]></a>');
  t.is(xml([{ a: { _cdata: 'This is some <strong>CDATA</strong> with ]]> and then again ]]>' } }]), '<a><![CDATA[This is some <strong>CDATA</strong> with ]]]]><![CDATA[> and then again ]]]]><![CDATA[>]]></a>');
});

test('supports encoding', t => {
  t.is(xml([{
    a: [{
      _attr: {
        anglebrackets: 'this is <strong>strong</strong>',
        url: 'http://google.com?s=opower&y=fun'
      }
    }, 'text']
  }]), '<a anglebrackets="this is &lt;strong&gt;strong&lt;/strong&gt;" url="http://google.com?s=opower&amp;y=fun">text</a>');
});

test('xml declaration options', t => {
  t.is(xml([{ a: 'test' }], { declaration: true }), '<?xml version="1.0" encoding="UTF-8"?><a>test</a>');
  t.is(xml([{ a: 'test' }], { declaration: { encoding: 'foo' } }), '<?xml version="1.0" encoding="foo"?><a>test</a>');
  t.is(xml([{ a: 'test' }], { declaration: { standalone: 'yes' } }), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a>test</a>');
  t.is(xml([{ a: 'test' }], { declaration: false }), '<a>test</a>');
  t.is(xml([{ a: 'test' }], { declaration: true, indent: '\n' }), '<?xml version="1.0" encoding="UTF-8"?>\n<a>test</a>');
  t.is(xml([{ a: 'test' }], {}), '<a>test</a>');
});
