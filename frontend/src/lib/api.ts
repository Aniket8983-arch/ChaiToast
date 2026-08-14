import axios from 'axios'

const api = axios.create({
  // In dev, Vite proxies /api to :8000 — so we don't hardcode the port
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Request interceptor — log in debug
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

// Response interceptor — surface errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Request failed'
    console.error('[API Error]', msg)
    return Promise.reject(new Error(msg))
  }
)

export default api
