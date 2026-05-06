import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'MapaKit',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['maplibre-gl', 'supercluster', '@supabase/supabase-js']
    }
  },
  test: {
    environment: 'jsdom'
  }
});
