import { jwtDecode, type JwtPayload } from 'jwt-decode'
import type { FieldValues, Path, UseFormSetError, UseFormSetFocus } from 'react-hook-form'
import { getErrorMessage, getFieldErrors, isSystemError } from '@/lib/api'
import { logger } from '@/lib/logger'
import type { User } from './types/auth.types'

interface MacroJwtPayload extends JwtPayload {
  email?: string
  name?: string
  role?: string
  avatar?: string
}

export const decodeUserFromToken = (token: string): User | null => {
  try {
    const decoded = jwtDecode<MacroJwtPayload>(token)
    return {
      id: decoded.sub ?? '',
      email: decoded.email ?? '',
      name: decoded.name || decoded.email || '',
      role: decoded.role ?? '',
      avatar: decoded.avatar || undefined,
    }
  } catch (error) {
    logger.error('Lỗi giải mã JWT token:', error)
    return null
  }
}

export const isTokenValid = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<JwtPayload>(token)
    return !!exp && exp > Date.now() / 1000
  } catch {
    return false
  }
}

/** Lỗi hiện trong form (UI.md mục 13): lỗi mạng/máy chủ nói chung, lỗi nghiệp vụ lấy nguyên văn từ BE. */
export const getFormErrorMessage = (error: unknown): string =>
  isSystemError(error)
    ? "Can't reach the server. Check your connection and try again."
    : getErrorMessage(error)

/**
 * Lỗi 400 theo ô của BE hiện ngay tại ô (UI.md mục 17) và focus ô đầu tiên.
 * Trả true nếu có ít nhất một ô nhận lỗi; khi đó không cần khung Alert chung.
 */
export const applyServerFieldErrors = <T extends FieldValues>(
  error: unknown,
  form: { setError: UseFormSetError<T>; setFocus: UseFormSetFocus<T> },
  fields: readonly Path<T>[]
): boolean => {
  const serverErrors = getFieldErrors(error)
  const matched = fields.filter((field) => serverErrors[field])
  matched.forEach((field) => form.setError(field, { type: 'server', message: serverErrors[field] }))
  if (matched[0]) form.setFocus(matched[0])
  return matched.length > 0
}
