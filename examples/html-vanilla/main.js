import { MapaKit } from '@mapakit/core';

const map = new MapaKit({
  container: '#app',
  configId: import.meta.env.VITE_MAP_CONFIG_ID,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
});

map.on('ready', () => {
  console.log('Mapa listo!');
});

map.on('error', (e) => {
  console.error('Error:', e);
});

map.init();
