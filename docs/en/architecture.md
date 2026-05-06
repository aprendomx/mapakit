# Architecture

This guide describes the structure and design of the MapaKit system.

---

## Overview

MapaKit is designed as a **modular monorepo** that separates the framework core from frontend-specific bindings. This enables:

- Reusing map logic in any project
- Keeping bindings lightweight (just wrappers)
- Developing new providers without touching the core

## Monorepo Structure

```
mapakit/
├── packages/
│   ├── core/              # Framework core (vanilla JS)
│   │   ├── src/
│   │   │   ├── index.js              # Main entry point
│   │   │   ├── MapaKit.js            # Main class
│   │   │   ├── MapRenderer.js        # MapLibre GL JS wrapper
│   │   │   ├── UIManager.js          # Sidebar panel, popups, UI
│   │   │   ├── FilterEngine.js       # Filter logic
│   │   │   ├── StateManager.js       # URL / sessionStorage sync
│   │   │   ├── AuthManager.js        # Supabase authentication
│   │   │   ├── DrawingManager.js     # Drawing and editing features
│   │   │   ├── PrintManager.js       # Print preview
│   │   │   ├── DataLoader.js         # Data loading
│   │   │   ├── ConfigLoader.js       # Configuration loading
│   │   │   ├── services/
│   │   │   │   ├── ExportService.js      # Export GeoJSON/CSV/KML
│   │   │   │   └── NominatimGeocoder.js  # Geocoding
│   │   │   ├── plugins/
│   │   │   │   ├── PluginRegistry.js         # Plugin registry
│   │   │   │   ├── ConfigProvider.js         # Base config class
│   │   │   │   ├── DataProvider.js           # Base data class
│   │   │   │   └── providers/
│   │   │   │       ├── SupabaseConfigProvider.js
│   │   │   │       ├── JsonStaticConfigProvider.js
│   │   │   │       ├── RestApiConfigProvider.js
│   │   │   │       ├── GeojsonUrlDataProvider.js
│   │   │   │       └── StaticJsonDataProvider.js
│   │   │   ├── offline/
│   │   │   │   ├── OfflineStore.js   # Offline storage
│   │   │   │   ├── sw.js             # Service Worker
│   │   │   │   └── registerSW.js     # SW registration
│   │   │   └── utils/
│   │   │       ├── geojson.js        # GeoJSON utilities
│   │   │       └── simplify.js       # Douglas-Peucker algorithm
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── react/             # React binding
│   │   ├── src/
│   │   │   └── MapaKit.jsx    # React wrapper component
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── vue/               # Vue binding (referenced)
│       ├── src/
│       │   └── MapaKit.vue    # Vue wrapper component
│       └── package.json
│
├── examples/
│   └── vue-static/        # Working example with Vue
│       ├── src/App.vue
│       └── package.json
│
├── docker/                # Docker Compose + local Supabase
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── .env.local / .env.production
│
├── supabase/
│   └── migrations/        # SQL schema and seed data
│       ├── 001_initial_schema.sql
│       ├── 002_seed_data.sql
│       ├── 003_auth_rls.sql
│       └── 004_grant_anon.sql
│
└── docs/                  # Project documentation
```

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   ConfigSource  │────▶│  ConfigProvider  │────▶│   MapaKit Core  │
│  (Supabase/JSON │     │  (loads config)  │     │  (orchestrator) │
│   /REST/API)    │     └──────────────────┘     └────────┬────────┘
└─────────────────┘                                       │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   DataSource    │────▶│   DataProvider   │────▶│   MapRenderer   │
│  (GeoJSON URL/  │     │  (loads data)    │     │ (MapLibre GL)   │
│   static JSON)  │     └──────────────────┘     └─────────────────┘
└─────────────────┘                                       │
                                                          ▼
                                               ┌─────────────────┐
                                               │   FilterEngine  │
                                               │  UIManager      │
                                               │  StateManager   │
                                               │  AuthManager    │
                                               └─────────────────┘
```

## Design Patterns

### 1. Plugin Registry

Configuration and data providers are registered dynamically. The framework automatically selects the appropriate provider based on the `canLoad()` or `supports()` method.

### 2. Event-Driven

All components communicate through an internal event bus:

- `ready` — Map initialized
- `featureClick` — Feature clicked
- `filterChange` — Filter changed
- `layerChange` — Layer changed
- `error` — Recoverable or critical error

### 3. State Synchronization

`StateManager` synchronizes bidirectionally:

- **URL ↔ Map**: `mk-*` URL parameters reflect the current state
- **sessionStorage**: View persistence between reloads

### 4. Responsive Adapter

`UIManager` detects the viewport and adapts the UI:

- Desktop (>768px): Fixed sidebar
- Mobile (≤768px): Slide-out drawer with FAB

## Key Technologies

| Technology | Purpose |
|------------|---------|
| MapLibre GL JS | WebGL map rendering |
| Supercluster | Point clustering |
| SortableJS | Drag & drop in layer panel |
| Vite | Bundling and development |
| Vitest | Unit testing |
| Supabase | Backend (Auth + PostgreSQL + PostgREST) |
| Docker | Local development environment |

## Security

- **RLS (Row Level Security)**: Supabase tables have RLS policies to restrict access to private maps.
- **JWT**: Authentication tokens are passed to the framework via the `authToken` parameter.
- **Anon Key**: The public `supabaseKey` only allows RLS-authorized operations.

## Performance

- **Douglas-Peucker simplification** based on zoom level
- **Viewport filtering** with precomputed bounding boxes
- **150ms debounce** on filters
- **20-layer pagination** per page in the panel
