import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import { RspackDevServer } from '@rspack/dev-server';
import rspack from '@rspack/core';
import common from './rspack.common.mjs';

const rspackConfig = {
  ...common,
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    ...common.output,
    path: path.resolve(process.cwd(), 'static'),
    filename: 'static/main.js',
  },
  plugins: [
    new rspack.DefinePlugin({
      'process.env.REACT_APP_GA_ID': JSON.stringify(process.env.REACT_APP_GA_ID),
    }),
    new ReactRefreshPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(process.cwd(), 'public/index.html'),
      filename: path.join(process.cwd(), 'static/index.html'),
      inject: 'body',
    }),
  ],
  devServer: {
    port: 3001,
    static: path.join(process.cwd(), 'static'),
    historyApiFallback: true,
    host: '0.0.0.0',
    open: ['/pdf-password-remover'],
    hot: true,
    client: {
      overlay: {
        runtimeErrors: false,
      },
    },
  },
};

async function run() {
  const compiler = rspack(rspackConfig);

  const serverOptions = rspackConfig.devServer || {};

  const server = new RspackDevServer(serverOptions, compiler);

  server.startCallback(() => {
    const port = serverOptions.port || 3001;
    console.log(`Successfully started server on http://localhost:${port}`);
  });
}

run();
