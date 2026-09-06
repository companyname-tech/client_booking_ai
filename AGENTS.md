# AI Booking Agent — Cursor Agent Guide

Read this first when working on this codebase or integrating it into another app.

## What this project is

A **React 19 + Vite + TypeScript** frontend for an AI-native booking/campaign platform. It has two zones:

- **Client Zone** (`/client/*`) — campaign management, leads, AI command center
- **Super Admin** (`/admin/*`) — approvals, compliance, client management

Currently runs on **mock data** by default. Backend integration happens at the **API adapter layer**.

## Architecture (3 layers)

```
UI (pages/, components/)  →  repo  →  mock | http adapter
Auth (contexts/)          →  authService  →  mock | http adapter
Bootstrap (app/)          →  router, providers
```

## Critical rules

1. **UI must use `repo` from `@/api/repository`** — never import `api/adapters/mock/*` in pages or components.
2. **Types in `src/types/`** are the backend contract. Align API responses to these shapes.
3. **Design tokens** live in `src/styles/globals.css` — do not duplicate color/spacing values.
4. **Routes** are defined in `src/app/router.tsx` and `src/app/routes/*` — merge into host app router, don't duplicate.
5. **Auth zones** (`client` | `admin`) are enforced by `RequireAuth` in `src/components/auth/`.
6. **Switch data source** via `VITE_USE_MOCK_DATA=true|false` in `.env`.

## Key files

| File | Purpose |
|------|---------|
| `src/api/repository.ts` | Data facade — swap mock/http here |
| `src/api/auth.ts` | Auth facade |
| `src/api/adapters/http/repository.ts` | **Wire your backend here** |
| `src/api/adapters/http/auth.ts` | Wire login/logout here |
| `src/app/router.tsx` | Full route tree |
| `src/config/environment.ts` | Env vars and storage keys |
| `src/types/` | Domain types shared with backend |

## Integration checklist

When merging into an existing Vite app:

1. Copy folders: `app/`, `api/`, `components/`, `pages/`, `types/`, `lib/`, `hooks/`, `contexts/`, `config/`, `styles/`, `features/`
2. Merge `globals.css` `@theme` into host styles
3. Set `@/` path alias in `vite.config.ts` and `tsconfig`
4. Install deps: `motion`, `lucide-react`, `clsx`, `react-router-dom`, Tailwind v4
5. Mount routes from `src/app/routes/` in your router
6. Set `VITE_USE_MOCK_DATA=false` and implement `api/adapters/http/*`
7. Replace `authService` HTTP adapter with your JWT/session logic

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Integration guide](docs/INTEGRATION.md)
- [API contract](docs/API_CONTRACT.md)
- [Data layer](docs/DATA_LAYER.md)
- [Folder structure](docs/FOLDER_STRUCTURE.md)
- [Feature map](src/features/README.md)

## Demo login (mock mode)

| Role | Email | Password |
|------|-------|----------|
| Client | sarah@acmegrowth.com | client |
| Super Admin | daniel@aibookingagent.com | admin |

Use quick-login buttons on `/login` or implement real auth in HTTP mode.
