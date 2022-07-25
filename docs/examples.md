## OpenAPI Explorer Examples

### React
```jsx
import React, { Component } from 'react';
import 'openapi-explorer';

export class MyApi extends Component {
  render() {
    return <openapi-explorer
      spec-url = "https://petstore.swagger.io/v2/swagger.json">
    </openapi-explorer>
  }
}
```

### Vue
```vue
<template>
  <openapi-explorer
    spec-url = "https://petstore.swagger.io/v2/swagger.json">
  </openapi-explorer>
</template>

<script>
  import 'openapi-explorer';
</script>
```

### Vanilla Javascript/HTML
```html
<!doctype html>
<html>
  <head>
    <script type="module" src="https://unpkg.com/openapi-explorer/dist/browser/openapi-explorer.min.js"></script>
    <!-- Or use a local deployed copy -->
    <!-- <script type="module" src="node_modules/openapi-explorer/dist/openapi-explorer.min.js"></script> -->
  </head>
  <body>
    <openapi-explorer spec-url="https://petstore.swagger.io/v2/swagger.json"> </openapi-explorer>
  </body>
</html>
```

### SSR - Server side rendering
SSR works as linked documents. You can include any of the above snippets and they will work as long as they are rendered on the client. If you run into any issues checkout the [SSR troubleshooting guide](./troubleshooting.md#ssr-server-side-rendering)


## CSS Frameworks
When using a CSS framework it comes with color palettes amongst other things. You may or may not want to use those colors. The OpenAPI Explorer also comes with colors to make it easier to integrate.

* By default the CSS framework colors will take precedent.
* You can explicitly set the colors that the OpenAPI Explorer uses by using the defined the [CSS variables](./documentation.md#css-variables) section.

## OpenAPI Specification generation
To use the OpenAPI Explorer, there must be a spec generated. Many libraries exist to convert static-strict type code to an openapi spec which can automatically be used by this framework. Find the one that works best for your application and then just point the OpenAPI Explorer spec url at the generated endpoint.

_[See all OpenAPI Tools](https://openapi.tools/)_

* C# .NetCore - [Swashbuckle](https://docs.microsoft.com/en-us/aspnet/core/tutorials/getting-started-with-swashbuckle?view=aspnetcore-5.0&tabs=visual-studio)