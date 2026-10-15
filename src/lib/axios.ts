import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { logger } from './logger'
import { routePath } from '@/config/route-path'
import { apiRoutes } from '@/config/api-routes'

const API_BASE_URL = '/api' // next.config.ts rewrite → BE
const DEFAULT_TIMEOUT_MS = 30_000

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

export const getAccessToken = (): string | null =>
  typeof window === 'undefined' ? null : localStorage.getItem('access_token')

export const setAccessToken = (token: string): void => {
  localStorage.setItem('access_token', token)
  document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`
}

export const clearAccessToken = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('auth-storage')
  document.cookie = 'access_token=; path=/; max-age=0'
}

const redirectToLogin = (): void => {
  clearAccessToken()
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith(routePath.login)) {
    window.location.href = `${routePath.login}?redirect=${encodeURIComponent(window.location.pathname)}`
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Silent refresh: 401 → gọi refresh-token một lần (refresh token nằm trong HttpOnly cookie), các request 401 khác chờ chung
let refreshPromise: Promise<string> | null = null

const refreshAccessToken = (): Promise<string> => {
  refreshPromise ??= axios
    .post<{ data: { accessToken: string } }>(
      `${API_BASE_URL}${apiRoutes.auth.refresh}`,
      { expiredAccessToken: getAccessToken() ?? '', refreshToken: null },
      { withCredentials: true }
    )
    .then((response) => {
      const token = response.data.data.accessToken
      setAccessToken(token)
      return token
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (axios.isCancel(error)) return Promise.reject(error)

    const config = error.config as RetriableConfig | undefined
    const isAuthEndpoint = config?.url?.startsWith('/auth/') ?? false

    if (error.response?.status === 401 && config && !config._retried && !isAuthEndpoint && getAccessToken()) {
      config._retried = true
      try {
        const token = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${token}`
        return api(config)
      } catch (refreshError) {
        logger.error('Silent refresh failed:', refreshError)
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    if (error.response?.status === 401) {
      if (!isAuthEndpoint) redirectToLogin()
      return Promise.reject(error)
    }

    const method = config?.method?.toLowerCase() ?? ''
    const isLoadRequest = ['get', 'head'].includes(method)

    if (!error.response) {
      logger.error('Network error:', error.message)
      if (!isLoadRequest)
        toast.error('Mất kết nối mạng', { id: 'network-error', description: 'Kiểm tra Internet rồi thử lại.' })
    } else if (error.response.status >= 500) {
      logger.error('Server error:', error.message)
      if (!isLoadRequest)
        toast.error('Hệ thống tạm thời không phản hồi', { id: 'server-error', description: 'Vui lòng thử lại sau.' })
    }

    return Promise.reject(error)
  }
)
