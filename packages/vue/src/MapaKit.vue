<template>
  <div
    ref="containerRef"
    :style="{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: '#06090f',
      ...containerStyle
    }"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, defineEmits, defineExpose } from 'vue';
import { MapaKit } from '@mapakit/core';

const props = defineProps({
  configId: { type: String, required: true },
  supabaseUrl: { type: String, default: null },
  supabaseKey: { type: String, default: null },
  authToken: { type: String, default: null },
  configProvider: { type: String, default: null },
  containerStyle: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['ready', 'feature-click', 'filter-change', 'error']);

const containerRef = ref(null);
let framework = null;

onMounted(() => {
  if (!containerRef.value) return;

  framework = new MapaKit({
    container: containerRef.value,
    configId: props.configId,
    supabaseUrl: props.supabaseUrl,
    supabaseKey: props.supabaseKey,
    authToken: props.authToken,
    configProvider: props.configProvider
  });

  framework.on('ready', (e) => emit('ready', e));
  framework.on('featureClick', (e) => emit('feature-click', e));
  framework.on('filterChange', (e) => emit('filter-change', e));
  framework.on('error', (e) => emit('error', e));

  framework.init().catch((err) => {
    emit('error', { type: 'init', message: err.message });
  });
});

onUnmounted(() => {
  framework?.destroy();
  framework = null;
});

defineExpose({
  setFilter: (filterId, value) => framework?.setFilter(filterId, value),
  clearFilters: () => framework?.clearFilters(),
  flyTo: (options) => framework?.flyTo(options),
  moveLayer: (layerId, beforeLayerId) => framework?.moveLayer(layerId, beforeLayerId),
  setLayerColor: (layerId, color) => framework?.setLayerColor(layerId, color),
  setLayerVisible: (layerId, visible) => framework?.setLayerVisible(layerId, visible)
});
</script>
