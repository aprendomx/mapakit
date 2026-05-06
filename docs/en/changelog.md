# Changelog

MapaKit change log.

---

## [0.1.0] — 2025-04-30

### Added
- Framework core (`@mapakit/core`) with plugin architecture
- Config providers: Supabase, static JSON, REST API
- Data providers: GeoJSON URL, static JSON
- Map rendering with MapLibre GL JS
- Interactive side panel with layers, filters, and search
- Dynamic filters (`select`, `checkbox`, `search`, `range`)
- Layer reordering with drag & drop (SortableJS)
- Layer color and visibility toggling
- Feature click popups
- URL state synchronization (deep linking)
- View persistence in `sessionStorage`
- Geocoding with Nominatim (OpenStreetMap)
- Map controls: geolocation, fullscreen, reset, scale
- Responsive design (sidebar on desktop, drawer on mobile)
- Light/dark themes
- Accessibility: ARIA attributes, keyboard navigation, `prefers-reduced-motion`
- Distance measurement tool
- Minimap
- Hover tooltip on features
- Empty and error states
- Data export: GeoJSON, CSV, KML
- Point clustering with Supercluster
- Geometry simplification (Douglas-Peucker)
- Viewport filtering
- Authentication with Supabase Auth
- React and Vue components
- Working example with Vue + Vite
- Docker Compose + local Supabase
- SQL migrations for database schema
- Service Worker for offline support
- Keyboard shortcuts: Escape, Cmd/Ctrl+K, Cmd/Ctrl+Shift+F

### Fixed
- Initial UX and performance fixes

---

## Versioning Convention

This project follows [Semantic Versioning](https://semver.org/):

- `MAJOR` — Incompatible changes with previous versions
- `MINOR` — New backward-compatible features
- `PATCH` — Backward-compatible bug fixes

---

> **Note:** Versions prior to `0.1.0` were internal development and are not documented.
