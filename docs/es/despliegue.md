# Guía de Despliegue

Cómo desplegar una aplicación MapaKit en producción usando Vercel, Netlify o un servidor propio.

---

## Requisitos previos

- Un proyecto MapaKit funcionando localmente
- Una cuenta en Supabase (o tu backend propio)
- Una cuenta en Vercel, Netlify o acceso a un servidor

---

## Opción 1: Despliegue en Vercel

### 1.1 Preparar el proyecto

Asegúrate de que tu `package.json` tenga el script de build:

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.2 Configurar variables de entorno

Crea un archivo `.env` en la raíz:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_KEY=tu-anon-key
```

> **Nota:** Vercel expone solo variables que empiezan con `VITE_` al frontend.

### 1.3 Instalar el CLI de Vercel

```bash
npm install -g vercel
```

### 1.4 Desplegar

```bash
vercel
```

Sigue las instrucciones. Vercel detectará automáticamente Vite y construirá tu proyecto.

### 1.5 Configurar variables en el dashboard

1. Ve al [Dashboard de Vercel](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings > Environment Variables**
4. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`

### 1.6 Configurar dominios en Supabase

En tu dashboard de Supabase:

1. Ve a **Authentication > URL Configuration**
2. Agrega tu dominio de Vercel en **Redirect URLs**
3. Guarda los cambios

---

## Opción 2: Despliegue en Netlify

### 2.1 Preparar el proyecto

Igual que con Vercel, asegúrate de tener el script `build`.

### 2.2 Crear `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> El redirect es necesario para aplicaciones SPA (Single Page Application).

### 2.3 Configurar variables de entorno

Crea `.env`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_KEY=tu-anon-key
```

### 2.4 Desplegar con el CLI

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### 2.5 Configurar variables en el dashboard

1. Ve al [Dashboard de Netlify](https://app.netlify.com/)
2. Selecciona tu sitio
3. Ve a **Site settings > Environment variables**
4. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`

---

## Opción 3: Despliegue en servidor propio (Nginx)

### 3.1 Construir el proyecto

```bash
npm run build
```

Esto generará la carpeta `dist/` con los archivos estáticos.

### 3.2 Configurar Nginx

```nginx
server {
    listen 80;
    server_name mapas.tusitio.com;
    root /var/www/mapakit/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA redirect
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3.3 Copiar archivos al servidor

```bash
scp -r dist/* usuario@servidor:/var/www/mapakit/dist/
```

### 3.4 Recargar Nginx

```bash
ssh usuario@servidor "sudo nginx -s reload"
```

---

## Configuración de Supabase para producción

### Políticas RLS (Row Level Security)

Asegúrate de que tus tablas tengan políticas RLS configuradas:

```sql
-- Permitir lectura pública para mapas públicos
CREATE POLICY "Mapas públicos son legibles por todos"
ON map_configurations FOR SELECT
USING (is_public = true);

-- Permitir lectura solo al propietario para mapas privados
CREATE POLICY "Mapas privados solo para el propietario"
ON map_configurations FOR SELECT
USING (auth.uid() = owner_id);
```

### Configurar CORS

En Supabase, ve a **API > Settings** y configura los orígenes permitidos:

```
https://tu-app.vercel.app
https://tu-app.netlify.app
```

### Migraciones en producción

Aplica las migraciones a tu proyecto de Supabase en producción:

```bash
supabase link --project-ref tu-project-ref
supabase db push
```

---

## Variables de entorno recomendadas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://abc123.supabase.co` |
| `VITE_SUPABASE_KEY` | Clave anónima de Supabase | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_MAPKIT_API_URL` | URL de tu API propia (si aplica) | `https://api.tusitio.com` |

---

## Checklist antes de desplegar

- [ ] El proyecto compila sin errores (`npm run build`)
- [ ] Las variables de entorno están configuradas en la plataforma
- [ ] Los dominios están agregados en Supabase (Auth + CORS)
- [ ] Las políticas RLS están activas y probadas
- [ ] Las migraciones de la base de datos están aplicadas
- [ ] El mapa funciona correctamente en modo preview (`npm run preview`)
- [ ] Las imágenes y assets se cargan correctamente
- [ ] El deep linking / URL state funciona en el dominio de producción

---

## Solución de problemas

### Error 404 al recargar la página

Asegúrate de configurar el redirect a `index.html` para SPAs:

- **Vercel**: Se maneja automáticamente
- **Netlify**: Agrega `[[redirects]]` en `netlify.toml`
- **Nginx**: `try_files $uri $uri/ /index.html;`

### Las variables de entorno no se leen

- Asegúrate de que empiecen con `VITE_` (Vite) o `REACT_APP_` (CRA)
- Reinicia el servidor de desarrollo después de cambiarlas
- En producción, verifica que estén configuradas en el dashboard

### Error de CORS en Supabase

Agrega tu dominio en **Supabase > API > Settings > Allowed Origins**.

### Assets no se cargan (rutas rotas)

En `vite.config.js`, asegúrate de tener:

```javascript
export default {
  base: './', // O la ruta base de tu deploy
};
```

---

## Monitoreo

Considera agregar:

- **Sentry** para errores en producción
- **Google Analytics** o **Plausible** para métricas de uso
- **Uptime monitoring** (UptimeRobot, Pingdom)
