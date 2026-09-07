# Folder Structure

```
ai_booking_agent/
├── AGENTS.md                 # Cursor AI entry point — read first
├── .env.example              # Environment variables template
├── docs/
│   ├── ARCHITECTURE.md       # System design and data flow
│   ├── API_CONTRACT.md       # FE method → backend endpoint map
│   ├── DATA_LAYER.md         # HTTP data layer reference
│   ├── INTEGRATION.md        # Merge into existing Vite app
│   └── FOLDER_STRUCTURE.md   # This file
├── .cursor/rules/
│   └── integration.mdc       # Cursor rules for integration work
├── public/
│   └── brand/                # Logo assets
└── src/
    ├── main.tsx              # React entry
    ├── App.tsx               # Thin app root
    │
    ├── app/                  # Application bootstrap
    │   ├── providers.tsx     # AuthProvider, MotionConfig, Suspense
    │   ├── router.tsx        # createBrowserRouter definition
    │   └── routes/
    │       ├── client.routes.tsx
    │       ├── admin.routes.tsx
    │       └── index.ts
    │
    ├── api/                  # Data & auth boundary (integration seam)
    │   ├── repository.ts     # Facade — hard-wires the HTTP adapter
    │   ├── auth.ts           # Facade — hard-wires httpAuthService
    │   ├── index.ts          # Public exports
    │   ├── contracts/
    │   │   ├── repository.ts # Repository type
    │   │   ├── auth.ts       # AuthService interface
    │   │   └── index.ts
    │   └── adapters/
    │       └── http/         # Backend integration (single adapter)
    │           ├── client.ts # fetch wrapper + ApiError
    │           ├── repository.ts # wire→domain translation + all data methods
    │           └── auth.ts   # JWT cookie login/logout/session
    │
    ├── config/
    │   └── environment.ts    # VITE_* vars, storage keys
    │
    ├── data/                 # Deprecated shims — use @/api/*
    │   ├── repository.ts
    │   └── time.ts
    │
    ├── types/                # Domain types (backend contract)
    ├── lib/                  # Utils, motion, navigation, status
    ├── hooks/                # Reusable React hooks (useAsyncData)
    ├── contexts/             # AuthContext
    ├── features/             # Logical feature index (README only)
    │
    ├── components/
    │   ├── ui/               # Design system primitives (LoadingState, ErrorState, EmptyState)
    │   ├── shell/            # AppShell, Sidebar, TopBar
    │   ├── layout/           # PageHeader, PageContainer
    │   ├── motion/           # Reveal, AnimatedNumber
    │   ├── auth/             # RequireAuth
    │   ├── campaigns/        # Campaign UI
    │   ├── leads/            # Lead intelligence UI
    │   ├── ai/               # AI command center UI
    │   ├── admin/            # Admin UI
    │   ├── onboarding/       # Campaign wizard
    │   ├── analytics/        # Charts and metrics
    │   └── ...               # calls, recordings, etc.
    │
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── PlaceholderPage.tsx
    │   ├── client/           # Client zone screens
    │   │   ├── ai/           # AI command center pages
    │   │   └── leads/        # Lead intelligence pages
    │   └── admin/            # Super admin screens
    │
    └── styles/
        └── globals.css       # Design tokens (@theme), utilities
```

## Import conventions

| Import from | Use for |
|-------------|---------|
| `@/api/repository` | All data access (`repo`) |
| `@/api/auth` | Auth service |
| `@/types/*` | Domain types |
| `@/components/ui/*` | Design system |
| `@/lib/*` | Utilities, navigation |
| `@/config/environment` | Env and storage keys |

## Do not import

- `@/api/adapters/http/*` from UI code (go through the `repo` / `authService` facades)
- `@/data/*` in new code (use `@/api/*` instead)
