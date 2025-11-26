const { ProvidePlugin } = require('webpack');

module.exports = {
  webpack: {
    configure: {
      module: {
        rules: [
          {
            test: /\.wasm$/,
            type: 'webassembly/async',
          },
        ],
      },
      resolve: {
        fallback: {
          crypto: false,
          path: false,
          fs: false,
        },
      },
      experiments: {
        asyncWebAssembly: true,
      },
      plugins: [
        new ProvidePlugin({
          process: 'process/browser',
        }),
      ],
    },
  },
};