import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import { expandN } from 'regex-to-strings';
import xmlFormatter from './xml/xml.js';

// When the type is not known for a property set the displayed type to be this:
const IS_MISSING_TYPE_INFO_TYPE = '';
const EXAMPLE_VALUE_FOR_MISSING_TYPE = '';

/* Generates an schema object containing type and constraint info */
export function getTypeInfo(schema, options = { includeNulls: false }) {
  if (!schema) {
    return undefined;
  }

  let dataType = IS_MISSING_TYPE_INFO_TYPE;
  let format = schema.format || schema.items?.format || '';
  if (schema.circularReference) {
    dataType = `{recursive: ${schema.circularReference.name}} `;
  } else if (schema.type) {
    const arraySchema = Array.isArray(schema.type) ? schema.type : (typeof schema.type === 'string' ? schema.type.split('┃') : schema.type);
    dataType = Array.isArray(arraySchema) ? arraySchema.filter((s) => s !== 'null' || options.includeNulls).join('┃') : schema.type;
    ['string', 'number'].forEach(type => {
      dataType = dataType.replace(type, typeof schema.const !== 'undefined' && 'const' || schema.enum && `${type} enum` || schema.format || type);
    });

    if (schema.nullable && options.includeNulls) {
      dataType += '┃null';
    }
    if (dataType.includes('┃null') && schema.format) {
      format += '┃null';
    }
  }

  const info = {
    type: dataType,
    format,
    cssType: dataType.replace(/┃.*/g, '').replace(/[^a-zA-Z0-9+\s]/g, '').toLowerCase(),
    pattern: (schema.pattern && !schema.enum) ? schema.pattern.replace(/(^\^)|(\$$)/g, '') : '',
    readOrWriteOnly: schema.readOnly && '🆁' || schema.writeOnly && '🆆' || '',
    deprecated: !!schema.deprecated,
    example: Array.isArray(schema.example) ? schema.example : (typeof schema.example !== 'undefined' ? `${schema.example}` : ''),
    default: schema.default || '',
    title: schema.title || '',
    description: schema.description || '',
    constraints: [],
    allowedValues: schema.const ?? (Array.isArray(schema.enum) ? schema.enum.join('┃') : ''),
    arrayType: ''
  };

  if (dataType === 'array' && schema.items) {
    const arrayItemType = schema.items.type;
    const arrayItemDefault = schema.items.default ?? schema.default ?? '';

    info.arrayType = `${schema.type} of ${Array.isArray(arrayItemType) ? arrayItemType.join('') : arrayItemType}`;
    info.default = arrayItemDefault;
    info.allowedValues = schema.const ?? (Array.isArray(schema.items.enum) ? schema.items.enum.join('┃') : '');
  }

  if (schema.uniqueItems) {
    info.constraints.push('Requires unique items');
  }

  if (dataType.match(/integer|number/g)) {
    const minimum = schema.minimum ?? schema.exclusiveMinimum;
    const maximum = schema.maximum ?? schema.exclusiveMaximum;
    const leftBound = schema.minimum !== undefined ? '[' : '(';
    const rightBound = schema.maximum !== undefined ? ']' : ')';
    if (typeof minimum === 'number' || typeof maximum === 'number') {
      info.constraints.push(`Range: ${leftBound}${minimum ?? ''},${maximum ?? ''}${rightBound}`);
    }
    if (schema.multipleOf !== undefined) {
      info.constraints.push(`Multiples: ${schema.multipleOf}`);
    }
  }
  if (dataType.match(/string/g)) {
    if (schema.minLength !== undefined && schema.maxLength !== undefined) {
      info.constraints.push(`Min length: ${schema.minLength}, Max length: ${schema.maxLength}`);
    } else if (schema.minLength !== undefined) {
      info.constraints.push(`Min length: ${schema.minLength}`);
    } else if (schema.maxLength !== undefined) {
      info.constraints.push(`Max length: ${schema.maxLength}`);
    }
  }

  info.html = JSON.stringify({
    type: info.type,
    format: info.format,
    cssType: info.cssType,
    readOrWriteOnly: info.readOrWriteOnly,
    constraints: info.constraints,
    defaultValue: info.default,
    example: info.example,
    allowedValues: info.allowedValues,
    pattern: info.pattern,
    schemaDescription: info.description,
    schemaTitle: info.title,
    deprecated: info.deprecated
  });
  return info;
}

