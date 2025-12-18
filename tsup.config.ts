import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'Authmate',
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
});
