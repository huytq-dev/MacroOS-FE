import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { ShortcutConfig, ShortcutItem, ToolbarStyle } from '../types/shortcuts.types'

export const shortcutsService = {
  get: () => apiCall.get<ShortcutConfig>(apiRoutes.shortcuts.root),
  save: (payload: { toolbarStyle: ToolbarStyle; items: ShortcutItem[] }) =>
    apiCall.put<ShortcutConfig>(apiRoutes.shortcuts.root, payload),
  reset: () => apiCall.post<ShortcutConfig>(apiRoutes.shortcuts.reset),
}
