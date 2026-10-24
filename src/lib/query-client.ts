import { QueryClient } from '@tanstack/react-query'
import { setDerivedHeaderListener } from './axios'
import { applyDerivedHeader } from '@/features/derived-data/derived-data.utils'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Header trạng thái dựng lại số dẫn xuất của mọi lần ghi → cache status dùng chung (Phase 3)
setDerivedHeaderListener((value) => applyDerivedHeader(queryClient, value))
