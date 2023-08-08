# Troubleshooting integration issues


## Loading a specification from object instead of url
In certain cases you may have a reference to the specification object already. For example if you wished to apply pre-processing or dynamically generate it. To load this spec in:

```js
const apiSpecificationObject = { /*... The load the spec into an object here */ };
const apiExplorer = document.getElementsByTagName('openapi-explorer')[0];
await apiExplorer.loadSpec(apiSpecificationObject);
```

_(Note: Make sure to set the `server-url="ServerUrl"` attribute because without the `spec-url` set, the server url cannot be defaulted.)_

## SSR: Server-side rendering
_(For example Nextjs, Nuxtjs)_

In certain cases your app might be completely dynamic and you serve it from a web server and do SSR. In these cases, most SSR libraries don't well support polyfilling the necessary browser APIs and so the easiest thing to do is delay rendering until it is on the client side:
```vue
<template>
  <div>
    <client-only>
      <openapi-explorer spec-url="https://petstore.swagger.io/v2/swagger.json"></openapi-explorer>
    </client-only>
  </div>
</template>

<script>
export default {
  created () {
    if (process.client) {
      require('openapi-explorer')
    }
  }
}
</script>
```

## Using the transpiled & pre-bundled version
There is a pre-bundled version of the library deployed in the npm package which can be pulled in via `require('openapi-explorer/dist/browser/openapi-explorer.min.js')`.

## Using the non-transpiled version
The version built and deployed as the entry point is a minified version at `dist/browser/openapi-explorer.min.js`. When using `import openapi-explorer` source version (`import openapi-explorer/src/openapi-explorer`), you might see this issue depending on your babel configuration or want a more optimized version. In this case, add `openapi-explorer` to your transpiled packages:

in `webpack.config`
```
transpileDependencies: ['openapi-explorer']
```

## web component rendering issues in limited browsers

```sh
Module Error (from ./node_modules/thread-loader/dist/cjs.js):

/home/warren/git/authress/openapi-explorer/src/utils/theme.js
  0:0  error  Parsing error: Cannot find module './.babelrc.json'
Require stack:
- /home/warren/git/authress/openapi-explorer/node_modules/@babel/core/lib/config/files/configuration.js
- /home/warren/git/authress/openapi-explorer/node_modules/@babel/core/lib/config/files/index.js
- /home/warren/git/authress/openapi-explorer/node_modules/@babel/core/lib/index.js
- /home/warren/git/authress/openapi-explorer/node_modules/@babel/eslint-parser/lib/index.js
```

Every browser should support the compiled library available here, in the rare case that it doesn't adding the following babel plugins will help:

```sh
npm install babel-config-transform-custom-element-classes @babel/plugin-transform-classes
```

And then include them in your `babel.config.js` (this a vue example):
```js
module.exports = {
  presets: [
    ['@vue/app', { useBuiltIns: 'entry', polyfills: [] }]
  ],
  plugins: [
    'transform-custom-element-classes',
    '@babel/plugin-transform-classes'
  ]
};

```

## Typescript

`error TS2339: Property 'openapi-explorer' does not exist on type 'JSX.IntrinsicElements'.`

Add this declaration in your component that references the `import 'openapi-explorer'`:

```tsx
interface OpenApiExplorerProps {
  collapse?: boolean;
  table?: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openapi-explorer': OpenApiExplorerProps & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
```