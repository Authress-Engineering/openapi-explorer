# Changelog #
This package follows standard semvar, `<major>.<minor>.<build>`. No breaking changes will be introduced to existing `<minor>` versions.

## 1.0 ##
* By default uses the `info.title` property of the open api specification for the `overview` section name in the navbar. Falls back to the default when not specified.

## 0.8 ##
* Removing the `RESET` button as it is confusing for users to see. It only repopulated the defaults, and to do that, you can easily switch tabs and come back.
* Arrays and Objects read-only indicator is now present at the top level, and these objects are hidden from POST/UPDATE/PATCH bodies.
* Support $refs to load markdown files into the spec and render them appropriately.
* Correctly show deprecated arrays and hide deprecated elements from examples.
* Add aria labels and roles to `<select>` and `<table>` elements.
* [Bug] - don't force adding the spec url to the list of servers if the server list is already populated
* [Bug] - Operations/Components expand/collapse incorrectly was scrolling out of view, now it is sticky at the top of the nav section.
* [Bug] - Remove unnecessary forced capitalization from tags in the nav bar

## 0.7 ##
* Introduce `setAuthenticationConfiguration` to set any all configuration related to token management, including clientIds and explicit tokens.
* Display component titles in bold next to description
* Enable component scrolling.


## 0.6 ##
* Route navigation is contained fully in a query string inside the hash, it will now no longer affect hash based routing
* Adds the `nonce` to oauth requests to generate an access token.
* Add scopes display for security schemes.
* Fixed @request event `headers` to be a Fetch `headers` object.

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