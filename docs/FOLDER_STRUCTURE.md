# Folder Structure

```
ai_booking_agent/
├── AGENTS.md                 # Cursor AI entry point — read first
├── .env.example              # Environment variables template
├── docs/
│   ├── ARCHITECTURE.md       # System design and data flow
│   ├── INTEGRATION.md        # Merge into existing Vite app
│   ├── API_CONTRACT.md       # REST endpoint mapping
│   ├── DATA_LAYER.md         # Mock → HTTP migration guide
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
    │   ├── repository.ts     # Facade: repo = mock | http
    │   ├── auth.ts           # Facade: authService = mock | http
    │   ├── index.ts          # Public exports
    │   ├── contracts/
    │   │   ├── repository.ts # Repository type
    │   │   ├── auth.ts       # AuthService interface
    │   │   └── index.ts
    │   └── adapters/
    │       ├── mock/         # Mock data (dev/demo)
    │       │   ├── repository.ts
    │       │   ├── auth.ts
    │       │   ├── mockClients.ts
    │       │   ├── campaignStore.ts
    │       │   └── ...       # seeds, stores, generators
    │       └── http/         # Backend integration (wire here)
    │           ├── client.ts # fetch wrapper + ApiError
    │           ├── repository.ts
    │           └── auth.ts
    │
    ├── config/
    │   ├── environment.ts    # VITE_* vars, storage keys
    │   └── demo-users.ts     # Demo login credentials
    │
    ├── data/                 # Deprecated shims — use @/api/*
    │   ├── repository.ts
    │   └── time.ts
    │
    ├── types/                # Domain types (backend contract)
    ├── lib/                  # Utils, motion, navigation, status
    ├── hooks/                # Reusable React hooks
    ├── contexts/             # AuthContext
    ├── features/             # Logical feature index (README only)
    │
    ├── components/
    │   ├── ui/               # Design system primitives
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

- `@/api/adapters/mock/*` from UI code
- `@/data/*` in new code (use `@/api/*` instead)
