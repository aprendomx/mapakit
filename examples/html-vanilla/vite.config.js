import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/rest': {
        target: 'http://localhost:54321',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost:54321',
        changeOrigin: true
      }
    }
  }
});