export function getSampleValueByType(schemaObj, fallbackPropertyName, skipExampleStrings) {
  const example = Array.isArray(schemaObj.examples) ? schemaObj.examples[0] : Object.values(schemaObj.examples || {})[0]?.value ?? schemaObj.example;
  if (skipExampleStrings && typeof example === 'string') { return ''; }
  if (typeof example !== 'undefined') { return example; }

  if (schemaObj.default) { return schemaObj.default; }

  if (Object.keys(schemaObj).length === 0) {
    return EXAMPLE_VALUE_FOR_MISSING_TYPE;
  }
  if (schemaObj.circularReference) {
    return schemaObj.$ref;
  }
  const typeValue = Array.isArray(schemaObj.type) ? schemaObj.type.filter((t) => t !== 'null')[0] : schemaObj.type ?? '';

  if (typeof schemaObj.const !== 'undefined') {
    return schemaObj.const;
  }

  if (schemaObj.enum) { return schemaObj.enum[0]; }
  if (typeValue.match(/^integer|^number/g)) {
    const multipleOf = Number.isNaN(Number(schemaObj.multipleOf)) ? undefined : Number(schemaObj.multipleOf);
    const maximum = Number.isNaN(Number(schemaObj.maximum)) ? undefined : Number(schemaObj.maximum);
    const minimumPossibleVal = Number.isNaN(Number(schemaObj.minimum))
      ? Number.isNaN(Number(schemaObj.exclusiveMinimum))
        ? maximum || 0
        : Number(schemaObj.exclusiveMinimum) + (typeValue.startsWith('integer') ? 1 : 0.001)
      : Number(schemaObj.minimum);
    const finalVal = multipleOf
      ? multipleOf >= minimumPossibleVal
        ? multipleOf
        : minimumPossibleVal % multipleOf === 0
          ? minimumPossibleVal
          : Math.ceil(minimumPossibleVal / multipleOf) * multipleOf
      : minimumPossibleVal;
    return finalVal;
  }
  if (typeValue.match(/^boolean/g)) { return false; }
  if (typeValue.match(/^null/g)) { return null; }
  if (skipExampleStrings && typeValue.match(/^string/g)) { return ''; }
  if (typeValue.match(/^string/g)) {
    if (schemaObj.pattern) {
      const examplePattern = schemaObj.pattern.replace(/[+*](?![^\][]*[\]])/g, '{8}').replace(/\{\d*,(\d+)?\}/g, '{8}');
      try {
        return expandN(examplePattern, 1)[0] || fallbackPropertyName || 'string';
      } catch (error) {
        return fallbackPropertyName || 'string';
      }
    }
    if (schemaObj.format) {
      switch (schemaObj.format.toLowerCase()) {
        case 'url':
          return 'https://example.com';
        case 'uri':
          return 'urn:namespace:type:example/resource';
        case 'date':
          return (new Date()).toISOString().split('T')[0];
        case 'time':
          return (new Date()).toISOString().split('T')[1];
        case 'date-time':
          return (new Date()).toISOString();
        case 'duration':
          return 'P3Y6M4DT12H30M5S'; // P=Period 3-Years 6-Months 4-Days 12-Hours 30-Minutes 5-Seconds
        case 'email':
        case 'idn-email':
          return 'user@example.com';
        case 'hostname':
        case 'idn-hostname':
          return 'www.example.com';
        case 'ipv4':
          return '192.168.0.1';
        case 'ipv6':
          return '2001:0db8:5b96:0000:0000:426f:8e17:642a';
        case 'uuid':
          return '4e0ba220-9575-11eb-a8b3-0242ac130003';
        case 'byte':
          // Byte type is actually a base64 encoded string: https://spec.openapis.org/oas/v3.0.0#data-types
          return Buffer.from('example').toString('base64');
        default:
          return schemaObj.format;
      }
    } else {
      return fallbackPropertyName || 'string';
    }
  }
  // If type cannot be determined
  return EXAMPLE_VALUE_FOR_MISSING_TYPE;
}

