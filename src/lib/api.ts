import { api } from './axios'
import { AxiosError, type AxiosRequestConfig } from 'axios'
import type { ApiError, ApiResponse } from '@/types/api'
import { logger } from './logger'

// ──────────────────────────────────────────────────────────────
// API Call Utilities
// ──────────────────────────────────────────────────────────────

const unwrap = <T>(axiosResponse: { data: ApiResponse<T> }): T | null => axiosResponse.data.data

export const apiCall = {
  get: async <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>(await api.get(url, config)),

  post: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(await api.post(url, data, config)),

  put: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(await api.put(url, data, config)),

  patch: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(await api.patch(url, data, config)),

  delete: async <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>(await api.delete(url, config)),
}

// ──────────────────────────────────────────────────────────────
// Error Handler
// ──────────────────────────────────────────────────────────────

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiResponse = error.response?.data as ApiResponse<unknown> | undefined
    return apiResponse?.message || error.message || 'Something went wrong'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

/** Lỗi 400 theo field của BE (`Rounds[0].Name`) gom về field cấp một dạng camelCase, giữ thông báo đầu tiên. */
export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (!(error instanceof AxiosError)) return {}
  const errors = (error.response?.data as ApiResponse<unknown> | undefined)?.errors ?? {}
  const result: Record<string, string> = {}
  for (const [key, messages] of Object.entries(errors)) {
    const [head = ''] = key.split(/[.[]/)
    const field = head.charAt(0).toLowerCase() + head.slice(1)
    if (field && messages[0] && !(field in result)) result[field] = messages[0]
  }
  return result
}

/** Thân lỗi BE (`ApiResponse` của phản hồi lỗi), kể cả `data` máy đọc được; null khi không có phản hồi HTTP (mất mạng, huỷ). */
export const getApiError = (error: unknown): ApiError | null => {
  if (!(error instanceof AxiosError) || !error.response) return null
  const body = error.response.data as Partial<ApiResponse<unknown>> | undefined
  return {
    message: body?.message || error.message,
    errors: body?.errors,
    statusCode: error.response.status,
    data: body?.data ?? undefined,
  }
}

export { logger }

/** Lỗi 4xx (yêu cầu sai / bị từ chối): gửi lại y nguyên sẽ cho đúng kết quả đó nên không nên tự thử lại. */
export const isClientError = (error: unknown): boolean =>
  error instanceof AxiosError &&
  error.response !== undefined &&
  error.response.status >= 400 &&
  error.response.status < 500

export const isSystemError = (error: unknown): boolean => {
  return error instanceof AxiosError && (!error.response || error.response.status >= 500)
}

export type ErrorKind = 'forbidden' | 'unauthorized' | 'notFound' | 'network' | 'server' | 'unknown'

/** Phân loại lỗi để hiển thị đúng thông báo/hành động (xem `ErrorState`). */
export const getErrorKind = (error: unknown): { kind: ErrorKind; status?: number } => {
  if (!(error instanceof AxiosError)) return { kind: 'unknown' }
  const status = error.response?.status
  if (!status) return { kind: 'network' }
  if (status === 401) return { kind: 'unauthorized', status }
  if (status === 403) return { kind: 'forbidden', status }
  if (status === 404) return { kind: 'notFound', status }
  if (status >= 500) return { kind: 'server', status }
  return { kind: 'unknown', status }
}
