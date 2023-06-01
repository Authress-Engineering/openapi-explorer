# Changelog #
This package follows standard semvar, `<major>.<minor>.<build>`. No breaking changes will be introduced to existing `<minor>` versions.

## 1.0 ##
* By default uses the `info.title` property of the open api specification for the `overview` section name in the navbar. Falls back to the default when not specified.
* Fix deeply nested descriptions and property overrides.
* Update yellow to purple for enums to provide better visibility on white backgrounds.
* Fix handling of object-type header properties
* Add the `path-details` slot and event subtype `OperationChanged`
* Add Method coloring to the method verbs when using `use-path-in-nav-bar`.
* Prevent bad bodies from being passed to GET and HEAD, GET and HEAD do not take bodies in requests
* Don't copy the 8 spaces <pre> formatted response from JSON requests #138.
* Fix initial padding for non-object based field properties, by setting the min at 32px (or 2 * the shift which is 16px)
* Ensure UI recordings do not include curl command which might include security tokens
* Fix table layout so that the path parameters table has a wider input area.
* Don't filter out tags that have no paths, no-path tags can be used for documentation.
* Fix pattern truncation to display full pattern on hover.
* Center description in request forms when no constraints are specified.
* Fix nested one-of descriptions.
* Fix example display for request path + query parameters.

## 0.11 ##
* Fix `allOf` for response schema. #119

## 0.10 ##
* Internationalization support with languages `en` and `fr`
* Add a `slot` `nav-header` to the top of the navbar.
* Add ruby to available languages.
* Handle missing schema's for responses
* Update `request-body` slot to include `event` handler for `RequestCleared` for when the user clicks the `CLEAR` button in the API Request operation display.
* Ensure that `explorerLocation` is present in all `custom events` fired in the context of an operation.
* Fix expand/collapse transition effect
* Fix oneof examples display
* Fix navbar transition
* Add support for `query` REST verb type
* Hide empty oneof empty clauses that don't affect displayed properties.
* Fix schema table transitions and display
* Fix response code colors to match the rest of the theme
* Add `header-bg-color` for setting table headers
* Fix `server-url` dynamic updates, so that updates are passed through to api requests
* Fix padding in code samples for first line and subsequent lines.
* Fix path wrapping in navbar and on mobile
* Improve search to automatically update results
* Fix `servers` list not being used when `server-url` is not specified.
* Fix display of `integer` and `date-time` schema styling.
* Fix `font-size-small` and exposes these variables in the documentation for configuration.

## 0.9 ##
* OpenAPI 3.1 support using `APIDevTools/json-schema-ref-parser`
* Enable searching for schemas using the search filter.
* Babel source to remove `??` and `?.` so that consumers of the library don't need to worry about those.
* `collapse` add new switch to automatically start the operations and components in collapsed mode.
* Support root level `security` field.
* `hide-components` attribute to disable showing the components.
* Fix components to actually collapse when `collapse` is set.
* Fix displaying tag descriptions correctly and add supporting slot for subsections.
* Fix schema expanded description text display
* Fix issues with allOf/oneOf with partially completed data.
* Sanitize paths coming from the spec that contain invalid characters.
* Improve display of array types and number/string formats in parameters and models
* Fix fetch request options to not require unnecessary extra level in setting properties.
* Fix support for `const` in json schema
* Fix support for `null` types and add property `display-nulls` to support forcing the display of them in models.

## 0.8 ##
* Removing the `RESET` button as it is confusing for users to see. It only repopulated the defaults, and to do that, you can easily switch tabs and come back.
* Arrays and Objects read-only indicator is now present at the top level, and these objects are hidden from POST/UPDATE/PATCH bodies.
* Support $refs to load markdown files into the spec and render them appropriately.
* Correctly show deprecated arrays and hide deprecated elements from examples.
* Add aria labels and roles to `<select>` and `<table>` elements.
* [Bug] - don't force adding the spec url to the list of servers if the server list is already populated
* [Bug] - Operations/Components expand/collapse incorrectly was scrolling out of view, now it is sticky at the top of the nav section.
* [Bug] - Remove unnecessary forced capitalization from tags in the nav bar
* [Bug] - Fix `explorer-location` tracking for updates triggered outside of component

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
* Add two `navbar-` css `::parts`

## 0.2 ##
* Automate responsive changes from "focused mode" to "scrolling view mode" so no additional parameters are necessary. `responsive` parameter has been removed