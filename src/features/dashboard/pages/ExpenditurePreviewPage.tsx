'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ExpenditureScreen,
  type ExpenditureSource,
} from '../components/ExpenditurePage/ExpenditureScreen'
import {
  FLUX_PREVIEW_LABEL,
  PREVIEW_LABEL_SYNTHETIC,
  syntheticBuckets,
  syntheticInsights,
  syntheticSeries,
  syntheticSummary,
} from '../expenditure-preview'
import {
  alignToToday,
  isPreviewScenario,
  loadPreviewFixture,
  PREVIEW_SCENARIOS,
  type PreviewScenarioId,
} from '../expenditure-preview-fixtures'
import { buildExpenditureDetail } from '../hooks/use-expenditure-detail'
import type { Averaging } from '../expenditure.utils'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'
import { energyMeasure } from '@/lib/units'
import { cn } from '@/lib/utils'

const ENERGY = energyMeasure('kcal')
const noRefetch = (): void => undefined
const GATE: ExpenditureSource['derived'] = {
  gate: 'ready',
  known: true,
  updatedAt: 0,
  settling: false,
  isFetching: false,
  retry: noRefetch,
  isRetrying: false,
}

/** Chuỗi MÔ PHỎNG của một kịch bản (hoặc chuỗi tay làm sẵn khi `scenario` null), ngày cuối = hôm nay; `ready` false khi chưa biết hôm nay hoặc fixture chưa nạp xong. */
function usePreviewSeries(scenario: PreviewScenarioId | null) {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const fixture = useQuery({
    queryKey: ['expenditure-preview-fixture', scenario],
    queryFn: () => loadPreviewFixture(scenario as PreviewScenarioId),
    enabled: scenario !== null,
    staleTime: Infinity,
  })
  const series = useMemo(() => {
    if (!today) return []
    if (scenario === null) return syntheticSeries(today)
    return fixture.data ? alignToToday(fixture.data.days, today) : []
  }, [today, scenario, fixture.data])
  return {
    today,
    series,
    fixture: fixture.data,
    ready: Boolean(today) && (scenario === null || Boolean(fixture.data)),
  }
}

/**
 * Nguồn MÔ PHỎNG (không API, không đăng nhập): cùng `buildExpenditureDetail` với trang thật. `scenario` null = chuỗi tay làm sẵn; còn lại là kịch bản Flux V1 mô phỏng của BE (có nhãn
 * "preview, unapproved"). Luôn có nhãn rõ đây không phải dữ liệu thật. Nhóm W / M và thống kê khung được dựng offline bằng quy tắc của BE (trang thật đọc chúng từ BE).
 */
function makeScenarioHooks(scenario: PreviewScenarioId | null) {
  function usePreviewSource(averaging: Averaging): ExpenditureSource {
    const { today, series, fixture, ready } = usePreviewSeries(scenario)
    const data = useMemo(
      () =>
        ready && today
          ? {
              ready: true as const,
              isLoading: false,
              isError: false,
              isFetching: false,
              refetch: noRefetch,
              ...buildExpenditureDetail({
                today,
                days: series,
                info: syntheticInsights(series),
                averaging,
                buckets: syntheticBuckets(series, averaging),
                showFlux: true,
                flux: {
                  isPreview: scenario !== null,
                  overall: fixture?.fluxOverallStatus ?? null,
                },
              }),
            }
          : {
              ready: false as const,
              isLoading: true,
              isError: false,
              isFetching: false,
              refetch: noRefetch,
            },
      [ready, today, series, averaging, fixture]
    )
    return {
      data,
      derived: GATE,
      energy: ENERGY,
      previewLabel:
        scenario === null
          ? PREVIEW_LABEL_SYNTHETIC
          : `Preview — ${FLUX_PREVIEW_LABEL} on SYNTHETIC scenario ${scenario}${
              fixture ? ` (${fixture.scenarioName})` : ''
            }. Not user data, not production output.`,
      showInsights: false,
    }
  }
  function usePreviewSummary(from: string | null, to: string | null) {
    const { series } = usePreviewSeries(scenario)
    return useMemo(() => syntheticSummary(series, from, to), [series, from, to])
  }
  return { usePreviewSource, usePreviewSummary }
}

const CHIPS: readonly (readonly [string, string])[] = [['', 'Demo'], ...PREVIEW_SCENARIOS]

/**
 * Màn Expenditure với dữ liệu MÔ PHỎNG có nhãn, chỉ để xem bố cục / dải Flux khi build bật NEXT_PUBLIC_EXPENDITURE_PREVIEW (xem expenditure-preview.ts). `?scenario=S04` chọn một kịch bản
 * Flux V1 mô phỏng của BE; không có thì chuỗi tay làm sẵn.
 */
export function ExpenditurePreviewPage() {
  const raw = useSearchParams().get('scenario')
  const scenario = isPreviewScenario(raw) ? raw : null
  const hooks = useMemo(() => makeScenarioHooks(scenario), [scenario])
  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-4">
      <nav aria-label="Preview scenarios" className="flex flex-wrap gap-2">
        {CHIPS.map(([id, name]) => {
          const active = (scenario ?? '') === id
          return (
            <Link
              key={id || 'demo'}
              href={id ? `?scenario=${id}` : '?'}
              aria-current={active ? 'true' : undefined}
              title={name}
              className={cn(
                'focus-visible:ring-ring/50 inline-flex h-11 items-center rounded-full px-4 text-sm focus-visible:ring-1 focus-visible:outline-none',
                active ? 'bg-foreground text-background' : 'bg-secondary text-foreground'
              )}
            >
              {id || 'Demo'}
            </Link>
          )
        })}
      </nav>
      <ExpenditureScreen
        key={scenario ?? 'demo'}
        useSource={hooks.usePreviewSource}
        useSummary={hooks.usePreviewSummary}
      />
    </div>
  )
}
