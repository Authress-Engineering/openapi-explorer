const webpack = require('webpack');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');
const { DuplicatesPlugin } = require('inspectpack/plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

const version = JSON.stringify(require('./package.json').version).replace(/"/g, '');

const banner = `
/**
* @preserve
* OpenAPI Explorer ${version.replace()} - WebComponent to View OpenAPI docs
* License: Apache-2.0
* Repo   : https://github.com/Rhosys/openapi-explorer
* Author : Rhosys Developers
*`;

const commonPlugins = [
  new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
  new webpack.HotModuleReplacementPlugin(),
  new CleanWebpackPlugin(),
  new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  new HtmlWebpackPlugin({ template: 'index.html' }),
  new CompressionPlugin(),
  new FileManagerPlugin({
    events: {
      onEnd: {
        copy: [
          { source: 'dist/*.js', destination: 'docs' },
          { source: 'dist/*.woff2', destination: 'docs' },
        ],
      },
    },
  }),
];

if (process.env.NODE_ENV === 'production') {
  commonPlugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }));
  commonPlugins.push(new DuplicatesPlugin({ emitErrors: false, verbose: true }));
  commonPlugins.push(new webpack.BannerPlugin({
    raw: true, banner,
  }));
  commonPlugins.push(new FileManagerPlugin({
    events: {
      onEnd: {
        copy: [
          { source: 'dist/*.js', destination: 'docs' },
        ],
      },
    },
  }));
}

module.exports = {
  mode: 'production',
  entry: './src/openapi-explorer.js',
  devtool: 'cheap-module-source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'openapi-explorer.min.js',
    publicPath: '',
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: {
          condition: /^\**!|@preserve|@license|@cc_on/i,
          banner: (licenseFile) => `OpenAPI Explorer ${version} | Author - Rhosys Developers | License information can be found in ${licenseFile} `,
        },
      }),
    ],
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
          fix: false,
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
    fallback: {
      fs: false,
    },
    alias: {
      '~': path.resolve(__dirname, 'src'),
      'lit-html/lib/shady-render.js': path.resolve(__dirname, './node_modules/lit-html/lit-html.js'), // removes shady-render.js from the bundle
    },
  },
  plugins: commonPlugins,
};
