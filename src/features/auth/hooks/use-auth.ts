'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { authService, type LoginRequest } from '@/features/auth/services/auth.service'
import { decodeUserFromToken, isTokenValid } from '@/features/auth/auth.utils'
import { getAccessToken } from '@/lib/axios'
import { logger } from '@/lib/logger'
import { queryClient } from '@/lib/query-client'
import { clearAllDrafts } from '@/features/onboarding/onboarding-draft'
import { routePath } from '@/config/route-path'

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, clearAuth } = useAuthStore()
  const router = useRouter()

  // Khôi phục user từ token còn hạn (store persist có thể bị xoá nhưng token vẫn còn)
  useEffect(() => {
    const token = getAccessToken()
    if (token && isTokenValid(token) && (!isAuthenticated || !user)) {
      const decoded = decodeUserFromToken(token)
      if (decoded) setUser(decoded, token)
    }
  }, [isAuthenticated, user, setUser])

  // Không bật cờ loading toàn cục ở đây: `isLoading` của store chỉ là "đang khôi phục phiên" (UI.md mục 23).
  // Trạng thái chờ của form do chính form giữ (isSubmitting) để không gỡ form và mất dữ liệu đã nhập.
  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await authService.login(credentials)
      if (!response?.accessToken) throw new Error('No access token received from the server.')

      const decoded = decodeUserFromToken(response.accessToken)
      if (!decoded) throw new Error('Invalid token.')

      // Cache khoá theo ngày / chất chứ không theo tài khoản: phiên mới không được thấy dữ liệu của tài khoản trước
      queryClient.clear()
      setUser(decoded, response.accessToken)
      toast.success(`Welcome back, ${decoded.name}!`)
      return response
    },
    [setUser]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      logger.error('Logout API error:', error)
    } finally {
      clearAuth()
      queryClient.clear()
      // Bản nháp wizard thiết lập (sessionStorage) không được sống sót sau đăng xuất
      clearAllDrafts()
      toast.info('Signed out')
      router.push(routePath.login)
    }
  }, [clearAuth, router])

  return { user, isAuthenticated, isLoading, login, logout }
}
