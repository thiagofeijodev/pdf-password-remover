import path from 'path';

export default {
  entry: path.resolve(process.cwd(), 'src/index.jsx'),
  output: {
    filename: 'static/[name].[contenthash].js',
    publicPath: 'auto',
    clean: true,
  },
  experiments: {
    css: true,
    asyncWebAssembly: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.module\.css$/,
        type: 'css/module',
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css',
      },
      {
        test: /\.(jsx|js)$/,
        exclude: /node_modules[\\/]core-js/,
        type: 'javascript/auto',
        use: {
          loader: 'builtin:swc-loader',
          options: {
            env: {
              mode: 'usage',
              coreJs: '3.26.1',
              targets: ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'],
            },
            isModule: 'unknown',
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  pragma: 'React.createElement',
                  pragmaFrag: 'React.Fragment',
                  throwIfNamespace: false,
                  development: process.env.NODE_ENV === 'development',
                  importSource: 'react',
                  useBuiltins: false,
                },
              },
            },
          },
        },
      },
      {
        test: /\.(png|jp(e*)g|gif)$/,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [],
};
