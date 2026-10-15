import { jwtDecode, type JwtPayload } from 'jwt-decode'
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
