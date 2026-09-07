import { env } from '@/config/environment'

export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/** Pull the BE's `detail` out of a JSON error body so it shows in the UI. */
function describeError(payload: unknown, fallback: string): string {
  if (typeof payload === 'object' && payload !== null) {
    const detail = (payload as { detail?: unknown }).detail
    if (typeof detail === 'string' && detail) return detail
    if (typeof detail === 'object' && detail !== null) return JSON.stringify(detail)
  }
  return fallback
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

class ApiClient {
  private token: string | null = null

  setAuthToken(token: string | null) {
    this.token = token
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options
    const res = await fetch(`${env.apiBaseUrl}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      // Read the body ONCE as text, then try to parse JSON — calling res.json()
      // followed by res.text() on the same stream throws
      // "Failed to execute 'text' on 'Response': body stream already read".
      let payload: unknown
      const raw = await res.text()
      try {
        payload = raw ? JSON.parse(raw) : ''
      } catch {
        payload = raw
      }
      throw new ApiError(`API ${res.status}: ${describeError(payload, res.statusText)}`, res.status, payload)
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' })
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body })
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body })
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body })
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' })
  }

  /** Multipart POST (FormData) — no Content-Type so the browser sets the boundary. */
  async upload<T>(path: string, form: FormData): Promise<T> {
    const res = await fetch(`${env.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: form,
    })
    if (!res.ok) {
      // Same single-read rule as request() — no res.json() then res.text() on one stream.
      let payload: unknown
      const raw = await res.text()
      try {
        payload = raw ? JSON.parse(raw) : ''
      } catch {
        payload = raw
      }
      throw new ApiError(`API ${res.status}: ${describeError(payload, res.statusText)}`, res.status, payload)
    }
    return res.json() as Promise<T>
  }

  /** GET a file (e.g. CSV) with auth and trigger a browser download. */
  async download(path: string, filename: string): Promise<void> {
    const res = await fetch(`${env.apiBaseUrl}${path}`, {
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    })
    if (!res.ok) {
      throw new ApiError(`API ${res.status}: ${res.statusText}`, res.status, await res.text().catch(() => ''))
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

export const apiClient = new ApiClient()
