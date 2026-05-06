<template>
  <div style="width: 100vw; height: 100vh; background: #06090f;">
    <MapaKitVue
      ref="mapRef"
      config-id="/config/mapa-agenda.json"
      config-provider="json-static"
      @ready="onReady"
      @feature-click="onFeatureClick"
      @filter-change="onFilterChange"
      @error="onError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { MapaKitVue } from '@mapakit/vue';

const mapRef = ref(null);

const onReady = (e) => console.log('Mapa listo (Vue)!', e);
const onFeatureClick = (e) => console.log('Feature click', e);
const onFilterChange = (e) => console.log('Filter change', e);
const onError = (e) => console.error('Error', e);
</script>
