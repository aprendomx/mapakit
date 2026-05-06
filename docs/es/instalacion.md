# Instalación

Esta guía explica cómo instalar y configurar MapaKit en tu proyecto.

---

## Requisitos Previos

- **Node.js** 18 o superior
- **pnpm** 8.15.0 o superior (recomendado, ya que el proyecto usa `pnpm-workspace`)

Verifica tus versiones:

```bash
node -v
pnpm -v
```

## Instalación del Core (Vanilla JS)

```bash
npm install @mapakit/core
```

Dependencias peer requeridas (instálalas si no las tienes):

```bash
npm install maplibre-gl supercluster @supabase/supabase-js
```

## Instalación con React

```bash
npm install @mapakit/react
```

> `@mapakit/react` incluye `@mapakit/core` como dependencia.

## Instalación con Vue

```bash
npm install @mapakit/vue
```

> Asegúrate de tener `vue` ^3.3 en tu proyecto.

## Desarrollo Local del Monorepo

Si quieres contribuir o probar cambios locales:

```bash
# Clonar el repositorio
git clone <repo-url>
cd mapas

# Instalar todas las dependencias
pnpm install

# Construir todos los paquetes
pnpm build

# Modo desarrollo (watch)
pnpm dev
```

## Verificar la Instalación

Crea un archivo HTML simple:

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
      configId: '/config/mapa-ejemplo.json'
    });

    map.on('ready', () => console.log('¡MapaKit está funcionando!'));
    map.init();
  </script>
</body>
</html>
```

## Siguientes Pasos

- Lee la [API del Core](../packages/core/README.md) para conocer todas las opciones y métodos.
- Configura [Docker y Supabase](./docker-supabase.md) para un backend completo.
