# AI Booking Agent — Frontend

Premium, AI-native command center for autonomous outbound booking campaigns.

Frontend for the **leads_to_conversion** backend (FastAPI + MongoDB, port 8870).
The UI is fully wired to the real API — there is no mock-data mode.

**Working on this codebase?** Start with [AGENTS.md](AGENTS.md) and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

- **Vite 8 + React 19 + TypeScript** (strict)
- **Tailwind CSS v4** — design tokens in `src/styles/globals.css`
- **motion** (`motion/react`) — animation primitives in `src/lib/motion.ts`
- **react-router-dom v7** — Client Zone + Super Admin zones
- **lucide-react** icons

## Backend

The app talks to the **leads_to_conversion** backend over a same-origin `/api`
reverse proxy (see `vite.config.ts`):

- Dev: `npm run dev` proxies `/api/*` → `http://127.0.0.1:8870/*`.
- Prod: serve the built `dist/` behind a reverse proxy that routes `/api/*` to
  the backend (port 8870). Same-origin proxying is required for cookie auth.

Auth is a single-admin **JWT session**: `POST /auth/login` sets an HttpOnly
`access_token` cookie. Default credentials are `admin` / `admin` (override with
`ADMIN_USERNAME` / `ADMIN_PASSWORD` in the backend `.env`).

## Getting started

```bash
npm install
cp .env.example .env   # optional — defaults are correct for local dev
npm run dev            # http://localhost:5173
npm run build          # type-check (tsc -p tsconfig.app.json --noEmit) + build
```

Log in at `/` with `admin` / `admin` (or the backend-configured credentials).

## Architecture

```
UI (pages, components) → repo (src/api/repository.ts) → http adapter → /api proxy → backend
```

There is a single HTTP adapter (`src/api/adapters/http/`). The `repo` and
`authService` facades hard-wire it — no data-source switch and no mock adapter
remain. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full data flow.

A number of screens target backend endpoints that do not exist yet (admin
approval/training, AI objections/insights/performance, lead notes/tags,
multi-client workspaces, OAuth integrations). Those screens render the
empty/error state until their product endpoints are built — they are deferred
features, not mock data. See [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

## Key folders

| Folder | Purpose |
|--------|---------|
| `src/app/` | Router, providers, route modules |
| `src/api/` | Data/auth facade + HTTP adapter (backend contract translation) |
| `src/components/` | UI components |
| `src/pages/` | Route screens |
| `src/types/` | Domain types (backend contract) |
| `src/styles/` | Design tokens |

Full tree: [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md)

## Documentation

| Doc | Description |
|-----|-------------|
| [AGENTS.md](AGENTS.md) | Cursor AI guide — read first |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow + auth |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | FE method → backend endpoint map |
| [docs/DATA_LAYER.md](docs/DATA_LAYER.md) | HTTP adapter reference |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | Merge into an existing Vite app |
| [src/features/README.md](src/features/README.md) | Feature map |

## Keyboard

- `⌘K` / `Ctrl K` — command menu
- `⌘B` / `[` — collapse or expand sidebar
- `Esc` — close overlays
