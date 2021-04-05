const xmlFormatter = require('@kyleshockey/xml');
const regexStringGenerator = require('regex-to-strings');

/* Generates an schema object containing type and constraint info */
export function getTypeInfo(schema) {
  if (!schema) {
    return;
  }
  let dataType = '';
  let constrain = '';

  if (schema.$ref) {
    const n = schema.$ref.lastIndexOf('/');
    const schemaNode = schema.$ref.substring(n + 1);
    dataType = `{recursive: ${schemaNode}} `;
  } else if (schema.type) {
    const arraySchema = Array.isArray(schema.type) ? schema.type : (typeof schema.type === 'string' ? schema.type.split('┃') : schema.type);
    dataType = Array.isArray(arraySchema) ? arraySchema.filter((s) => s !== 'null').join('┃') : schema.type;
    if (schema.format || schema.enum) {
      dataType = dataType.replace('string', schema.enum ? 'enum' : schema.format);
    }
  } else {
    dataType = '{missing-type-info}';
  }

  const info = {
    type: dataType,
    format: schema.format || '',
    pattern: (schema.pattern && !schema.enum) ? schema.pattern : '',
    readOrWriteOnly: schema.readOnly
      ? '🆁'
      : schema.writeOnly
        ? '🆆'
        : '',
    deprecated: schema.deprecated ? '❌' : '',
    example: typeof schema.example === 'undefined'
      ? ''
      : Array.isArray(schema.example)
        ? schema.example
        : `${schema.example}`,
    default: schema.default || '',
    description: schema.description || '',
    constrain: '',
    allowedValues: '',
    arrayType: '',
    html: '',
  };

  if (info.type === '{recursive}') {
    info.description = schema.$ref.substring(schema.$ref.lastIndexOf('/') + 1);
  } else if (info.type === '{missing-type-info}') {
    info.description = info.description || '';
  }

  // Set Allowed Values
  info.allowedValues = Array.isArray(schema.enum) ? schema.enum.join('┃') : '';
  if (dataType === 'array' && schema.items) {
    const arrayItemType = schema.items?.type;
    const arrayItemDefault = schema.items?.default !== undefined ? schema.items.default : '';

    info.arrayType = `${schema.type} of ${Array.isArray(arrayItemType) ? arrayItemType.join('') : arrayItemType}`;
    info.default = arrayItemDefault;
    info.allowedValues = Array.isArray(schema.items?.enum) ? schema.items.enum.join('┃') : '';
  }

  if (dataType.match(/integer|number/g)) {
    const minimum = schema.minimum !== undefined ? schema.minimum : schema.exclusiveMinimum;
    const maximum = schema.maximum !== undefined ? schema.maximum : schema.exclusiveMaximum;
    const leftBound = schema.minimum !== undefined ? '[' : '(';
    const rightBound = schema.maximum !== undefined ? ']' : ')';
    if (typeof minimum === 'number' || typeof maximum === 'number') {
      constrain = `Range: ${leftBound}${minimum || ''},${maximum || ''}${rightBound}`;
    }
    if (schema.multipleOf !== undefined) {
      constrain += `${constrain ? ', ' : ''}Multiples: ${schema.multipleOf}`;
    }
  }
  if (dataType.match(/string/g)) {
    if (schema.minLength !== undefined && schema.maxLength !== undefined) {
      constrain += `Min length: ${schema.minLength}, Max length: ${schema.maxLength}`;
    } else if (schema.minLength !== undefined) {
      constrain += `Min length: ${schema.minLength}`;
    } else if (schema.maxLength !== undefined) {
      constrain += `Max length: ${schema.maxLength}`;
    }
  }
  info.constrain = constrain;
  info.html = `${info.type}~|~${info.readOrWriteOnly}~|~${info.constrain}~|~${info.default}~|~${info.allowedValues}~|~${info.pattern}~|~${info.description}~|~${schema.title || ''}~|~${info.deprecated ? 'deprecated' : ''}`;
  return info;
}

