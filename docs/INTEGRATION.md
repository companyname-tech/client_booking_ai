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

Create `.env`:

```env
VITE_USE_MOCK_DATA=true   # false when backend is ready
VITE_API_URL=http://localhost:3000/api
```

## Step 7: Wire authentication

1. Open `src/api/adapters/http/auth.ts`
2. Implement `loginWithCredentials` calling your `POST /auth/login`
3. Store JWT via `apiClient.setAuthToken(token)` from `src/api/adapters/http/client.ts`
4. Map your user roles to `zone: 'client' | 'admin'`

Replace `RequireAuth` session checks if your app uses a different auth context — keep zone enforcement logic.

## Step 8: Wire API endpoints

1. Set `VITE_USE_MOCK_DATA=false`
2. Open `src/api/adapters/http/repository.ts`
3. Replace `todo()` stubs method-by-method with `apiClient.get/post/patch/delete` calls
4. See [API_CONTRACT.md](API_CONTRACT.md) for suggested endpoints
5. See [DATA_LAYER.md](DATA_LAYER.md) for implementation patterns

Start with: `getCurrentUser`, `getCampaigns`, `getLeads` — then expand by feature.

## Step 9: Verify

```bash
npm run build
npm run dev
```

Test:
- `/login` — quick login buttons
- `/client/overview` — client zone
- `/admin/overview` — admin zone
- Campaign detail, leads, AI pages

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Missing styles | Ensure `globals.css` imported; check `@theme` tokens |
| `@/` import errors | Verify vite + tsconfig alias |
| Blank page after login | Check `RequireAuth` zone matches session |
| API errors in HTTP mode | Expected until stubs are implemented |