function duplicateExampleWithNewPropertyValues(objectExamples, propertyName, propertyValues) {
  // Limit max number of property examples to 2 and limit the max number of examples to 10
  return objectExamples.reduce((exampleList, example) => {
    const examplesFromPropertyValues = propertyValues.slice(0, 2).map((value) => ({
      ...cloneDeep(example),
      [propertyName]: value,
    }));
    return exampleList.concat(...examplesFromPropertyValues);
  }, []).slice(0, 10);
}

export function getExampleValuesFromSchema(schema, config = {}) {
  // Wrap the top level so that the recursive object can treat it as a normal property and we'll hit the 'object' below, otherwise we'll never create the top level.
  if (config.xml) {
    const xmlResult = getExampleValuesFromSchemaRecursive(schema.type === 'object' ? { properties: { _root: schema } } : schema, config);
    return xmlResult.map((example) => example[0]);
  }
  return getExampleValuesFromSchemaRecursive(schema, config);
}

// TODO: Support getting the `summary` from the examples object or the `title` from the schema object
function getExampleValuesFromSchemaRecursive(rawSchema, config = {}) {
  if (!rawSchema) {
    return [];
  }

  // XML Support
  const xmlAttributes = {};
  const xmlTagProperties = [];
  const { prefix, namespace } = rawSchema.xml || {};
  if (namespace) {
    xmlAttributes[prefix ? `xmlns:${prefix}` : 'xmlns'] = namespace;
  }
  const nodeName = rawSchema?.items?.xml?.name || rawSchema?.xml?.name || config.propertyName || 'root';
  const overridePropertyName = prefix ? `${prefix}:${nodeName}` : nodeName;

  const { allOf, oneOf, anyOf, ...schema } = rawSchema;
  if (allOf) {
    const mergedAllOf = merge({}, ...allOf, schema);
    return getExampleValuesFromSchemaRecursive(mergedAllOf, config);
  }

  if (oneOf || anyOf) {
    const examples = (oneOf || anyOf).map((s) => getExampleValuesFromSchemaRecursive(merge({}, schema, s), config)).flat(1);
    const hash = value => {
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    };
    const uniqueExamples = examples.reduce((acc, e) => { acc[hash(e)] = e; return acc; }, {});
    return Object.values(uniqueExamples);
  }

  return getSimpleValueResult(schema, config, namespace, prefix, xmlAttributes, xmlTagProperties, overridePropertyName);
}

function getSimpleValueResult(schema, config, namespace, prefix, xmlAttributes, xmlTagProperties, overridePropertyName) {
  if (schema.type === 'array' || schema.items) {
    if (!config.xml) {
      return [getExampleValuesFromSchemaRecursive(schema.items || {}, config)];
    }
    if (!schema.xml || !schema.xml.wrapped) {
      const arrayExamples = getExampleValuesFromSchemaRecursive(schema.items || {}, config);
      xmlTagProperties.push({ [overridePropertyName]: arrayExamples[0] }, { _attr: xmlAttributes });
      return [xmlTagProperties];
    }

    const arrayExamples = getExampleValuesFromSchemaRecursive(schema.items || {}, { ...config, propertyName: overridePropertyName });
    xmlTagProperties.push({ [overridePropertyName]: arrayExamples[0] }, { _attr: xmlAttributes });
    return [xmlTagProperties];
  }

  if (schema.type === 'object' || schema.properties) {
    let objectExamples = [{}];

    Object.keys(schema.properties || {}).forEach((propertyName) => {
      const innerSchema = schema.properties[propertyName];
      if (innerSchema.deprecated) { return; }
      if (innerSchema.readOnly && !config.includeReadOnly) { return; }
      if (innerSchema.writeOnly && !config.includeWriteOnly) { return; }

      const propertyExamples = getExampleValuesFromSchemaRecursive(innerSchema, { ...config, propertyName });
      objectExamples = duplicateExampleWithNewPropertyValues(objectExamples, propertyName, propertyExamples);

      if (innerSchema.xml && innerSchema.xml.namespace) {
        xmlAttributes[innerSchema.xml.prefix ? `xmlns:${innerSchema.xml.prefix}` : 'xmlns'] = namespace;
      }
      const innerNodeName = innerSchema.xml && innerSchema.xml.name || propertyName || config.propertyName;
      const innerOverridePropertyName = prefix ? `${prefix}:${innerNodeName}` : innerNodeName;

      if (innerSchema.xml && innerSchema.xml.attribute) {
        xmlAttributes[innerOverridePropertyName] = propertyExamples[0];
      } else {
        xmlTagProperties.push({ [innerOverridePropertyName]: propertyExamples[0] });
      }
    });
    if (Object.keys(xmlAttributes).length) {
      xmlTagProperties.push({ _attr: xmlAttributes });
    }
    return config.xml ? [xmlTagProperties] : objectExamples;
  }

  const value = getSampleValueByType(schema, config.propertyName, config.skipExampleStrings);
  return [value];
}

