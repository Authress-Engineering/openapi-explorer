const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { DuplicatesPlugin } = require('inspectpack/plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const VERSION = JSON.stringify(require('./package.json').version).replace(/"/g, '');

const path = require('path');

const BANNER = `RapiDoc ${VERSION.replace()} - WebComponent to View OpenAPI docs
License: MIT
Repo   : https://github.com/mrin9/RapiDoc
Author : Mrinmoy Majumdar`;

const commonPlugins = [
  new webpack.HotModuleReplacementPlugin(),
  new CleanWebpackPlugin(),
  new webpack.optimize.LimitChunkCountPlugin({
    maxChunks: 1,
  }),
  new HtmlWebpackPlugin({ template: 'index.html' }),
  new CompressionPlugin(),
  new FileManagerPlugin({
    onEnd: {
      copy: [
        { source: 'dist/*.js', destination: 'docs' },
        { source: 'dist/*.woff2', destination: 'docs' },
      ],
    },
  }),
];

if (process.env.NODE_ENV === 'production') {
  console.log('BUILDING FOR PRODUCTION ... '); // eslint-disable-line no-console
  commonPlugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'static' }));
  commonPlugins.push(new DuplicatesPlugin({ emitErrors: false, verbose: true }));
  commonPlugins.push(new webpack.BannerPlugin(BANNER));
  commonPlugins.push(new webpack.DefinePlugin({ VERSION }));
  commonPlugins.push(new FileManagerPlugin({
    onEnd: {
      copy: [
        { source: 'dist/*.js', destination: 'docs' },
        { source: 'dist/*.woff2', destination: 'docs' },
      ],
    },
  }));
}

module.exports = {
  entry: './src/index.js',
  node: { fs: 'empty' },
  externals: {
    esprima: 'esprima',
    'native-promise-only': 'native-promise-only',
    commander: 'commander',
    yargs: 'yargs',
    'node-fetch': 'null',
    'node-fetch-h2': 'null',
    'cross-fetch': 'null',
    qs: 'null',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  devtool: 'cheap-module-source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'rapidoc-min.js',
  },
  devServer: {
    contentBase: path.join(__dirname, 'docs'),
    port: 8080,
    hot: true,
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          emitWarning: true,
          // failOnWarning: true,
          // failOnError: true,
          fix: true,
          configFile: './.eslintrc',
          outputReport: {
            filePath: './eslint_report.html',
            formatter: 'html',
          },
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader' },
        ],
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' }, // creates style nodes in HTML from CommonJS strings
          { loader: 'css-loader' }, // translates CSS into CommonJS
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
          },
        }],
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: commonPlugins,
};
