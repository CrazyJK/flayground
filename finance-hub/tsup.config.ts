import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  bundle: true,
  external: ['cors', 'express', 'morgan', 'dotenv', 'node-forge'],
  sourcemap: true,
  clean: true,
});