export function getSampleValueByType(schemaObj, fallbackPropertyName) {
  const example = schemaObj.examples ? schemaObj.examples[0] : (schemaObj.example ? schemaObj.example : undefined);
  if (example === '') { return ''; }
  if (example === null) { return null; }
  if (example === 0) { return 0; }
  if (example) { return example; }

  if (Object.keys(schemaObj).length === 0) {
    return null;
  }
  if (schemaObj.$ref) {
    // Indicates a Circular ref
    return schemaObj.$ref;
  }
  const typeValue = Array.isArray(schemaObj.type) ? schemaObj.type.filter((t) => t !== 'null')[0] : schemaObj.type;

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
  if (typeValue.match(/^boolean/g)) { return typeof schemaObj.default === 'boolean' ? schemaObj.default : false; }
  if (typeValue.match(/^null/g)) { return null; }
  if (typeValue.match(/^string/g)) {
    if (schemaObj.enum) { return schemaObj.enum[0]; }
    if (schemaObj.pattern) {
      const examplePattern = schemaObj.pattern.replace(/[+*](?![^\][]*[\]])/g, '{8}').replace(/\{\d*,(\d+)?\}/g, '{8}');
      return regexStringGenerator.expandN(examplePattern, 1)[0] || fallbackPropertyName || 'string';
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
        default:
          return schemaObj.format;
      }
    } else {
      return fallbackPropertyName || 'string';
    }
  }
  // If type cannot be determined
  return '?';
}

function addSchemaInfoToExample(schema, obj) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  if (schema.title) {
    obj['::TITLE'] = schema.title;
  }
  if (schema.description) {
    obj['::DESCRIPTION'] = schema.description;
  }
}

function removeTitlesAndDescriptions(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  delete obj['::TITLE'];
  delete obj['::DESCRIPTION'];
  for (const k in obj) {
    removeTitlesAndDescriptions(obj[k]);
  }
}

function addPropertyExampleToObjectExamples(example, obj, propertyKey) {
  for (const key in obj) {
    obj[key][propertyKey] = example;
  }
}

function mergePropertyExamples(obj, propertyName, propExamples) {
  // Create an example for each variant of the propertyExample, merging them with the current (parent) example
  let i = 0;
  const maxCombinations = 10;
  const mergedObj = {};
  for (const exampleKey in obj) {
    for (const propExampleKey in propExamples) {
      mergedObj[`example-${i}`] = { ...obj[exampleKey] };
      mergedObj[`example-${i}`][propertyName] = propExamples[propExampleKey];
      i++;
      if (i >= maxCombinations) {
        break;
      }
    }
    if (i >= maxCombinations) {
      break;
    }
  }
  return mergedObj;
}

