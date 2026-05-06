# Deployment Guide

How to deploy a MapaKit application to production using Vercel, Netlify, or your own server.

---

## Prerequisites

- A working MapaKit project locally
- A Supabase account (or your own backend)
- An account on Vercel, Netlify, or access to a server

---

## Option 1: Deploy to Vercel

### 1.1 Prepare the project

Make sure your `package.json` has the build script:

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.2 Set up environment variables

Create a `.env` file in the root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

> **Note:** Vercel only exposes variables starting with `VITE_` to the frontend.

### 1.3 Install Vercel CLI

```bash
npm install -g vercel
```

### 1.4 Deploy

```bash
vercel
```

Follow the prompts. Vercel will auto-detect Vite and build your project.

### 1.5 Set variables in the dashboard

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings > Environment Variables**
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`

### 1.6 Configure domains in Supabase

In your Supabase dashboard:

1. Go to **Authentication > URL Configuration**
2. Add your Vercel domain to **Redirect URLs**
3. Save changes

---

## Option 2: Deploy to Netlify

### 2.1 Prepare the project

Same as with Vercel, make sure you have the `build` script.

### 2.2 Create `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> The redirect is needed for SPAs (Single Page Applications).

### 2.3 Set up environment variables

Create `.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### 2.4 Deploy with CLI

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### 2.5 Set variables in the dashboard

1. Go to the [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site settings > Environment variables**
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`

---

## Option 3: Deploy to your own server (Nginx)

### 3.1 Build the project

```bash
npm run build
```

This will generate the `dist/` folder with static files.

### 3.2 Configure Nginx

```nginx
server {
    listen 80;
    server_name maps.yoursite.com;
    root /var/www/mapakit/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Static cache
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

### 3.3 Copy files to the server

```bash
scp -r dist/* user@server:/var/www/mapakit/dist/
```

### 3.4 Reload Nginx

```bash
ssh user@server "sudo nginx -s reload"
```

---

## Supabase Production Configuration

### RLS Policies (Row Level Security)

Make sure your tables have RLS policies configured:

```sql
-- Allow public read for public maps
CREATE POLICY "Public maps are readable by everyone"
ON map_configurations FOR SELECT
USING (is_public = true);

-- Allow read only to owner for private maps
CREATE POLICY "Private maps only for owner"
ON map_configurations FOR SELECT
USING (auth.uid() = owner_id);
```

### Configure CORS

In Supabase, go to **API > Settings** and configure allowed origins:

```
https://your-app.vercel.app
https://your-app.netlify.app
```

### Migrations in production

Apply migrations to your Supabase production project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

---

## Recommended Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_MAPKIT_API_URL` | Your own API URL (if applicable) | `https://api.yoursite.com` |

---

## Pre-deployment Checklist

- [ ] Project builds without errors (`npm run build`)
- [ ] Environment variables are set in the platform
- [ ] Domains are added in Supabase (Auth + CORS)
- [ ] RLS policies are active and tested
- [ ] Database migrations are applied
- [ ] Map works correctly in preview mode (`npm run preview`)
- [ ] Images and assets load correctly
- [ ] Deep linking / URL state works on the production domain

---

## Troubleshooting

### 404 error when reloading the page

Make sure to configure the redirect to `index.html` for SPAs:

- **Vercel**: Handled automatically
- **Netlify**: Add `[[redirects]]` in `netlify.toml`
- **Nginx**: `try_files $uri $uri/ /index.html;`

### Environment variables not read

- Make sure they start with `VITE_` (Vite) or `REACT_APP_` (CRA)
- Restart the dev server after changing them
- In production, verify they are set in the dashboard

### CORS error in Supabase

Add your domain in **Supabase > API > Settings > Allowed Origins**.

### Assets not loading (broken paths)

In `vite.config.js`, make sure you have:

```javascript
export default {
  base: './', // Or your deployment base path
};
```

---

## Monitoring

Consider adding:

- **Sentry** for production errors
- **Google Analytics** or **Plausible** for usage metrics
- **Uptime monitoring** (UptimeRobot, Pingdom)
