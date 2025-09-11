const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool:
    process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map',

  context: __dirname,

  entry: {
    background: './background.ts',
    'content/content': './content/content.ts',
    'popup/popup': './popup/popup.ts',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { 
                  targets: { chrome: '88' },
                  modules: false
                }],
                ['@babel/preset-react', { 
                  runtime: 'automatic',
                  importSource: 'react'
                }],
                '@babel/preset-typescript'
              ],
              plugins: [
                '@babel/plugin-transform-class-properties'
              ]
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    modules: [
      path.resolve(__dirname, '../../node_modules'),
      'node_modules'
    ]
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json',
        },
        {
          from: 'popup/popup.html',
          to: 'popup/popup.html',
        },
        {
          from: 'content/content.css',
          to: 'content/content.css',
        },
        {
          from: 'assets',
          to: 'assets',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],

  optimization: {
    splitChunks: false,
  },
};
