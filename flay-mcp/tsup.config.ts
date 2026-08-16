import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/http-server.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  bundle: true,
  external: ['@google/generative-ai', '@modelcontextprotocol/sdk', 'cors', 'dotenv', 'express', 'openai'],
  sourcemap: true,
  clean: true,
});
