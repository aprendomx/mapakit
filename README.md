<p align="center">
  <img src="https://img.shields.io/badge/MapaKit-Framework%20de%20Mapas%20Interactivos-0ea5e9?style=for-the-badge&logo=maplibre&logoColor=white" alt="MapaKit">
</p>

<h1 align="center">MapaKit</h1>

<p align="center">
  <strong>Framework de mapeo interactivo impulsado por MapLibre GL JS</strong><br>
  <em>Interactive mapping framework powered by MapLibre GL JS</em>
</p>

<p align="center">
  <a href="#español">🇪🇸 Español</a> •
  <a href="#english">🇬🇧 English</a>
</p>

---

<a name="español"></a>
## 🇪🇸 Español

MapaKit es un framework modular y reusable para crear mapas interactivos configurables mediante JSON. Soporta múltiples fuentes de datos y proveedores de configuración a través de una arquitectura de plugins extensible.

### ✨ Características Principales

- 🗺️ **Renderizado con MapLibre GL JS** — Mapas rápidos y fluidos con WebGL
- ⚙️ **Configuración vía JSON** — Define estilos, capas, filtros e imágenes sin escribir código
- 🔌 **Arquitectura de Plugins** — Proveedores de configuración (Supabase, REST API, JSON estático) y datos (GeoJSON URL, JSON estático)
- 🎨 **Panel de Capas Interactivo** — Reordenar con drag & drop, cambiar colores, activar/desactivar visibilidad
- 🔍 **Filtros Dinámicos** — Filtrado en tiempo real con debounce y transiciones animadas
- 🔗 **Deep Linking / URL State** — Sincronización automática del estado del mapa con la URL
- 🌍 **Geocodificación** — Búsqueda de lugares vía Nominatim (OpenStreetMap)
- 📏 **Herramienta de Medición** — Mide distancias entre puntos en el mapa
- ✏️ **Dibujo y Edición** — Crea y edita puntos, líneas y polígonos directamente en el mapa
- 📤 **Exportación de Datos** — GeoJSON, CSV y KML
- 🌙 **Temas Claro/Oscuro** — Cambio dinámico de tema con basemaps adaptativos
- ♿ **Accesibilidad (a11y)** — Atributos ARIA, navegación por teclado y `prefers-reduced-motion`
- 📱 **Diseño Responsive** — Panel lateral en desktop, drawer deslizable en móvil
- ⚡ **Optimizaciones de Performance** — Simplificación de geometrías, filtrado por viewport, paginación y debounce
- 🔒 **Autenticación** — Integración con Supabase Auth y políticas RLS
- 📦 **Multi-framework** — Bindings para React, Vue y uso vanilla JS

### 🏗️ Arquitectura del Monorepo

```
mapakit/
├── packages/
│   ├── core/          # @mapakit/core — Núcleo del framework (vanilla JS)
│   ├── react/         # @mapakit/react — Componente React
│   └── vue/           # @mapakit/vue — Componente Vue (referenciado en ejemplos)
├── examples/
│   └── vue-static/    # Ejemplo de uso con Vue + Vite
├── docker/            # Configuración Docker + Supabase
├── supabase/
│   └── migrations/    # Esquema de base de datos y seed data
└── docs/              # Documentación
```

### 🚀 Inicio Rápido

#### Requisitos

- Node.js 18+
- pnpm 8.15.0+ (gestor de paquetes del proyecto)

#### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd mapas

# Instalar dependencias
pnpm install

# Construir todos los paquetes
pnpm build
```

#### Usar en tu proyecto

**Vanilla JS:**

```bash
npm install @mapakit/core
```

```javascript
import { MapaKit } from '@mapakit/core';

const map = new MapaKit({
  container: '#map',
  configId: 'tu-config-uuid',
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseKey: 'tu-anon-key'
});

map.on('ready', () => console.log('¡Mapa cargado!'));
map.init();
```

**React:**

```bash
npm install @mapakit/react
```

```jsx
import { MapaKit } from '@mapakit/react';

