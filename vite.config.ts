import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    // A API não tem CORS: em dev, /api passa pelo Vite; em produção, front e API dividem o domínio.
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  build: {
    // Nada de data: URI: a CSP só libera img-src/font-src 'self', e a marca é servida como arquivo.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