/* For changing JSON-Schema to a Sample Object, as per the schema (to generate examples based on schema) */
export function schemaToSampleObj(schema, config = { }) {
  let obj = {};
  if (!schema) {
    return null;
  }

  if (schema.allOf) {
    const objWithAllProps = {};

    if (schema.allOf.length === 1 && !schema.allOf[0].properties && !schema.allOf[0].items) {
      // If allOf has single item and the type is not an object or array, then its a primitive
      if (schema.allOf[0].$ref) {
        return schema.allOf[0].$ref;
      }
      if (schema.allOf[0].readOnly && config.includeReadOnly) {
        const tempSchema = schema.allOf[0];
        return getSampleValueByType(tempSchema, config.propertyName);
      }
      return null;
    }

    schema.allOf.forEach((v) => {
      if (v.type === 'object' || v.properties || v.allOf || v.anyOf || v.oneOf) {
        const partialObj = schemaToSampleObj(v, config);
        Object.assign(objWithAllProps, partialObj);
      } else if (v.type === 'array' || v.items) {
        const partialObj = [schemaToSampleObj(v, config)];
        Object.assign(objWithAllProps, partialObj);
      } else if (v.type) {
        const prop = `prop${Object.keys(objWithAllProps).length}`;
        objWithAllProps[prop] = getSampleValueByType(v, config.propertyName);
      }
    });

    obj = objWithAllProps;
  } else if (schema.oneOf) {
    if (schema.oneOf.length > 0) {
      let i = 0;
      // Merge all examples of each oneOf-schema
      for (const key in schema.oneOf) {
        const oneOfSamples = schemaToSampleObj(schema.oneOf[key], config);
        for (const sampleKey in oneOfSamples) {
          obj[`example-${i}`] = oneOfSamples[sampleKey];
          addSchemaInfoToExample(schema.oneOf[key], obj[`example-${i}`]);
          i++;
        }
      }
    }
  } else if (schema.anyOf) {
    // First generate values for regular properties
    let commonObj;
    if (schema.type === 'object' || schema.properties) {
      commonObj = { 'example-0': {} };
      for (const propertyName in schema.properties) {
        if (schema.example) {
          commonObj = schema;
          break;
        }
        if (schema.properties[propertyName].deprecated && !config.includeDeprecated) { continue; }
        if (schema.properties[propertyName].readOnly && !config.includeReadOnly) { continue; }
        if (schema.properties[propertyName].writeOnly && !config.includeWriteOnly) { continue; }
        commonObj = mergePropertyExamples(commonObj, propertyName, schemaToSampleObj(schema.properties[propertyName], { ...config, propertyName }));
      }
    }

    // Combine every variant of the regular properties with every variant of the anyOf samples
    let i = 0;
    for (const key in schema.anyOf) {
      const anyOfSamples = schemaToSampleObj(schema.anyOf[key], config);
      for (const sampleKey in anyOfSamples) {
        if (typeof commonObj !== 'undefined') {
          for (const commonKey in commonObj) {
            obj[`example-${i}`] = { ...commonObj[commonKey], ...anyOfSamples[sampleKey] };
          }
        } else {
          obj[`example-${i}`] = anyOfSamples[sampleKey];
        }
        addSchemaInfoToExample(schema.anyOf[key], obj[`example-${i}`]);
        i++;
      }
    }
  } else if (schema.type === 'object' || schema.properties) {
    obj['example-0'] = {};
    addSchemaInfoToExample(schema, obj['example-0']);
    if (schema.example) {
      obj['example-0'] = schema.example;
    } else {
      for (const propertyName in schema.properties) {
        if (schema.properties[propertyName].deprecated && !config.includeDeprecated) { continue; }
        if (schema.properties[propertyName].readOnly && !config.includeReadOnly) { continue; }
        if (schema.properties[propertyName].writeOnly && !config.includeWriteOnly) { continue; }
        if (schema.properties[propertyName].type === 'array' || schema.properties[propertyName].items) {
          if (schema.properties[propertyName].example) {
            addPropertyExampleToObjectExamples(schema.properties[propertyName].example, obj, propertyName);
          } else if (schema.properties[propertyName]?.items?.example) { // schemas and properties support single example but not multiple examples.
            addPropertyExampleToObjectExamples([schema.properties[propertyName].items.example], obj, propertyName);
          } else {
            const itemSamples = schemaToSampleObj(schema.properties[propertyName].items, { ...config, propertyName });
            const arraySamples = [];
            for (const key in itemSamples) {
              arraySamples[key] = [itemSamples[key]];
            }
            obj = mergePropertyExamples(obj, propertyName, arraySamples);
          }
          continue;
        }
        obj = mergePropertyExamples(obj, propertyName, schemaToSampleObj(schema.properties[propertyName], { ...config, propertyName }));
      }
    }
  } else if (schema.type === 'array' || schema.items) {
    if (schema.example) {
      obj['example-0'] = schema.example;
    } else if (schema.items?.example) { // schemas and properties support single example but not multiple examples.
      obj['example-0'] = [schema.items.example];
    } else {
      const samples = schemaToSampleObj(schema.items, config);
      let i = 0;
      for (const key in samples) {
        obj[`example-${i}`] = [samples[key]];
        addSchemaInfoToExample(schema.items, obj[`example-${i}`]);
        i++;
      }
    }
  } else {
    return { 'example-0': getSampleValueByType(schema, config.propertyName) };
  }
  return obj;
}

/**
 * For changing OpenAPI-Schema to an Object Notation,
 * This Object would further be an input to UI Components to generate an Object-Tree
 * @param {object} schema - Schema object from OpenAPI spec
 * @param {object} obj - recursively pass this object to generate object notation
 * @param {number} level - recursion level
 * @param {string} suffix - used for suffixing property names to avoid duplicate props during object composition
 */
