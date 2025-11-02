import path from 'path';
import { WebpackAssetsManifest } from 'webpack-assets-manifest';
import WorkboxPlugin from 'workbox-webpack-plugin';
import FaviconsRspackPlugin from 'favicons-rspack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import common from './rspack.common.mjs';
import rspack from '@rspack/core';

export default () => {
  const config = {
    ...common,
    mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
    devtool: false,
    output: {
      ...common.output,
      path: path.resolve(process.cwd(), 'docs'),
    },
    plugins: [
      new rspack.EnvironmentPlugin(['REACT_APP_GA_ID']),
      new HtmlWebpackPlugin({
        favicon: 'public/logo.png',
        template: path.join(process.cwd(), 'public/index.html'),
        filename: path.join(process.cwd(), 'docs/index.html'),
        inject: 'body',
      }),
      new FaviconsRspackPlugin({
        logo: './public/logo.png',
        cache: true,
        inject: true,
        mode: 'webapp',
        manifest: './public/manifest.json',
      }),
      new CompressionPlugin({
        filename: '[path][base].gz',
      }),
      new WebpackAssetsManifest({}),
      new WorkboxPlugin.GenerateSW(),
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
  };

  return config;
};
