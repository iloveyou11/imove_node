#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { lessLoader } = require('esbuild-plugin-less');
const OUT_FILE = path.join(__dirname, 'template/dist/app.bundle.js');

require('esbuild')
  .build({
    bundle: true,
    entryPoints: [path.join(__dirname, 'template/app.jsx')],
    outfile: OUT_FILE,
    plugins: [
      {
        name: 'resolve-multi-react',
        setup: (build) => {
          build.onResolve({ filter: /^react$/, namespace: 'file' }, () => {
            return {
              path: require.resolve('react'),
              watchFiles: undefined,
            };
          });
        },
      },
      {
        name: 'resolve-antd-dist-less',
        setup: (build) => {
          build.onResolve(
            { filter: /antd\/dist\/antd\.less$/, namespace: 'file' },
            () => {
              return {
                path: '',
                watchFiles: undefined,
              };
            },
          );
        },
      },
      lessLoader({
        javascriptEnabled: true,
      }),
    ],
  })
  .then(() => {
    console.log('imove editor builded');
  })
  .catch(() => process.exit(1));
