const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/app/(extension)/background.ts',
    content: './src/app/(extension)/content/content.ts',
    popup: './src/app/(extension)/popup/popup.ts',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/app/(extension)/manifest.json',
          to: 'manifest.json',
        },
        {
          from: 'src/app/(extension)/assets',
          to: 'assets',
          noErrorOnMissing: true,
        },
        {
          from: 'src/app/(extension)/popup/popup.html',
          to: 'popup/popup.html',
        },
      ],
    }),
  ],
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
};
