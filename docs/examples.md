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