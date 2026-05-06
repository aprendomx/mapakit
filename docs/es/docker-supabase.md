# Docker y Supabase

Esta guía explica cómo levantar un entorno local completo de Supabase usando Docker.

---

## ¿Qué incluye el entorno?

El archivo `docker/docker-compose.yml` levanta los siguientes servicios:

| Servicio | Descripción | Puerto |
|----------|-------------|--------|
| **PostgreSQL** | Base de datos principal | `5432` |
| **PostgREST** | API REST automática sobre PostgreSQL | `3000` |
| **Supabase Auth (GoTrue)** | Autenticación y autorización | `9999` |
| **Kong** | API Gateway | `8000` |

## Requisitos Previos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Configuración Inicial

1. **Copiar el archivo de entorno:**

```bash
cd docker
cp .env.local.example .env.local
```

2. **Revisa las variables** en `.env.local`:

```bash
# Ejemplo de variables importantes
POSTGRES_PASSWORD=your-super-secret-password
JWT_SECRET=your-jwt-secret
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key
```

> Para desarrollo local, puedes dejar los valores por defecto. **Nunca subas `.env.local` a git.**

## Levantar el Entorno

```bash
cd docker
docker compose up -d
```

Verifica que los contenedores estén corriendo:

```bash
docker compose ps
```

## Acceso a los Servicios

- **Kong Gateway**: http://localhost:8000
- **PostgREST API**: http://localhost:3000
- **Supabase Auth**: http://localhost:9999

## Inicializar la Base de Datos

Las migraciones de Supabase se encuentran en `supabase/migrations/`. Puedes aplicarlas manualmente con `psql` o usando la consola de Supabase.

```bash
# Ejemplo: aplicar migraciones directamente a PostgreSQL
docker compose exec postgres psql -U postgres -d postgres -f /migrations/001_initial_schema.sql
```

> Asegúrate de montar el volumen de migraciones en tu `docker-compose.yml` si aún no está configurado.

## Variables de Entorno para el Frontend

Para que tu aplicación frontend se conecte al Supabase local, usa:

```javascript
const supabaseUrl = 'http://localhost:8000';
const supabaseKey = 'your-anon-key'; // De .env.local
```

## Detener el Entorno

```bash
cd docker
docker compose down
```

Para eliminar también los volúmenes (⚠️ borra los datos):

```bash
docker compose down -v
```

## Despliegue en Producción

Para producción, usa el archivo `.env.production`:

```bash
cp .env.production.example .env.production
# Edita las variables con tus credenciales reales
docker compose -f docker-compose.yml --env-file .env.production up -d
```

## Solución de Problemas

### Puerto ocupado

Si el puerto `8000` está ocupado, edita el `docker-compose.yml`:

```yaml
services:
  kong:
    ports:
      - "8001:8000"  # Cambia el puerto host
```

### Contenedores no inician

Revisa los logs:

```bash
docker compose logs -f
```

### Problemas de permisos en volúmenes

En Linux/macOS, asegúrate de que los volúmenes tengan los permisos correctos:

```bash
sudo chown -R $USER:$USER docker/volumes/
```

## Siguientes Pasos

- Configura tu primera [configuración de mapa](../packages/core/README.md) apuntando a tu Supabase local.
- Explora las [migraciones SQL](../../supabase/migrations/) para entender el esquema de datos.
