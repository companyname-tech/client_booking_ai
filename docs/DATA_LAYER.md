# Data Layer

How the frontend loads and persists real data against the backend.

## Adapter

The app has a single data source: the HTTP adapter. `src/api/repository.ts`
hard-wires it:

```ts
// src/api/repository.ts
import { httpRepository } from './adapters/http/repository'
export const repo: Repository = httpRepository
```

There is no `VITE_USE_MOCK_DATA` switch and no mock adapter — the mock
`src/api/adapters/mock/` directory was removed. `authService` (`src/api/auth.ts`)
similarly hard-wires `httpAuthService`.

## Files

| Concern | File |
|---------|------|
| HTTP client (fetch, auth header, errors) | `src/api/adapters/http/client.ts` |
| All data methods + wire→domain translation | `src/api/adapters/http/repository.ts` |
| Login/logout/session | `src/api/adapters/http/auth.ts` |

## Base URL

`ApiClient` calls `env.apiBaseUrl` (`src/config/environment.ts`), which defaults
to `/api` (same-origin). `vite.config.ts` reverse-proxies `/api/*` to the backend
on `127.0.0.1:8870`, rewriting `/api` off — required so the HttpOnly
`access_token` cookie is sent same-origin. Set `VITE_API_URL` only for a
different deployment topology.

## Auth token

Login is cookie-based: `POST /auth/login` sets an HttpOnly `access_token` cookie
and every authenticated route reads it. `ApiClient` also attaches
`Authorization: Bearer <token>` when `setAuthToken` is called, which the backend
accepts as a fallback. The FE mirrors `GET /auth/me` into the session.

## Error handling

`ApiClient` throws `ApiError` with `status` and `body` on any non-2xx. Screens
catch it (often via `useAsyncData`) and render `ErrorState` with a retry. On
`401`, clear the session.

```ts
import { ApiError } from '@/api/adapters/http/client'

try {
  await apiClient.get('/leads')
} catch (e) {
  if (e instanceof ApiError && e.status === 401) authService.clearSession()
}
```

## Translation (wire → domain)

`repository.ts` is the single translation point:

- snake_case → camelCase (`offer_id` → `offerCampaignId`)
- BE enums → FE enums (`LeadStatus`, `PostCallOutcome` → `Call.outcome`)
- wrapped lists → bare arrays (`{leads:[...]}` → `[...]`)

If an API response differs from a `src/types/` shape, transform it in the
adapter — never scatter mapping in UI code.

## Async state

Data methods are async. Screens use `useAsyncData` (`src/hooks/useAsyncData.ts`)
for loading/error/reload, and render `LoadingState` / `ErrorState` (retry) /
`EmptyState` from `src/components/ui/`. Optimistic mutations read
`override ?? data` to avoid a reload flash (see the settings tabs).
