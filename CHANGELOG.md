# Changelog #
This package follows standard semvar, `<major>.<minor>.<build>`. No breaking changes will be introduced to existing `<minor>` versions.

## 0.4 ##
* Added custom nav section and custom display for that section.

## 0.3 ##
* Moved npm package target to point at main source location instead of `dist`. The distributable minified version is still present at `/dist/openapi-explorer.min.js`.
* Add `setSecuritySchemeToken(securitySchemeId, token)` method for setting scheme tokens.
* Add two `navbar-` css `::parts`

## 0.2 ##
* Automate responsive changes from "focused mode" to "scrolling view mode" so no additional parameters are necessary. `responsive` parameter has been removed