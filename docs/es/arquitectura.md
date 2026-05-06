# Arquitectura

Esta guía describe la estructura y el diseño del sistema MapaKit.

---

## Visión General

MapaKit está diseñado como un **monorepo** modular que separa el núcleo del framework de los bindings específicos de cada framework frontend. Esto permite:

- Reutilizar la lógica del mapa en cualquier proyecto
- Mantener los bindings ligeros (solo wrappers)
- Desarrollar nuevos proveedores sin tocar el core

## Estructura del Monorepo

```
mapakit/
├── packages/
│   ├── core/              # Núcleo del framework (vanilla JS)
│   │   ├── src/
│   │   │   ├── index.js              # Punto de entrada principal
│   │   │   ├── MapaKit.js            # Clase principal
│   │   │   ├── MapRenderer.js        # Wrapper de MapLibre GL JS
│   │   │   ├── UIManager.js          # Panel lateral, popups, UI
│   │   │   ├── FilterEngine.js       # Lógica de filtros
│   │   │   ├── StateManager.js       # Sincronización URL / sessionStorage
│   │   │   ├── AuthManager.js        # Autenticación con Supabase
│   │   │   ├── DrawingManager.js     # Dibujo y edición de features
│   │   │   ├── PrintManager.js       # Previsualización e impresión
│   │   │   ├── DataLoader.js         # Carga de datos
│   │   │   ├── ConfigLoader.js       # Carga de configuración
│   │   │   ├── services/
│   │   │   │   ├── ExportService.js      # Exportar GeoJSON/CSV/KML
│   │   │   │   └── NominatimGeocoder.js  # Geocodificación
│   │   │   ├── plugins/
│   │   │   │   ├── PluginRegistry.js         # Registro de plugins
│   │   │   │   ├── ConfigProvider.js         # Clase base config
│   │   │   │   ├── DataProvider.js           # Clase base datos
│   │   │   │   └── providers/
│   │   │   │       ├── SupabaseConfigProvider.js
│   │   │   │       ├── JsonStaticConfigProvider.js
│   │   │   │       ├── RestApiConfigProvider.js
│   │   │   │       ├── GeojsonUrlDataProvider.js
│   │   │   │       └── StaticJsonDataProvider.js
│   │   │   ├── offline/
│   │   │   │   ├── OfflineStore.js   # Almacenamiento offline
│   │   │   │   ├── sw.js             # Service Worker
│   │   │   │   └── registerSW.js     # Registro del SW
│   │   │   └── utils/
│   │   │       ├── geojson.js        # Utilidades GeoJSON
│   │   │       └── simplify.js       # Algoritmo Douglas-Peucker
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── react/             # Binding para React
│   │   ├── src/
│   │   │   └── MapaKit.jsx    # Componente React wrapper
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── vue/               # Binding para Vue (referenciado)
│       ├── src/
│       │   └── MapaKit.vue    # Componente Vue wrapper
│       └── package.json
│
├── examples/
│   └── vue-static/        # Ejemplo funcional con Vue
│       ├── src/App.vue
│       └── package.json
│
├── docker/                # Docker Compose + Supabase local
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── .env.local / .env.production
│
├── supabase/
│   └── migrations/        # Esquema SQL y datos iniciales
│       ├── 001_initial_schema.sql
│       ├── 002_seed_data.sql
│       ├── 003_auth_rls.sql
│       └── 004_grant_anon.sql
│
└── docs/                  # Documentación del proyecto
```

## Flujo de Datos

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   ConfigSource  │────▶│  ConfigProvider  │────▶│   MapaKit Core  │
│  (Supabase/JSON │     │ (carga config)   │     │  (orquestador)  │
│   /REST/API)    │     └──────────────────┘     └────────┬────────┘
└─────────────────┘                                       │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   DataSource    │────▶│   DataProvider   │────▶│   MapRenderer   │
│  (GeoJSON URL/  │     │  (carga datos)   │     │ (MapLibre GL)   │
│   JSON estático)│     └──────────────────┘     └─────────────────┘
└─────────────────┘                                       │
                                                          ▼
                                               ┌─────────────────┐
                                               │   FilterEngine  │
                                               │  UIManager      │
                                               │  StateManager   │
                                               │  AuthManager    │
                                               └─────────────────┘
```

## Patrones de Diseño

### 1. Plugin Registry

Los proveedores de configuración y datos se registran dinámicamente. El framework selecciona automáticamente el proveedor adecuado basándose en el método `canLoad()` o `supports()`.

### 2. Event-Driven

Todos los componentes se comunican a través de un bus de eventos interno:

- `ready` — Mapa inicializado
- `featureClick` — Click en una feature
- `filterChange` — Cambio de filtro
- `layerChange` — Cambio en capas
- `error` — Error recuperable o crítico

### 3. State Synchronization

`StateManager` sincroniza bidireccionalmente:

- **URL ↔ Mapa**: Parámetros `mk-*` en la URL reflejan el estado actual
- **sessionStorage**: Persistencia de la vista entre recargas

### 4. Responsive Adapter

`UIManager` detecta el viewport y adapta la UI:

- Desktop (>768px): Panel lateral fijo
- Mobile (≤768px): Drawer deslizable con FAB

## Tecnologías Clave

| Tecnología | Uso |
|------------|-----|
| MapLibre GL JS | Renderizado de mapas con WebGL |
| Supercluster | Clustering de puntos |
| SortableJS | Drag & drop en el panel de capas |
| Vite | Bundling y desarrollo |
| Vitest | Tests unitarios |
| Supabase | Backend (Auth + PostgreSQL + PostgREST) |
| Docker | Entorno de desarrollo local |

## Seguridad

- **RLS (Row Level Security)**: Las tablas de Supabase tienen políticas RLS para restringir el acceso a mapas privados.
- **JWT**: Los tokens de autenticación se pasan al framework mediante el parámetro `authToken`.
- **Anon Key**: La `supabaseKey` pública solo permite operaciones autorizadas por RLS.

## Rendimiento

- **Simplificación Douglas-Peucker** según nivel de zoom
- **Filtrado por viewport** con bounding boxes precalculados
- **Debounce de 150ms** en filtros
- **Paginación de 20 capas** por página en el panel
