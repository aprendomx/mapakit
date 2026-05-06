# Installation

This guide explains how to install and configure MapaKit in your project.

---

## Prerequisites

- **Node.js** 18 or higher
- **pnpm** 8.15.0 or higher (recommended, since the project uses `pnpm-workspace`)

Verify your versions:

```bash
node -v
pnpm -v
```

## Installing the Core (Vanilla JS)

```bash
npm install @mapakit/core
```

Required peer dependencies (install them if you don't have them):

```bash
npm install maplibre-gl supercluster @supabase/supabase-js
```

## Installing with React

```bash
npm install @mapakit/react
```

> `@mapakit/react` includes `@mapakit/core` as a dependency.

## Installing with Vue

```bash
npm install @mapakit/vue
```

> Make sure you have `vue` ^3.3 in your project.

## Local Monorepo Development

If you want to contribute or test local changes:

```bash
# Clone the repository
git clone <repo-url>
cd mapas

# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Development mode (watch)
pnpm dev
```

## Verify the Installation

Create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>MapaKit Test</title>
  <style>#map { width: 100%; height: 100vh; }</style>
</head>
<body>
  <div id="map"></div>
  <script type="module">
    import { MapaKit } from '@mapakit/core';

    const map = new MapaKit({
      container: '#map',
      configProvider: 'json-static',
      configId: '/config/example-map.json'
    });

    map.on('ready', () => console.log('MapaKit is working!'));
    map.init();
  </script>
</body>
</html>
```

## Next Steps

- Read the [Core API](../packages/core/README.md) to learn about all options and methods.
- Set up [Docker & Supabase](./docker-supabase.md) for a complete backend.
