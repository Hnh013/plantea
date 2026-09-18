import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { apiMiddleware } from './server/apiMiddleware.js';

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
  plugins: [react(), apiMiddleware()],
  build: { outDir: 'dist' },
  };
});
