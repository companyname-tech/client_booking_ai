# Integration Guide

Step-by-step instructions for merging this UI into your existing **React + Vite** application.

## Prerequisites

Your host app should use:
- React 18+
- Vite
- TypeScript (recommended)
- react-router-dom v7

## Step 1: Install dependencies

```bash
npm install react-router-dom motion lucide-react clsx
npm install -D tailwindcss @tailwindcss/vite
```

Match versions from this project's `package.json` if possible.

## Step 2: Copy source folders

Copy these into your `src/`:

```
src/app/
src/api/
src/components/
src/pages/
src/types/
src/lib/
src/hooks/
src/contexts/
src/config/
src/styles/
src/features/        # logical index only
src/data/            # backward-compat shims
```

Also copy:
- `public/brand/` (logo assets)
- `.env.example`

## Step 3: Path alias

**vite.config.ts:**
```ts
resolve: {
  alias: { '@': path.resolve(__dirname, './src') },
},
```

**tsconfig.app.json:**
```json
"paths": { "@/*": ["./src/*"] }
```

## Step 4: Tailwind / styles

1. Add Tailwind v4 plugin to `vite.config.ts`:
   ```ts
   import tailwindcss from '@tailwindcss/vite'
   plugins: [react(), tailwindcss()],
   ```

2. Import styles in your entry (`main.tsx`):
   ```ts
   import '@/styles/globals.css'
   ```

3. Merge the `@theme` block from `globals.css` if your host app already has Tailwind — avoid duplicate `@import "tailwindcss"`.

4. Add fonts to `index.html` (Inter, JetBrains Mono) and `class="dark"` on `<html>`.

## Step 5: Bootstrap

**Option A — Replace your app root:**

```tsx
// main.tsx
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
)
```

Use `src/App.tsx` from this project (thin wrapper around `AppProviders` + `RouterProvider`).

**Option B — Merge routes into your router:**

```tsx
import { clientRoutes, adminRoutes } from '@/app/routes'
import { AppShell } from '@/components/shell/AppShell'
import { RequireAuth } from '@/components/auth/RequireAuth'

// Inside your createBrowserRouter:
{
  path: '/client',
  element: <RequireAuth zone="client"><AppShell zone="client" /></RequireAuth>,
  children: clientRoutes,
},
{
  path: '/admin',
  element: <RequireAuth zone="admin"><AppShell zone="admin" /></RequireAuth>,
  children: adminRoutes,
},
```

Add `AuthProvider` from `@/contexts/AuthContext` at your app root.

## Step 6: Environment

Create `.env` (optional — defaults are correct):

```env
# Leave empty for same-origin `/api` (proxied to the backend on :8870).
VITE_API_URL=
```

The app reads `env.apiBaseUrl` (default `/api`). See `vite.config.ts` for the
dev reverse proxy; in production, route `/api/*` to the backend with your own
reverse proxy.

## Step 7: Auth

Auth is already wired to the leads_to_conversion backend:

- `POST /auth/login {username,password}` → HttpOnly `access_token` cookie.
- `GET /auth/me` → `{user:{username}}` (mirrored into the FE session).
- Default credentials `admin` / `admin`.

If your host app uses a different auth backend, replace
`src/api/adapters/http/auth.ts` and the `RequireAuth` session checks — keep the
zone-enforcement logic.

## Step 8: Verify

```bash
npm run build
npm run dev
```

Test:
- `/login` — `admin` / `admin`
- `/client/overview` — client zone
- `/admin/overview` — admin zone
- Campaign detail, leads, AI pages

Note: screens that target not-yet-built backend endpoints (admin approval/training,
AI objections/insights/performance, lead notes/tags, multi-client, OAuth) render
the empty/error state — see [API_CONTRACT.md](API_CONTRACT.md).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Missing styles | Ensure `globals.css` imported; check `@theme` tokens |
| `@/` import errors | Verify vite + tsconfig alias |
| Blank page after login | Check `RequireAuth` zone matches session |
| `401` on every call | Ensure `/api` is reverse-proxied to the backend (cookie auth needs same-origin) |
| A screen shows empty/error | The endpoint may be a deferred gap — see API_CONTRACT.md |
