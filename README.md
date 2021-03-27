<img alt="Rhosys logo" src="https://rhosys.ch/assets/images/rhosys.png" width="200px" />


<p align="center">
    <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square">
    <!--<img src="https://img.shields.io/github/size/Rhosys/openapi-explorer/dist/openapi-explorer.min.js.svg?colorB=blue&label=minified&style=flat-square">-->
    <!--<img src="https://img.shields.io/github/size/Rhosys/openapi-explorer/dist/openapi-explorer.min.js.gz.svg?colorB=blue&label=zip&style=flat-square">-->
    <a href="https://badge.fury.io/js/openapi-explorer" alt="npm version">
        <img src="https://badge.fury.io/js/openapi-explorer.svg">
    </a>
    <a href="https://www.webcomponents.org/element/openapi-explorer" alt="published on webcomponents.org">
        <img src="https://img.shields.io/badge/webcomponents.org-OpenAPI%20Explorer-blue.svg?style=social">
    </a>
</p>        

# OpenAPI Explorer - Currently Under Development
Web Component Custom Element for Open-API spec viewing, with automatic integration for React and Vue.

_(This project was forked from [RapiDoc](https://github.com/mrin9/RapiDoc), and provides a cleaner skimmed down version of the functionality which works out of the box!)_

## Get started now
`npm i openapi-explorer`

### Quick start example
* `import 'openapi-explorer';`

```html
<openapi-explorer :id="apiExplorer" :spec-url="openapiSpecificationUrl">
  <div slot="overview">
    <h1>The API</h1>
  </div>
</openapi-explorer>
```

## Features
- OpenAPI 3.0 
- Works with any framework
- View resources, models, and directly make API calls
- Better Usability, 
  - Request fields are pre-populated with default data
  - Takes only one click to make an API call
- Branding and Personalization features makes it easy to follow any style guide
  - Fully customizeable theme
- Plenty of customization options 
  - Add external contents at the top and bottom of the document,  you may add images, link, text, forms etc
  - Allows disabling API calling feature
  - All properties are reactive
  - Style the element with standard css (change padding, position, border, margin )
- Responsive so it works on mobile
- Lightweight and fast


## Documentation
<!--[Check out the usage and demos](https://rhosys.github.io/openapi-explorer/)-->

### Mutate request and responses
```js
requestInterceptor(event) {
  Object.assign(event.detail.request.options.headers, { Authorization: `Bearer ${userToken}` });
},
responseInterceptor(event) {
  if (event.detail.response?.status === 401) {
    this.enableSignupModal = true;
  }
}
```

### Dynamically update spec example
The user's id into the specification property to be used automatically in the UI
```js
onSpecLoaded(data) {
  const updateTag = tag => {
    const picker = value => {
      if (!value || typeof value !== 'object') {
        return value;
      }

      if (value.name === 'userId') {
        value.schema = Object.assign({ default: userId }, value.schema);
        return value;
      }

      return undefined;
    };
    return lodash.cloneDeepWith(tag, picker);
  };

  data.detail.tags = data.detail.tags.map(tag => updateTag(tag));
}
```

## Examples
[Examples and Test cases](https://rhosys.github.io/openapi-explorer/list.html)


## Build Process
```bash
# Clone / Download the project then
npm install

# build will generate openapi-explorer.min.js
npm run build 
```

## Contribution
[Contributions Guide](./CONTRIBUTING.md)