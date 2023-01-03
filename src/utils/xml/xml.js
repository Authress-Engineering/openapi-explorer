/* eslint-disable no-underscore-dangle */

const XML_CHARACTER_MAP = {
  '&': '&amp;',
  '"': '&quot;',
  "'": '&apos;',
  '<': '&lt;',
  '>': '&gt;'
};

function escapeForXML(string) {
  return string && string.replace
    ? string.replace(/([&"<>'])/g, function(str, item) {
      return XML_CHARACTER_MAP[item];
    })
    : string;
}

const DEFAULT_INDENT = '    ';

export default function xml(input, rawOptions) {
  let options = rawOptions;
  if (typeof options !== 'object') {
    options = {
      indent: options
    };
  }

  let output = '';
  const indent = !options.indent ? ''
    : options.indent === true ? DEFAULT_INDENT
      : options.indent;

  function append(_, out) {
    if (out !== undefined) {
      output += out;
    }
  }

  function add(value, last) {
    format(append, resolve(value, indent, indent ? 1 : 0), last);
  }

  function addXmlDeclaration(declaration) {
    const encoding = declaration.encoding || 'UTF-8';
    const attr = { version: '1.0', encoding: encoding };

    if (declaration.standalone) {
      attr.standalone = declaration.standalone;
    }

    add({ '?xml': { _attr: attr } });
    output = output.replace('/>', '?>');
  }

  if (options.declaration) {
    addXmlDeclaration(options.declaration);
  }

  if (input && input.forEach) {
    input.forEach(function(value, i) {
      add(value, i + 1 === input.length);
    });
  } else {
    add(input, true);
  }

  return output;
}

function create_indent(character, count) {
  return (new Array(count || 0).join(character || ''));
}

function resolve(data, indent, indent_count_raw) {
  const indent_count = indent_count_raw || 0;
  const indent_spaces = create_indent(indent, indent_count);
  let name;
  let values = data;
  const interrupt = false;

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    name = keys[0];
    values = data[name];

    if (values && values._elem) {
      values._elem.name = name;
      values._elem.icount = indent_count;
      values._elem.indent = indent;
      values._elem.indents = indent_spaces;
      values._elem.interrupt = values;
      return values._elem;
    }
  }

  const attributes = [];
  const content = [];

  let isStringContent;

  function get_attributes(obj) {
    const keys = Object.keys(obj);
    keys.forEach(function(key) {
      attributes.push(attribute(key, obj[key]));
    });
  }

  switch (typeof values) {
    case 'object':
      if (values === null) {break;}

      if (values._attr) {
        get_attributes(values._attr);
      }

      if (values._cdata) {
        content.push(
          `${(`<![CDATA[${values._cdata}`).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`
        );
      }

      if (values.forEach) {
        isStringContent = false;
        content.push('');
        values.forEach(function(value) {
          if (typeof value === 'object') {
            const _name = Object.keys(value)[0];

            if (_name === '_attr') {
              get_attributes(value._attr);
            } else {
              content.push(resolve(
                value, indent, indent_count + 1));
            }
          } else {
            // string
            content.pop();
            isStringContent = true;
            content.push(escapeForXML(value));
          }
        });
        if (!isStringContent) {
          content.push('');
        }
      }
      break;

    default:
      // string
      content.push(escapeForXML(values));
  }

  return {
    name: name,
    interrupt: interrupt,
    attributes: attributes,
    content: content,
    icount: indent_count,
    indents: indent_spaces,
    indent: indent
  };
}

function format(append, elem, end) {
  if (typeof elem !== 'object') {
    append(false, elem);
    return;
  }

  const len = elem.interrupt ? 1 : elem.content.length;

  function proceed() {
    while (elem.content.length) {
      const value = elem.content.shift();

      if (value === undefined) {continue;}
      if (interrupt(value)) {return;}

      format(append, value);
    }

    append(false, (len > 1 ? elem.indents : '')
            + (elem.name ? `</${elem.name}>` : '')
            + (elem.indent && !end ? '\n' : ''));
  }

  function interrupt(value) {
    if (value.interrupt) {
      value.interrupt.append = append;
      value.interrupt.end = proceed;
      value.interrupt = false;
      append(true);
      return true;
    }
    return false;
  }

  append(false, elem.indents
        + (elem.name ? `<${elem.name}` : '')
        + (elem.attributes.length ? ` ${elem.attributes.join(' ')}` : '')
        + (len ? (elem.name ? '>' : '') : (elem.name ? '/>' : ''))
        + (elem.indent && len > 1 ? '\n' : ''));

  if (!len) {
    append(false, elem.indent ? '\n' : '');
    return;
  }

  if (!interrupt(elem)) {
    proceed();
  }
}

function attribute(key, value) {
  return `${key}=` + `"${escapeForXML(value)}"`;
}

