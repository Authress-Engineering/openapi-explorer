import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import CompressionPlugin from 'compression-webpack-plugin';
import { DuplicatesPlugin } from 'inspectpack/plugin/duplicates.js';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';
import * as url from 'url';

const packageData = await fs.readJSON('./package.json');
const babelConfig = await fs.readJSON('./babel.config.json');
// eslint-disable-next-line no-underscore-dangle
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const version = JSON.stringify(packageData.version).replace(/"/g, '');

const commonPlugins = [
  new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
  new webpack.HotModuleReplacementPlugin(),
  new CleanWebpackPlugin(),
  new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  new CompressionPlugin(),
];

if (!process.env.GITHUB_REF) {
  glob.sync('mocks/*.html').forEach(mock => {
    commonPlugins.push(new HtmlWebpackPlugin({ template: mock, filename: mock.split('/')[1] }));
  });
}

if (process.env.NODE_ENV === 'production') {
  commonPlugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }));
  commonPlugins.push(new DuplicatesPlugin({ emitErrors: false, verbose: true }));
  const banner = `
/**
* @preserve
* OpenAPI Explorer ${version.replace()} - WebComponent to View OpenAPI docs
* License: Apache-2.0
* Repo   : https://github.com/Rhosys/openapi-explorer
* Author : Rhosys Developers
*`;
  commonPlugins.push(new webpack.BannerPlugin({
    raw: true, banner,
  }));
}

export default {
  mode: 'production',
  entry: './src/openapi-explorer.js',
  devtool: 'cheap-module-source-map',
  output: {
    path: path.join(__dirname, 'dist', 'browser'),
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
      })
    ],
  },
  devServer: {
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
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.m?js/,
        type: 'javascript/auto',
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: babelConfig,
          },
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
      // eslint-disable-next-line no-undef
      '~': path.resolve(__dirname, 'src')
    },
  },
  plugins: commonPlugins,
};
