# Docker & Supabase

This guide explains how to spin up a complete local Supabase environment using Docker.

---

## What's included in the environment?

The `docker/docker-compose.yml` file spins up the following services:

| Service | Description | Port |
|---------|-------------|------|
| **PostgreSQL** | Main database | `5432` |
| **PostgREST** | Automatic REST API over PostgreSQL | `3000` |
| **Supabase Auth (GoTrue)** | Authentication and authorization | `9999` |
| **Kong** | API Gateway | `8000` |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Initial Setup

1. **Copy the environment file:**

```bash
cd docker
cp .env.local.example .env.local
```

2. **Review the variables** in `.env.local`:

```bash
# Example of important variables
POSTGRES_PASSWORD=your-super-secret-password
JWT_SECRET=your-jwt-secret
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key
```

> For local development, you can leave the default values. **Never commit `.env.local` to git.**

## Start the Environment

```bash
cd docker
docker compose up -d
```

Verify that the containers are running:

```bash
docker compose ps
```

## Access the Services

- **Kong Gateway**: http://localhost:8000
- **PostgREST API**: http://localhost:3000
- **Supabase Auth**: http://localhost:9999

## Initialize the Database

Supabase migrations are located in `supabase/migrations/`. You can apply them manually with `psql` or using the Supabase console.

```bash
# Example: apply migrations directly to PostgreSQL
docker compose exec postgres psql -U postgres -d postgres -f /migrations/001_initial_schema.sql
```

> Make sure the migrations volume is mounted in your `docker-compose.yml` if not already configured.

## Frontend Environment Variables

For your frontend application to connect to the local Supabase instance, use:

```javascript
const supabaseUrl = 'http://localhost:8000';
const supabaseKey = 'your-anon-key'; // From .env.local
```

## Stop the Environment

```bash
cd docker
docker compose down
```

To also remove volumes (⚠️ deletes data):

```bash
docker compose down -v
```

## Production Deployment

For production, use the `.env.production` file:

```bash
cp .env.production.example .env.production
# Edit the variables with your real credentials
docker compose -f docker-compose.yml --env-file .env.production up -d
```

## Troubleshooting

### Port already in use

If port `8000` is already taken, edit `docker-compose.yml`:

```yaml
services:
  kong:
    ports:
      - "8001:8000"  # Change the host port
```

### Containers won't start

Check the logs:

```bash
docker compose logs -f
```

### Volume permission issues

On Linux/macOS, make sure volumes have the correct permissions:

```bash
sudo chown -R $USER:$USER docker/volumes/
```

## Next Steps

- Set up your first [map configuration](../packages/core/README.md) pointing to your local Supabase.
- Explore the [SQL migrations](../../supabase/migrations/) to understand the data schema.
