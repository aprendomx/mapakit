# Changelog

Registro de cambios de MapaKit.

---

## [0.1.0] — 2025-04-30

### Agregado
- Núcleo del framework (`@mapakit/core`) con arquitectura de plugins
- Proveedores de configuración: Supabase, JSON estático, REST API
- Proveedores de datos: GeoJSON URL, JSON estático
- Renderizado de mapas con MapLibre GL JS
- Panel lateral interactivo con capas, filtros y búsqueda
- Filtros dinámicos (`select`, `checkbox`, `search`, `range`)
- Reordenamiento de capas con drag & drop (SortableJS)
- Cambio de color y visibilidad de capas
- Popups al hacer click en features
- Sincronización de estado con URL (deep linking)
- Persistencia de vista en `sessionStorage`
- Geocodificación con Nominatim (OpenStreetMap)
- Controles del mapa: geolocalización, pantalla completa, reset, escala
- Diseño responsive (panel lateral en desktop, drawer en móvil)
- Temas claro/oscuro
- Accesibilidad: atributos ARIA, navegación por teclado, `prefers-reduced-motion`
- Herramienta de medición de distancias
- Minimap
- Tooltip al hacer hover sobre features
- Estados vacío y error
- Exportación de datos: GeoJSON, CSV, KML
- Clustering de puntos con Supercluster
- Simplificación de geometrías (Douglas-Peucker)
- Filtrado por viewport
- Autenticación con Supabase Auth
- Componentes para React y Vue
- Ejemplo funcional con Vue + Vite
- Docker Compose + Supabase local
- Migraciones SQL para el esquema de base de datos
- Service Worker para soporte offline
- Atajos de teclado: Escape, Cmd/Ctrl+K, Cmd/Ctrl+Shift+F

### Fixed
- Correcciones iniciales de UX y rendimiento

---

## Convención de versionado

Este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/):

- `MAJOR` — Cambios incompatibles con versiones anteriores
- `MINOR` — Nuevas funcionalidades compatibles hacia atrás
- `PATCH` — Correcciones de errores compatibles hacia atrás

---

> **Nota:** Las versiones previas a `0.1.0` fueron desarrollo interno y no están documentadas.
