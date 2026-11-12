import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@nasab/model': path.resolve(__dirname, 'packages/nasab-model/src'),
      '@nasab/graph': path.resolve(__dirname, 'packages/nasab-graph/src'),
      '@nasab/rule-engine': path.resolve(__dirname, 'packages/nasab-rule-engine/src'),
      '@nasab/validator': path.resolve(__dirname, 'packages/nasab-validator/src'),
      '@nasab/inference': path.resolve(__dirname, 'packages/nasab-inference/src'),
      '@nasab/api': path.resolve(__dirname, 'packages/nasab-api/src'),
    }
  },
  test: {
    include: [
      'src/**/__tests__/**/*.test.ts',
      'tests/**/*.test.ts',
      'packages/*/tests/**/*.test.ts'
    ]
  }
});
