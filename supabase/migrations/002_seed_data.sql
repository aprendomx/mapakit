-- Seed data for Agenda 302 Brigadas example map

-- Insert map configuration
INSERT INTO map_configurations (id, name, slug, owner_id, is_public, style, filters, initial_view, ui_layout)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Agenda 302 Brigadas',
  'agenda-302-brigadas',
  NULL,
  true,
  '{
    "basemap": "carto-dark",
    "colors": {
      "primary": "#f59e0b",
      "secondary": "#60a5fa",
      "background": "#06090f",
      "panel": "#0c1018",
      "card": "#141a24",
      "hover": "#1b2435",
      "textPrimary": "#eceff5",
      "textSecondary": "#8a94a6",
      "textMuted": "#4f5b6e"
    },
    "typography": {
      "heading": "'IBM Plex Mono', monospace",
      "body": "'Outfit', sans-serif"
    }
  }',
  '{}',
  '{
    "center": [-99.13, 23.5],
    "zoom": 4.8,
    "bearing": 0,
    "pitch": 0
  }',
  '{
    "panel": {
      "enabled": true,
      "position": "left",
      "width": 380,
      "collapsible": true
    },
    "popup": {
      "enabled": true,
      "maxWidth": 320
    },
    "images": {
      "enabled": false
    }
  }'
);

-- Insert data source (references the GeoJSON file served from public/)
INSERT INTO map_data_sources (id, map_id, url, source_type, layer_config)
VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '/data/rutas_agenda_302.geojson',
  'geojson',
  '{
    "renderMode": "cluster",
    "clusterRadius": 55,
    "clusterMaxZoom": 15
  }'
);

-- Insert layer
INSERT INTO map_layers (id, map_id, source_id, layer_type, paint, layout, min_zoom, max_zoom, is_visible)
VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'cluster',
  '{
    "circle-color": ["get", "cl"],
    "circle-radius": 6,
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255,255,255,0.4)"
  }',
  '{}',
  0,
  22,
  true
);

-- Insert filters
INSERT INTO map_filters (id, map_id, field, filter_type, label, options_source, ui_position)
VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'i', 'select', 'Institución', 'dynamic', 'sidebar'),
  ('d4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b', 'select', 'Brigada', 'dynamic', 'sidebar'),
  ('d5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e', 'select', 'Estado', 'dynamic', 'sidebar');