export function schemaInObjectNotation(schema, obj, level = 0, suffix = '') {
  if (!schema) {
    return;
  }
  if (schema.allOf) {
    const objWithAllProps = {};
    if (schema.allOf.length === 1 && !schema.allOf[0].properties && !schema.allOf[0].items) {
      // If allOf has single item and the type is not an object or array, then its a primitive
      const tempSchema = schema.allOf[0];
      return `${getTypeInfo(tempSchema).html}`;
    }
    // If allOf is an array of multiple elements, then all the keys makes a single object
    schema.allOf.map((v, i) => {
      if (v.type === 'object' || v.properties || v.allOf || v.anyOf || v.oneOf) {
        const propSuffix = (v.anyOf || v.oneOf) && i > 0 ? i : '';
        const partialObj = schemaInObjectNotation(v, {}, (level + 1), propSuffix);
        Object.assign(objWithAllProps, partialObj);
      } else if (v.type === 'array' || v.items) {
        const partialObj = schemaInObjectNotation(v, {}, (level + 1));
        Object.assign(objWithAllProps, partialObj);
      } else if (v.type) {
        const prop = `prop${Object.keys(objWithAllProps).length}`;
        const typeObj = getTypeInfo(v);
        objWithAllProps[prop] = `${typeObj.html}`;
      } else {
        return '';
      }
    });
    obj = objWithAllProps;
  } else if (schema.anyOf || schema.oneOf) {
    obj['::description'] = schema.description || '';
    // 1. First iterate the regular properties
    if (schema.type === 'object' || schema.properties) {
      obj['::description'] = schema.description || '';
      obj['::type'] = 'object';
      // obj['::deprecated'] = schema.deprecated || false;
      for (const key in schema.properties) {
        if (schema.required && schema.required.includes(key)) {
          obj[`${key}*`] = schemaInObjectNotation(schema.properties[key], {}, (level + 1));
        } else {
          obj[key] = schemaInObjectNotation(schema.properties[key], {}, (level + 1));
        }
      }
    }
    // 2. Then show allof/anyof objects
    const objWithAnyOfProps = {};
    const xxxOf = schema.anyOf ? 'anyOf' : 'oneOf';
    schema[xxxOf].forEach((v, index) => {
      if (v.type === 'object' || v.properties || v.allOf || v.anyOf || v.oneOf) {
        const partialObj = schemaInObjectNotation(v, {});
        objWithAnyOfProps[`::OPTION~${index + 1}${v.title ? `~${v.title}` : ''}`] = partialObj;
        objWithAnyOfProps['::type'] = 'xxx-of-option';
      } else if (v.type === 'array' || v.items) {
        // This else-if block never seems to get executed
        const partialObj = schemaInObjectNotation(v, {});
        objWithAnyOfProps[`::OPTION~${index + 1}${v.title ? `~${v.title}` : ''}`] = partialObj;
        objWithAnyOfProps['::type'] = 'xxx-of-array';
      } else {
        const prop = `::OPTION~${index + 1}${v.title ? `~${v.title}` : ''}`;
        objWithAnyOfProps[prop] = `${getTypeInfo(v).html}`;
        objWithAnyOfProps['::type'] = 'xxx-of-option';
      }
    });
    obj[(schema.anyOf ? `::ANY~OF ${suffix}` : `::ONE~OF ${suffix}`)] = objWithAnyOfProps;
    obj['::type'] = 'xxx-of';
  } else if (Array.isArray(schema.type)) {
    // When a property has multiple types, then check further if any of the types are array or object, if yes then modify the schema using one-of
    // Clone the schema - as it will be modified to replace multi-data-types with one-of;
    const subSchema = JSON.parse(JSON.stringify(schema));
    const primitiveType = [];
    const complexTypes = [];
    subSchema.type.forEach((v) => {
      if (v.match(/integer|number|string|null|boolean/g)) {
        primitiveType.push(v);
      } else if (v === 'array' && typeof subSchema.items?.type === 'string' && subSchema.items?.type.match(/integer|number|string|null|boolean/g)) {
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
      multiPrimitiveTypes = getTypeInfo(subSchema);
      if (complexTypes.length === 0) {
        return `${multiPrimitiveTypes?.html || ''}`;
      }
    }
    if (complexTypes.length > 0) {
      obj['::type'] = 'xxx-of';
      const multiTypeOptions = {
        '::type': 'xxx-of-option',
      };

      // Generate ONE-OF options for complexTypes
      complexTypes.forEach((v, i) => {
        if (v === 'null') {
          multiTypeOptions[`::OPTION~${i + 1}`] = 'NULL~|~~|~~|~~|~~|~~|~~|~~|~';
        } else if ('integer, number, string, boolean,'.includes(`${v},`)) {
          subSchema.type = Array.isArray(v) ? v.join('┃') : v;
          const primitiveTypeInfo = getTypeInfo(subSchema);
          multiTypeOptions[`::OPTION~${i + 1}`] = primitiveTypeInfo.html;
        } else if (v === 'object') {
          // If object type iterate all the properties and create an object-type-option
          const objTypeOption = {
            '::description': schema.description || '',
            '::type': 'object',
            '::deprecated': schema.deprecated || false,
          };
          for (const key in schema.properties) {
            if (schema.required && schema.required.includes(key)) {
              objTypeOption[`${key}*`] = schemaInObjectNotation(schema.properties[key], {}, (level + 1));
            } else {
              objTypeOption[key] = schemaInObjectNotation(schema.properties[key], {}, (level + 1));
            }
          }
          multiTypeOptions[`::OPTION~${i + 1}`] = objTypeOption;
        } else if (v === 'array') {
          multiTypeOptions[`::OPTION~${i + 1}`] = {
            '::description': schema.description || '',
            '::type': 'array',
            '::props': schemaInObjectNotation(schema.items, {}, (level + 1)),
          };
        }
      });
      multiTypeOptions[`::OPTION~${complexTypes.length + 1}`] = multiPrimitiveTypes?.html || '';
      obj['::ONE~OF'] = multiTypeOptions;
    }
  } else if (schema.type === 'object' || schema.properties) {
    obj['::description'] = schema.description || '';
    obj['::type'] = 'object';
    obj['::deprecated'] = schema.deprecated || false;
    for (const key in schema.properties) {
      if (schema.required && schema.required.includes(key)) {
        obj[`${key}*`] = schemaInObjectNotation(schema.properties[key], {}, (level + 1));
      } else {
        obj[key] = schemaInObjectNotation(schema.properties[key], {}, (level + 1));
      }
    }
    if (schema.additionalProperties) {
      obj['<any-key>'] = schemaInObjectNotation(schema.additionalProperties, {});
    }
  } else if (schema.type === 'array' || schema.items) { // If Array
    obj['::description'] = schema.description
      ? schema.description
      : schema.items?.description
        ? `array&lt;${schema.items.description}&gt;`
        : '';
    obj['::type'] = 'array';
    obj['::props'] = schemaInObjectNotation(schema.items, {}, (level + 1));
  } else {
    const typeObj = getTypeInfo(schema);
    if (typeObj?.html) {
      return `${typeObj.html}`;
    }
    return '';
  }
  return obj;
}

/* Create Example object */
export function generateExample(examples, example, schema, mimeType, includeReadOnly = true, includeWriteOnly = true, outputType) {
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
        exampleSummary: examples[eg].summary || eg,
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

  if (schema && schema.example) { // Note: schema.examples (plurals) is not allowed as per spec
    return [{
      exampleId: 'Example',
      exampleSummary: '',
      exampleDescription: '',
      exampleType: mimeType,
      exampleValue: schema.example,
      exampleFormat: ((mimeType.toLowerCase().includes('json') && typeof schema.example === 'object') ? 'json' : 'text'),
    }];
  }

  const samples = schemaToSampleObj(
    schema,
    {
      includeReadOnly,
      includeWriteOnly,
      deprecated: true,
      xml: mimeType.toLowerCase().includes('xml'),
    },
  );

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

  return Object.keys(samples).map((samplesKey, sampleCounter) => {
    if (!samples[samplesKey]) {
      return null;
    }
    const summary = samples[samplesKey]['::TITLE'] || `Example ${sampleCounter + 1}`;
    const description = samples[samplesKey]['::DESCRIPTION'] || '';
    removeTitlesAndDescriptions(samples[samplesKey]);

    let exampleValue = '';
    if (mimeType.toLowerCase().includes('xml')) {
      console.log('*****', samples);
      exampleValue = xmlFormatter(samples, { declaration: true, indent: '    ' });
    } else {
      exampleValue = outputType === 'text' ? JSON.stringify(samples[samplesKey], null, 8) : samples[samplesKey];
    }

    return {
      exampleId: samplesKey,
      exampleSummary: summary,
      exampleDescription: description,
      exampleType: mimeType,
      exampleFormat: mimeType.toLowerCase().includes('xml') ? 'text' : outputType,
      exampleValue,
    };
  }).filter((s) => s);
}
