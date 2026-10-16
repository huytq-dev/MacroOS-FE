import { jwtDecode, type JwtPayload } from 'jwt-decode'
import { getErrorMessage, isSystemError } from '@/lib/api'
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
    ? 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
    : getErrorMessage(error)
