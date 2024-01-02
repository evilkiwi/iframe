import { join, resolve } from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    dts({
      outDir: join(__dirname, 'build'),
      tsconfigPath: join(__dirname, 'tsconfig.json'),
      staticImport: true,
    }),
  ],
  resolve: {
    alias: [{ find: /^@\/(.*)/, replacement: `${resolve(__dirname, 'src')}/$1` }],
  },
  json: {
    namedExports: false,
    stringify: true,
  },
  build: {
    sourcemap: process.env.MODE === 'development' ? true : false,
    outDir: 'build',
    assetsDir: '.',
    minify: process.env.MODE === 'development' ? false : 'terser',
    target: 'chrome91',
    terserOptions: {
      ecma: 2020,
      compress: {
        passes: 2,
      },
      safari10: false,
    },
    lib: {
      entry: join('src', 'index.ts'),
      formats: ['es', 'cjs'],
      fileName: 'index',
      name: 'iFrame',
    },
    rollupOptions: {
      external: ['react'],
    },
    emptyOutDir: true,
  },
});