function App() {
  return <MapaKit
    container="#map"
    configId="tu-config-uuid"
    supabaseUrl="https://tu-proyecto.supabase.co"
    supabaseKey="tu-anon-key"
  />;
}
```

> Para más detalles de la API, consulta la [documentación del core](./packages/core/README.md).

### 🐳 Docker + Supabase

El proyecto incluye configuración Docker para levantar un entorno local de Supabase completo:

```bash
cd docker
cp .env.local.example .env.local
docker compose up -d
```

Esto levanta: Supabase Auth, PostgREST, Kong Gateway y PostgreSQL.

### 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/es/instalacion.md](./docs/es/instalacion.md) | Guía de instalación detallada |
| [docs/es/arquitectura.md](./docs/es/arquitectura.md) | Arquitectura y diseño del sistema |
| [docs/es/docker-supabase.md](./docs/es/docker-supabase.md) | Configuración del entorno con Docker |
| [packages/core/README.md](./packages/core/README.md) | API completa del core |

### 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### 📄 Licencia

Este proyecto está licenciado bajo la [GNU General Public License v3.0](./LICENSE).

---

<a name="english"></a>
## 🇬🇧 English

MapaKit is a modular, reusable framework for creating interactive maps driven by JSON configuration. It supports multiple data sources and configuration providers through an extensible plugin architecture.

### ✨ Key Features

- 🗺️ **MapLibre GL JS Rendering** — Fast, smooth maps powered by WebGL
- ⚙️ **JSON Configuration** — Define styles, layers, filters, and images without writing code
- 🔌 **Plugin Architecture** — Config providers (Supabase, REST API, Static JSON) and data providers (GeoJSON URL, Static JSON)
- 🎨 **Interactive Layers Panel** — Drag & drop reordering, color pickers, visibility toggles
- 🔍 **Dynamic Filters** — Real-time filtering with debounce and animated transitions
- 🔗 **Deep Linking / URL State** — Automatic map state synchronization with the URL
- 🌍 **Geocoding** — Place search via Nominatim (OpenStreetMap)
- 📏 **Measurement Tool** — Measure distances between points on the map
- ✏️ **Drawing & Editing** — Create and edit points, lines, and polygons directly on the map
- 📤 **Data Export** — GeoJSON, CSV, and KML
- 🌙 **Light/Dark Themes** — Dynamic theme switching with adaptive basemaps
- ♿ **Accessibility (a11y)** — ARIA attributes, keyboard navigation, and `prefers-reduced-motion`
- 📱 **Responsive Design** — Sidebar on desktop, slide-out drawer on mobile
- ⚡ **Performance Optimizations** — Geometry simplification, viewport filtering, pagination, and debounce
- 🔒 **Authentication** — Supabase Auth integration with RLS policies
- 📦 **Multi-framework** — Bindings for React, Vue, and vanilla JS

### 🏗️ Monorepo Architecture

```
mapakit/
├── packages/
│   ├── core/          # @mapakit/core — Framework core (vanilla JS)
│   ├── react/         # @mapakit/react — React component
│   └── vue/           # @mapakit/vue — Vue component (referenced in examples)
├── examples/
│   └── vue-static/    # Usage example with Vue + Vite
├── docker/            # Docker + Supabase configuration
├── supabase/
│   └── migrations/    # Database schema and seed data
└── docs/              # Documentation
```

### 🚀 Quick Start

#### Requirements

- Node.js 18+
- pnpm 8.15.0+ (project package manager)

#### Installation

```bash
# Clone the repository
git clone <repo-url>
cd mapas

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

#### Use in your project

**Vanilla JS:**

```bash
npm install @mapakit/core
```

```javascript
import { MapaKit } from '@mapakit/core';

const map = new MapaKit({
  container: '#map',
  configId: 'your-config-uuid',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key'
});

map.on('ready', () => console.log('Map loaded!'));
map.init();
```

**React:**

```bash
npm install @mapakit/react
```

```jsx
import { MapaKit } from '@mapakit/react';

function App() {
  return <MapaKit
    container="#map"
    configId="your-config-uuid"
    supabaseUrl="https://your-project.supabase.co"
    supabaseKey="your-anon-key"
  />;
}
```

> For full API details, check the [core documentation](./packages/core/README.md).

### 🐳 Docker + Supabase

The project includes Docker configuration to spin up a complete local Supabase environment:

```bash
cd docker
cp .env.local.example .env.local
docker compose up -d
```

This starts: Supabase Auth, PostgREST, Kong Gateway, and PostgreSQL.

### 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/en/installation.md](./docs/en/installation.md) | Detailed installation guide |
| [docs/en/architecture.md](./docs/en/architecture.md) | System architecture and design |
| [docs/en/docker-supabase.md](./docs/en/docker-supabase.md) | Docker environment setup |
| [packages/core/README.md](./packages/core/README.md) | Complete core API |

### 🤝 Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the [GNU General Public License v3.0](./LICENSE).

---

<p align="center">
  Hecho con ❤️ por el equipo de MapaKit
</p>
