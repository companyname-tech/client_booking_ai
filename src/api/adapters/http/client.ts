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
      let payload: unknown
      try {
        payload = await res.json()
      } catch {
        payload = await res.text()
      }
      throw new ApiError(`API ${res.status}: ${res.statusText}`, res.status, payload)
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
      let payload: unknown
      try {
        payload = await res.json()
      } catch {
        payload = await res.text()
      }
      throw new ApiError(`API ${res.status}: ${res.statusText}`, res.status, payload)
    }
    return res.json() as Promise<T>
  }
}

export const apiClient = new ApiClient()