export function isPatternProperty(label) {
  return label.match(/^<any-key>|<pattern:/);
}
/**
 * For changing OpenAPI-Schema to an Object Notation,
 * This Object would further be an input to UI Components to generate an Object-Tree
 * @param {object} schema - Schema object from OpenAPI spec
 * @param {object} options - recursively pass this object to generate object notation
 * @param {number} level - recursion level
 * @param {string} suffix - used for suffixing property names to avoid duplicate props during object composition
 */
export function schemaInObjectNotation(rawSchema, options, level = 0, suffix = '') {
  if (!rawSchema) {
    return undefined;
  }
  const { allOf, oneOf, anyOf, items: arrayItemsSchema, properties: schemaProperties, patternProperties: schemaPatternProperties, ...schema } = rawSchema;
  const propertyType = schema.type;
  const metadata = { constraints: [] };
  if (schema.uniqueItems) { metadata.constraints.push('Requires unique items'); }
  if (typeof schema.minItems === 'number' || typeof schema.maxItems === 'number') {
    metadata.constraints.push(`Length: [${schema.minItems || 0}${schema.maxItems ? ', ' : '+'}${schema.maxItems || ''}]`);
  }

  if (allOf) {
    // If allOf is an array of multiple elements, then all the keys makes a single object
    const objWithAllProps = {};
    allOf.map((v, i) => {
      if (v.type === 'object' || v.properties || v.allOf || v.anyOf || v.oneOf) {
        const propSuffix = (v.anyOf || v.oneOf) && i > 0 ? i : '';
        const partialObj = schemaInObjectNotation(v, options, (level + 1), propSuffix);
        Object.assign(objWithAllProps, partialObj);
      } else if (v.type === 'array' || v.items) {
        const partialObj = schemaInObjectNotation(v, options, (level + 1));
        Object.assign(objWithAllProps, partialObj);
      } else if (v.type) {
        const prop = `prop${Object.keys(objWithAllProps).length}`;
        const typeObj = getTypeInfo(v, options);
        objWithAllProps[prop] = `${typeObj.html}`;
      }
    });

    const obj = schemaInObjectNotation(schema, options, 0);
    return Object.assign({}, objWithAllProps, typeof obj === 'object' && !Array.isArray(obj) ? obj : {});
  } else if (anyOf || oneOf) {
    const objWithAnyOfProps = {};
    let writeOnly = true;
    let readOnly = true;
    (anyOf || oneOf || []).forEach((v, index) => {
      if (v.type === 'object' || v.properties || v.allOf || v.anyOf || v.oneOf) {
        const partialObj = schemaInObjectNotation(v, options);
        if (partialObj) {
          objWithAnyOfProps[`::OPTION~${index + 1}${v.title ? `~${v.title}` : ''}`] = partialObj;
          objWithAnyOfProps['::type'] = 'xxx-of-option';
          readOnly = readOnly && partialObj['::flags']?.['🆁'];
          writeOnly = writeOnly && partialObj['::flags']?.['🆆'];
        }
      } else if (v.type === 'array' || v.items) {
        const partialObj = schemaInObjectNotation(v, options);
        objWithAnyOfProps[`::OPTION~${index + 1}${v.title ? `~${v.title}` : ''}`] = partialObj;
        objWithAnyOfProps['::type'] = 'xxx-of-array';
        readOnly = readOnly && partialObj['::flags']?.['🆁'];
        writeOnly = writeOnly && partialObj['::flags']?.['🆆'];
      } else {
        const typeInfo = getTypeInfo(v, options);
        if (typeInfo?.type) {
          const prop = `::OPTION~${index + 1}${v.title ? `~${v.title}` : ''}`;
          objWithAnyOfProps[prop] = `${typeInfo.html}`;
          objWithAnyOfProps['::type'] = 'xxx-of-option';
          readOnly = readOnly && objWithAnyOfProps['::flags']?.['🆁'];
          writeOnly = writeOnly && objWithAnyOfProps['::flags']?.['🆆'];
        }
      }
    });
    const obj = schemaInObjectNotation(schema, options, 0);
    const resultObj = typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
    if (Object.keys(objWithAnyOfProps).length) {
      resultObj[(anyOf ? `::ANY~OF ${suffix}` : `::ONE~OF ${suffix}`)] = objWithAnyOfProps;
    }
    resultObj['::type'] = 'object';
    resultObj['::flags'] = { '🆁': readOnly && '🆁', '🆆': writeOnly && '🆆' };
    resultObj['::title'] = schema.title || '';
    resultObj['::description'] = schema.description || '';
    resultObj['::metadata'] = metadata;
    return resultObj;
  } else if (Array.isArray(propertyType)) {
    const obj = { '::type': '' };
    // When a property has multiple types, then check further if any of the types are array or object, if yes then modify the schema using one-of
    // Clone the schema - as it will be modified to replace multi-data-types with one-of;
    const subSchema = JSON.parse(JSON.stringify(schema));
    const primitiveType = [];
    const complexTypes = [];
    subSchema.type.forEach((v) => {
      if (v.match(/integer|number|string|null|boolean/g)) {
        primitiveType.push(v);
      } else if (v === 'array' && typeof (subSchema.items && subSchema.items.type) === 'string' && arrayItemsSchema && subSchema.items.type.match(/integer|number|string|null|boolean/g)) {
        // Array with primitive types should also be treated as primitive type
        if (subSchema.items.type === 'string' && subSchema.items.format) {
          primitiveType.push(`${subSchema.items.format}[]`);
        } else {
          primitiveType.push(`${subSchema.items.type}[]`);
        }
      } else {
        complexTypes.push(v);
      }
    });
    let multiPrimitiveTypes;
    if (primitiveType.length > 0) {
      subSchema.type = primitiveType.join('┃');
      multiPrimitiveTypes = getTypeInfo(subSchema, options);
      if (complexTypes.length === 0) {
        return `${multiPrimitiveTypes?.html || ''}`;
      }
    }
    if (complexTypes.length > 0) {
      obj['::type'] = 'object';
      const multiTypeOptions = {
        '::type': 'xxx-of-option',
      };

      // Generate ONE-OF options for complexTypes
      complexTypes.forEach((v, i) => {
        if (v === 'null') {
          multiTypeOptions[`::OPTION~${i + 1}`] = 'NULL~|~~|~~|~~|~~|~~|~~|~~|~';
        } else if ('integer, number, string, boolean,'.includes(`${v},`)) {
          subSchema.type = Array.isArray(v) ? v.join('┃') : v;
          const primitiveTypeInfo = getTypeInfo(subSchema, options);
          multiTypeOptions[`::OPTION~${i + 1}`] = primitiveTypeInfo.html;
        } else if (v === 'object') {
          // If object type iterate all the properties and create an object-type-option
          const objTypeOption = {
            '::title': schema.title || '',
            '::description': schema.description || '',
            '::flags': { '🆁': schema.readOnly && '🆁', '🆆': schema.writeOnly && '🆆' },
            '::type': 'object',
            '::deprecated': schema.deprecated || false,
            '::metadata': metadata
          };
          for (const key in schemaProperties) {
            if (!schema.deprecated && !schemaProperties[key].deprecated && schema.required?.includes(key)) {
              objTypeOption[`${key}*`] = schemaInObjectNotation(schemaProperties[key], options, (level + 1));
            } else {
              objTypeOption[key] = schemaInObjectNotation(schemaProperties[key], options, (level + 1));
            }
          }
          multiTypeOptions[`::OPTION~${i + 1}`] = objTypeOption;
        } else if (v === 'array') {
          multiTypeOptions[`::OPTION~${i + 1}`] = {
            '::title': schema.title || '',
            '::description': schema.description || '',
            '::flags': { '🆁': schema.readOnly && '🆁', '🆆': schema.writeOnly && '🆆' },
            '::type': 'array',
            // Array properties are read from the ::props object instead of reading from the keys of this object
            // '::props': schemaInObjectNotation(Object.assign({ deprecated: schema.deprecated, readOnly: schema.readOnly, writeOnly: schema.writeOnly }, arrayItemsSchema), options, (level + 1)),
            '::props': schemaInObjectNotation(Object.assign({}, schema, arrayItemsSchema), options, (level + 1)),
            '::deprecated': schema.deprecated || false,
            '::metadata': metadata
          };
        }
      });
      multiTypeOptions[`::OPTION~${complexTypes.length + 1}`] = multiPrimitiveTypes && multiPrimitiveTypes.html || '';
      obj['::ONE~OF'] = multiTypeOptions;
    }
    return obj;
  } else if (propertyType === 'object' || schemaProperties) {
    const obj = { '::type': '' };
    obj['::title'] = schema.title || '';
    obj['::description'] = schema.description || '';
    obj['::flags'] = { '🆁': schema.readOnly && '🆁', '🆆': schema.writeOnly && '🆆' };
    obj['::type'] = 'object';
    obj['::deprecated'] = schema.deprecated || false;
    obj['::metadata'] = metadata;
    for (const key in schemaProperties) {
      if (!schema.deprecated && !schemaProperties[key].deprecated && schema.required?.includes(key)) {
        obj[`${key}*`] = schemaInObjectNotation(schemaProperties[key], options, (level + 1));
      } else {
        obj[key] = schemaInObjectNotation(schemaProperties[key], options, (level + 1));
      }
    }
    for (const key in schemaPatternProperties) {
      obj[`<pattern: ${key}>`] = schemaInObjectNotation(schemaPatternProperties[key], options, (level + 1));
    }
    if (schema.additionalProperties) {
      obj['<any-key>'] = schemaInObjectNotation(schema.additionalProperties, options);
    }
    return obj;
  } else if (propertyType === 'array' || arrayItemsSchema) { // If Array
    const obj = { '::type': '' };
    obj['::title'] = schema.title || '';
    obj['::description'] = schema.description || (arrayItemsSchema?.description ? `array&lt;${arrayItemsSchema.description}&gt;` : '');
    obj['::flags'] = { '🆁': schema.readOnly && '🆁', '🆆': schema.writeOnly && '🆆' };
    obj['::type'] = 'array';
    obj['::deprecated'] = schema.deprecated || false;
    obj['::metadata'] = metadata;
    // Array properties are read from the ::props object instead of reading from the keys of this object
    obj['::props'] = schemaInObjectNotation(Object.assign({}, schema, arrayItemsSchema), options, (level + 1));
    // obj['::props'] = schemaInObjectNotation(Object.assign({ deprecated: schema.deprecated, readOnly: schema.readOnly, writeOnly: schema.writeOnly }, arrayItemsSchema), options, (level + 1));
    if (arrayItemsSchema?.items) {
      obj['::array-type'] = arrayItemsSchema.items.type;
    }
    return obj;
  }

  const typeObj = getTypeInfo(schema, options);
  return `${typeObj?.html || ''}`;
}

