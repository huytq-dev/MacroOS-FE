'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/api'
import { DEFAULT_SHORTCUTS } from '../shortcuts.config'
import { shortcutsService } from '../services/shortcuts.service'
import type { ShortcutConfig, ShortcutItem, ToolbarStyle } from '../types/shortcuts.types'

export const shortcutKeys = { config: ['shortcuts'] as const }

/**
 * Cấu hình shortcut của user (đồng bộ nhiều thiết bị). Chưa tải xong hoặc lỗi thì dùng mặc định cục bộ trùng BE nên thanh "+" và
 * toolbar không nháy.
 */
export function useShortcuts(): { config: ShortcutConfig; isLoading: boolean } {
  const query = useQuery({
    queryKey: shortcutKeys.config,
    queryFn: async () => (await shortcutsService.get()) ?? DEFAULT_SHORTCUTS,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
  return { config: query.data ?? DEFAULT_SHORTCUTS, isLoading: query.isLoading }
}

/** Lưu cấu hình: ghi thẳng vào cache ngay (lạc quan), lỗi thì trả lại cấu hình cũ. */
export const useSaveShortcuts = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { toolbarStyle: ToolbarStyle; items: ShortcutItem[] }) =>
      shortcutsService.save(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: shortcutKeys.config })
      const previous = queryClient.getQueryData<ShortcutConfig>(shortcutKeys.config)
      queryClient.setQueryData<ShortcutConfig>(shortcutKeys.config, {
        ...payload,
        isDefault: false,
      })
      return { previous }
    },
    onSuccess: (saved) => {
      if (saved) queryClient.setQueryData(shortcutKeys.config, saved)
    },
    onError: (error, _payload, context) => {
      logger.error(error)
      toast.error("Couldn't save shortcuts")
      if (context?.previous) queryClient.setQueryData(shortcutKeys.config, context.previous)
    },
  })
}

export const useResetShortcuts = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => shortcutsService.reset(),
    onSuccess: (config) => {
      queryClient.setQueryData(shortcutKeys.config, config ?? DEFAULT_SHORTCUTS)
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't reset shortcuts")
    },
  })
}
