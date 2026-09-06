# AI Booking Agent — Frontend

Premium, AI-native command center for autonomous outbound booking campaigns.

**Integrating into your existing app?** Start with [AGENTS.md](AGENTS.md) and [docs/INTEGRATION.md](docs/INTEGRATION.md).

## Stack

- **Vite 8 + React 19 + TypeScript** (strict)
- **Tailwind CSS v4** — design tokens in `src/styles/globals.css`
- **motion** (`motion/react`) — animation primitives in `src/lib/motion.ts`
- **react-router-dom v7** — Client Zone + Super Admin zones
- **lucide-react** icons

## Getting started

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

Login at `/` with quick-access buttons or demo credentials (see [AGENTS.md](AGENTS.md)).

## Architecture

```
UI (pages, components)  →  repo  →  mock | http adapter
```

- **Mock mode** (default): `VITE_USE_MOCK_DATA=true`
- **Backend mode**: set `VITE_USE_MOCK_DATA=false`, implement `src/api/adapters/http/*`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Key folders

| Folder | Purpose |
|--------|---------|
| `src/app/` | Router, providers, route modules |
| `src/api/` | Data/auth facade + adapters (**wire backend here**) |
| `src/components/` | UI components |
| `src/pages/` | Route screens |
| `src/types/` | Domain types (backend contract) |
| `src/styles/` | Design tokens |

Full tree: [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md)

## Documentation

| Doc | Description |
|-----|-------------|
| [AGENTS.md](AGENTS.md) | Cursor AI guide — read first |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | Merge into existing Vite app |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | REST endpoint mapping |
| [docs/DATA_LAYER.md](docs/DATA_LAYER.md) | Mock → HTTP migration |
| [src/features/README.md](src/features/README.md) | Feature map |

## Keyboard

- `⌘K` / `Ctrl K` — command menu
- `⌘B` / `[` — collapse or expand sidebar
- `Esc` — close overlays
