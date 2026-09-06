# Data Layer

How to swap mock data for your backend.

## Adapter selection

```ts
// src/api/repository.ts
export const repo = env.useMockData ? mockRepository : httpRepository
```

Set `VITE_USE_MOCK_DATA=false` in `.env` to activate the HTTP adapter.

## Where to implement

| Concern | File |
|---------|------|
| HTTP client (fetch, auth headers) | `src/api/adapters/http/client.ts` |
| All data methods | `src/api/adapters/http/repository.ts` |
| Login/logout | `src/api/adapters/http/auth.ts` |

## Implementation pattern

### 1. Simple GET

```ts
// In http/repository.ts — replace todo() stub:
async getCampaigns(clientId?: string): Promise<Campaign[]> {
  const qs = clientId ? `?clientId=${clientId}` : ''
  return apiClient.get<Campaign[]>(`/campaigns${qs}`)
}
```

**Note:** Current `Repository` methods are synchronous (mock). For async APIs you have two options:

**Option A (recommended):** Add React Query / TanStack Query in pages, call `apiClient` directly in hooks, gradually migrate off `repo`.

**Option B:** Make repository methods async and update all callers to `await repo.getCampaigns()`.

For minimal disruption, start with Option A for new endpoints while keeping sync mock for development.

### 2. POST / mutation

```ts
approveCampaign(id: string) {
  return apiClient.post(`/admin/campaigns/${id}/approve`)
}
```

### 3. Auth token

After login:

```ts
import { apiClient } from './client'
apiClient.setAuthToken(response.token)
```

`apiClient` attaches `Authorization: Bearer <token>` to all requests.

## Error handling

`apiClient` throws `ApiError` with `status` and `body`. Catch in UI or a global error boundary:

```ts
import { ApiError } from '@/api/adapters/http/client'

try {
  await apiClient.get('/campaigns')
} catch (e) {
  if (e instanceof ApiError && e.status === 401) {
    authService.clearSession()
  }
}
```

## Types as contract

Response JSON must match types in `src/types/`. If your API differs:

1. Prefer transforming in the HTTP adapter (map API → domain type)
2. Or extend types with optional fields

## Incremental migration

1. Keep `VITE_USE_MOCK_DATA=true` during UI work
2. Implement HTTP methods one domain at a time (campaigns → leads → AI → admin)
3. Use feature flags per method if needed:

```ts
getCampaigns() {
  if (env.useMockData) return mockRepository.getCampaigns()
  return apiClient.get('/campaigns')
}
```

## Optional: React Query

For production apps, wrap HTTP calls in query hooks:

```ts
// src/hooks/useCampaigns.ts
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiClient.get<Campaign[]>('/campaigns'),
  })
}
```

Migrate pages from `repo.getCampaigns()` to hooks over time.

## Mock adapter (reference)

Full working implementation: `src/api/adapters/mock/repository.ts`

Use it as the specification for what each method must return.
