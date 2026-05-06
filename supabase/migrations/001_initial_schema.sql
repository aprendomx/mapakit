-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Map configurations table
CREATE TABLE map_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID,
  is_public BOOLEAN DEFAULT true,
  style JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  initial_view JSONB DEFAULT '{"center": [-99.13, 23.5], "zoom": 4.8, "bearing": 0, "pitch": 0}',
  ui_layout JSONB DEFAULT '{"panel": {"enabled": true, "position": "left", "width": 380, "collapsible": true}, "popup": {"enabled": true, "maxWidth": 320}, "images": {"enabled": false}}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data sources table
CREATE TABLE map_data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id UUID NOT NULL REFERENCES map_configurations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('geojson', 'json_points', 'json_lines', 'json_polygons')),
  geometry_field TEXT,
  properties_mapping JSONB DEFAULT '{}',
  refresh_interval INTEGER CHECK (refresh_interval > 0),
  layer_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Layers table
CREATE TABLE map_layers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id UUID NOT NULL REFERENCES map_configurations(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES map_data_sources(id) ON DELETE CASCADE,
  layer_type TEXT NOT NULL CHECK (layer_type IN ('circle', 'heatmap', 'cluster', 'fill', 'line', 'symbol')),
  filter_expression JSONB DEFAULT '[]',
  paint JSONB DEFAULT '{}',
  layout JSONB DEFAULT '{}',
  min_zoom NUMERIC DEFAULT 0,
  max_zoom NUMERIC DEFAULT 22,
  is_visible BOOLEAN DEFAULT true
);

-- Filters table
CREATE TABLE map_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id UUID NOT NULL REFERENCES map_configurations(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('select', 'multiselect', 'range', 'search', 'toggle')),
  label TEXT NOT NULL,
  options_source TEXT NOT NULL CHECK (options_source IN ('dynamic', 'static')),
  static_options JSONB,
  default_value JSONB,
  ui_position TEXT DEFAULT 'sidebar' CHECK (ui_position IN ('sidebar', 'topbar', 'floating'))
);

-- Images config table
CREATE TABLE map_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id UUID NOT NULL REFERENCES map_configurations(id) ON DELETE CASCADE,
  source_field TEXT NOT NULL,
  display_mode TEXT NOT NULL CHECK (display_mode IN ('popup', 'sidebar', 'lightbox')),
  thumbnail_field TEXT,
  caption_fields JSONB DEFAULT '[]'
);

-- Indexes
CREATE INDEX idx_map_data_sources_map_id ON map_data_sources(map_id);
CREATE INDEX idx_map_layers_map_id ON map_layers(map_id);
CREATE INDEX idx_map_layers_source_id ON map_layers(source_id);
CREATE INDEX idx_map_filters_map_id ON map_filters(map_id);
CREATE INDEX idx_map_images_map_id ON map_images(map_id);
CREATE INDEX idx_map_configurations_slug ON map_configurations(slug);

-- Row Level Security
ALTER TABLE map_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_maps_select"
  ON map_configurations FOR SELECT
  USING (is_public = true);

CREATE POLICY "owner_maps_select"
  ON map_configurations FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "owner_maps_update"
  ON map_configurations FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "owner_maps_delete"
  ON map_configurations FOR DELETE
  USING (auth.uid() = owner_id);
