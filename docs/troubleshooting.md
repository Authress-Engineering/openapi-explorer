## Troubleshooting integration issues

#### Using the non-transpiled version
The version built and deployed as the entry point is a minified version at `dist/openapi-explorer.min.js` or `import openapi-explorer`. When using the source version `import openapi-explorer/src/openapi-explorer`, you might see this issue depending on your babel configuration.

```
error  in ./node_modules/openapi-explorer/src/index.js

Module parse failed: Unexpected token (634:46)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| 
|     // On first time Spec load, try to navigate to location hash if provided
>     const locationHash = window.location.hash?.substring(1);
|     if (locationHash) {
|       if (this.renderStyle === 'view') {
```
The library includes `?.` (@babel/plugin-proposal-optional-chaining), install this package and include the module `openapi-explorer` in your list of packages to transpile. In vue, add this to the `vue.config.js` configuration:
```js
module.exports = {
  transpileDependencies: ['openapi-explorer']
};
```

#### web component rendering issues in limited browsers
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
    'lodash',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    'transform-custom-element-classes',
    '@babel/plugin-transform-classes'
  ]
};

```
