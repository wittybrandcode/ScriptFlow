import path from 'path';
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/core', 'src/kinship', 'src/mawarith', 'src/engine', 'src/types', 'src/i18n', 'src/plugins', 'src/index.ts'],
      exclude: ['**/__tests__/**', '**/*.test.ts'],
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Nasab',
      fileName: (format) => `nasab.${format}.js`
    },
    rollupOptions: {
      external: ['fraction.js'],
      output: {
        globals: {
          'fraction.js': 'Fraction'
        }
      }
    },
    outDir: 'lib'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
