import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapaKit } from '@mapakit/core';

export const MapaKitComponent = forwardRef(({
  configId,
  supabaseUrl,
  supabaseKey,
  authToken,
  configProvider,
  onReady,
  onFeatureClick,
  onFilterChange,
  onError,
  style
}, ref) => {
  const containerRef = useRef(null);
  const frameworkRef = useRef(null);
  const callbacksRef = useRef({ onReady, onFeatureClick, onFilterChange, onError });

  // Keep callback refs up to date without triggering effect re-run
  callbacksRef.current = { onReady, onFeatureClick, onFilterChange, onError };

  useImperativeHandle(ref, () => ({
    setFilter: (filterId, value) => frameworkRef.current?.setFilter(filterId, value),
    clearFilters: () => frameworkRef.current?.clearFilters(),
    flyTo: (options) => frameworkRef.current?.flyTo(options),
    moveLayer: (layerId, beforeLayerId) => frameworkRef.current?.moveLayer(layerId, beforeLayerId),
    setLayerColor: (layerId, color) => frameworkRef.current?.setLayerColor(layerId, color),
    setLayerVisible: (layerId, visible) => frameworkRef.current?.setLayerVisible(layerId, visible)
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const framework = new MapaKit({
      container: containerRef.current,
      configId,
      supabaseUrl,
      supabaseKey,
      authToken,
      configProvider
    });

    frameworkRef.current = framework;

    framework.on('ready', (e) => callbacksRef.current.onReady?.(e));
    framework.on('featureClick', (e) => callbacksRef.current.onFeatureClick?.(e));
    framework.on('filterChange', (e) => callbacksRef.current.onFilterChange?.(e));
    framework.on('error', (e) => callbacksRef.current.onError?.(e));

    framework.init().catch(err => {
      callbacksRef.current.onError?.({ type: 'init', message: err.message });
    });

    return () => {
      framework.destroy();
      frameworkRef.current = null;
    };
  }, [configId, supabaseUrl, supabaseKey, authToken]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#06090f',
        ...style
      }}
    />
  );
});

MapaKitComponent.displayName = 'MapaKit';
