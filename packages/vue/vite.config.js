import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/MapaKit.vue',
      name: 'MapaKitVue',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', '@mapakit/core']
    }
  }
});
