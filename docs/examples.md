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
    <script type="module" src="https://cdn.skypack.dev/openapi-explorer"></script>
    <!-- Or use a local deployed copy -->
    <!-- <script type="module" src="node_modules/openapi-explorer/dist/openapi-explorer.min.js"></script> -->
  </head>
  <body>
    <openapi-explorer spec-url="https://petstore.swagger.io/v2/swagger.json"> </openapi-explorer>
  </body>
</html>
```

## CSS Frameworks
When using a CSS framework it comes with color palettes amongst other things. You may or may not want to use those colors. The OpenAPI Explorer also comes with colors to make it easier to integrate, but that can conflict.

* If you using a CSS framework that brings it own colors set `disable-default-colors="true"` and we'll avoid overwriting yours.
* Either way, you can explicitly set the colors that the OpenAPI Explorer uses by using the defined the [CSS variables](./documentation.md#css-variables) section.