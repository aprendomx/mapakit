import { MapaKit } from '@mapakit/core';

const map = new MapaKit({
  container: '#app',
  configProvider: 'json-static',
  configId: '/config/mapa-agenda.json'
});

map.on('ready', () => {
  console.log('Mapa listo (JSON estático)!');
});

map.on('error', (e) => {
  console.error('Error:', e);
});

map.init();
