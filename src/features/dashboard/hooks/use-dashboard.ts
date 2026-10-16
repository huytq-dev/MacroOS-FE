'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard.service'

export const useExpenditureSeries = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: ['expenditure', from ?? '', to ?? ''],
    queryFn: () => dashboardService.expenditure(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
  })
