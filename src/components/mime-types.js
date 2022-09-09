import db from 'mime-db/db.json';

const EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;

const extensions = {};
const types = {};
populateMaps();

/**
 * Get the default extension for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

export default function extension(type) {
  if (!type || typeof type !== 'string') {
    return false;
  }

  // TODO: use media-typer
  const match = EXTRACT_TYPE_REGEXP.exec(type);

  // get extensions
  const exts = match && extensions[match[1].toLowerCase()];

  if (!exts || !exts.length) {
    return false;
  }

  return exts[0];
}

function populateMaps() {
  // source preference (least -> most)
  const preference = ['nginx', 'apache', undefined, 'iana'];

  Object.keys(db).forEach(function forEachMimeType(type) {
    const mime = db[type];
    const exts = mime.extensions;

    if (!exts || !exts.length) {
      return;
    }

    // mime -> extensions
    extensions[type] = exts;

    // extension -> mime
    for (let i = 0; i < exts.length; i++) {
      const extensionToTest = exts[i];

      if (types[extensionToTest]) {
        const from = preference.indexOf(db[types[extensionToTest]].source);
        const to = preference.indexOf(mime.source);

        if (types[extensionToTest] !== 'application/octet-stream'
          && (from > to || (from === to && types[extensionToTest].substr(0, 12) === 'application/'))) {
          // skip the remapping
          continue;
        }
      }

      // set the extension -> mime
      types[extensionToTest] = type;
    }
  });
}
