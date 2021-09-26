# Changelog #
This package follows standard semvar, `<major>.<minor>.<build>`. No breaking changes will be introduced to existing `<minor>` versions.

## 0.6 ##
* Route navigation is contained fully in a query string inside the hash, it will now no longer affect hash based routing
* Adds the `nonce` to oauth requests to generate an access token.
* Add scopes display for security schemes.

## 0.5 ##
* Remove deprecated password oauth2 flow
* Fixed sending API Keys in querystring (not recommended)

## 0.4 ##
* Added custom nav section and custom display for that section.
* Fix path ordering so it matches spec ordering.
* Move example to populate placeholder property of input

## 0.3 ##
* Moved npm package target to point at main source location instead of `dist`. The distributable minified version is still present at `/dist/openapi-explorer.min.js`.
* Add `setSecuritySchemeToken(securitySchemeId, token)` method for setting scheme tokens.
* Add two `navbar-` css `::parts`

## 0.2 ##
* Automate responsive changes from "focused mode" to "scrolling view mode" so no additional parameters are necessary. `responsive` parameter has been removed