/* Create Example object */
export function generateExample(examples, example, schema, rawMimeType, includeReadOnly = true, includeWriteOnly = true, outputType, skipExampleStrings = false) {
  const mimeType = rawMimeType || 'application/json';
  const finalExamples = [];

  // First check if examples is provided
  if (examples) {
    for (const eg in examples) {
      let egContent = '';
      let egFormat = 'json';
      if (mimeType.toLowerCase().includes('json')) {
        if (outputType === 'text') {
          egContent = typeof examples[eg].value === 'string' ? examples[eg].value : JSON.stringify(examples[eg].value, undefined, 2);
          egFormat = 'text';
        } else {
          egContent = examples[eg].value;
          if (typeof examples[eg].value === 'string') {
            try {
              const fixedJsonString = examples[eg].value.replace((/([\w]+)(:)/g), '"$1"$2').replace((/'/g), '"');
              egContent = JSON.parse(fixedJsonString);
              egFormat = 'json';
            } catch (err) {
              egFormat = 'text';
              egContent = examples[eg].value;
            }
          }
        }
      } else {
        egContent = examples[eg].value;
        egFormat = 'text';
      }

      finalExamples.push({
        exampleId: eg,
        exampleSummary: examples[eg].summary || '',
        exampleDescription: examples[eg].description || '',
        exampleType: mimeType,
        exampleValue: egContent,
        exampleFormat: egFormat,
      });
    }
  } else if (example) {
    let egContent = '';
    let egFormat = 'json';
    if (mimeType.toLowerCase().includes('json')) {
      if (outputType === 'text') {
        egContent = typeof example === 'string' ? example : JSON.stringify(example, undefined, 2);
        egFormat = 'text';
      } else if (typeof example === 'object') {
        egContent = example;
        egFormat = 'json';
      } else if (typeof example === 'string') {
        try {
          egContent = JSON.parse(example);
          egFormat = 'json';
        } catch (err) {
          egFormat = 'text';
          egContent = example;
        }
      }
    } else {
      egContent = example;
      egFormat = 'text';
    }
    finalExamples.push({
      exampleId: 'Example',
      exampleSummary: '',
      exampleDescription: '',
      exampleType: mimeType,
      exampleValue: egContent,
      exampleFormat: egFormat,
    });
  }

  // If schema-level examples are not provided then generate one based on the schema field types
  if (finalExamples.length) {
    return finalExamples;
  }

  if (schema?.example) { // Note: schema.examples (plurals) is not allowed as per spec
    return [{
      exampleId: 'Example',
      exampleSummary: '',
      exampleDescription: '',
      exampleType: mimeType,
      exampleValue: schema.example,
      exampleFormat: ((mimeType.toLowerCase().includes('json') && typeof schema.example === 'object') ? 'json' : 'text'),
    }];
  }

  const config = {
    includeReadOnly,
    includeWriteOnly,
    skipExampleStrings,
    xml: mimeType.toLowerCase().includes('xml'),
  };

  const samples = getExampleValuesFromSchema(schema, config);

  if (!samples || (!mimeType.toLowerCase().includes('json') && !mimeType.toLowerCase().includes('text') && !mimeType.toLowerCase().includes('*/*') && !mimeType.toLowerCase().includes('xml'))) {
    return [{
      exampleId: 'Example',
      exampleSummary: '',
      exampleDescription: '',
      exampleType: mimeType,
      exampleValue: '',
      exampleFormat: 'text',
    }];
  }

  return samples.map((sample, sampleCounter) => {
    let exampleValue = '';
    if (mimeType.toLowerCase().includes('xml')) {
      exampleValue = xmlFormatter(sample, { declaration: true, indent: '    ' });
    } else {
      exampleValue = outputType === 'text' ? JSON.stringify(sample, null, 8) : sample;
    }

    return {
      exampleId: `Example-${sampleCounter}`,
      exampleSummary: '',
      exampleDescription: '',
      exampleType: mimeType,
      exampleFormat: mimeType.toLowerCase().includes('xml') ? 'text' : outputType,
      exampleValue,
    };
  }).filter((s) => s);
}
