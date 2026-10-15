import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { logger } from './logger'
import { routePath } from '@/config/route-path'

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

// ponytail: 401 → về login. BE giữ refresh token trong HttpOnly cookie nhưng endpoint refresh lại đòi token trong body,
// FE không đọc được → chưa làm silent refresh; sửa BE contract rồi thêm sau.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (axios.isCancel(error)) return Promise.reject(error)

    if (error.response?.status === 401) {
      redirectToLogin()
      return Promise.reject(error)
    }

    const method = error.config?.method?.toLowerCase() ?? ''
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
