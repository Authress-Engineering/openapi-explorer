# OpenAPI Explorer
Web Component Custom Element for Open-API spec viewing, with automatic integration for React and Vue.

<p align="center">
    <a href="./LICENSE" alt="apache 2.0 license">
      <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg">
    </a>
    <a href="https://badge.fury.io/js/openapi-explorer" alt="npm version">
        <img src="https://badge.fury.io/js/openapi-explorer.svg">
    </a>
    <a href="https://rhosys.ch/community" alt="npm version">
      <img src="https://img.shields.io/badge/community-Discord-purple.svg">
    </a>
    <a href="https://www.webcomponents.org/element/openapi-explorer" alt="published on webcomponents.org">
        <img src="https://img.shields.io/badge/webcomponents.org-OpenAPI%20Explorer-blue.svg?style=social">
    </a>
</p>


## Beautiful and responsive API explorer and console

<p>
  <a href="https://rhosys.github.io/openapi-explorer/#?route=get-/v1/users/-userId-/resources/-resourceUri-/permissions/-permission-" target="_blank">
    <img src="./docs/desktop-view.png" alt="Desktop demo image" width="800px">
  </a>
</p>

## Check out the Demo
[OpenAPI Explorer Demo](https://rhosys.github.io/openapi-explorer/#?route=get-/v1/users/-userId-/resources/-resourceUri-/permissions/-permission-)

(Curious about the exact styling of this: [here's the exact example](./docs/authress-example.vue))

## Get started now
`npm i openapi-explorer`

### Quick start example
* `import 'openapi-explorer';`

```html
<openapi-explorer :spec-url="openapiSpecificationUrl">
  <div slot="overview">
    <h1>The API</h1>
  </div>
</openapi-explorer>
```

## Features
- OpenAPI 3.0
- Built in automatic Internationalization
- Works with any framework
- View resources, models, and directly make API calls
- Better Usability, 
  - Request fields are pre-populated with default data
  - Takes only one click to make an API call
  - Renders SDK/client code samples
  - Branding and Personalization features makes it easy to follow any style guide
  - Fully customizable theme
- Plenty of customization options 
  - Add external contents throughout the component, extensible with markdown, images, links, and text
  - All properties are reactive
  - Style the element with standard css (change padding, position, border, margin )
  - Styles that reflect your site and your UI/UX frameworks (React, Vue, vanilla js, Bootstrap, Material, and many more...)
- Responsive so it works on mobile
- Lightweight and fast


## Documentation
* [Migrating from v1 to v2 of openapi-explorer](./CHANGELOG.md#2.0) - Review the breaking changes
* [Property and variables documentation](./docs/documentation.md)
* [Examples (Vue, React, JS, and more)](./docs/examples.md)
* Generate the open specification document necessary for this library - by using an editor or by following the [Open API Specification](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md)
* [Styling your openapi-explorer UI](./docs/styling.md)
* [Recent changes and updates](./CHANGELOG.md)

## Troubleshooting integration issues
[Common issues](./docs/troubleshooting.md)


## Contribution
[Contributions Guide](./CONTRIBUTING.md)

```bash
# Clone / Download the project then
git clone

## Pull in dependencies
yarn

# build will generate dist/openapi-explorer.min.js
yarn build 

import 'openapi-explorer';
```


## Copyright
Copyright 2023 Rhosys AG

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this repository source except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.