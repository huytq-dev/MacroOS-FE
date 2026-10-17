import { ChevronRight, Scale, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconButton } from '@/components/shared/IconButton'
import { ListSection } from '@/components/shared/ListGroup'
import { Card } from '@/components/ui/card'
import { formatDateVi } from '@/lib/date'
import type { WeightEntry } from '../../types/weight.types'

interface WeightTableProps {
  readonly items: WeightEntry[]
  readonly onEdit: (entry: WeightEntry) => void
  readonly onRequestDelete: (entry: WeightEntry) => void
  readonly emptyAction?: React.ReactNode
}

/** Lịch sử cân dạng danh sách: ngày + ghi chú bên trái, cân và trend bên phải, nút xoá cuối dòng. */
export function WeightTable({ items, onEdit, onRequestDelete, emptyAction }: WeightTableProps) {
  if (items.length === 0)
    return (
      <Card className="rounded-2xl">
        <EmptyState
          icon={Scale}
          title="No weigh-ins yet"
          description="Log your weight to see your trend and rate of change."
          action={emptyAction}
        />
      </Card>
    )
  return (
    <ListSection label="History">
      {items.map((entry) => (
        <div key={entry.id} className="flex min-h-14 items-center text-base md:text-sm">
          <button
            type="button"
            aria-label={`Edit weigh-in on ${formatDateVi(entry.logDate)}`}
            onClick={() => onEdit(entry)}
            className="active:bg-muted focus-visible:ring-ring/50 flex min-h-14 min-w-0 flex-1 items-center gap-2 py-1 pr-2 pl-4 text-left transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset"
          >
            <span className="min-w-0 flex-1">
              <span className="block">{formatDateVi(entry.logDate)}</span>
              {entry.notes && (
                <span className="text-muted-foreground block truncate text-xs">{entry.notes}</span>
              )}
            </span>
            <span className="text-right tabular-nums">
              <span className="block font-bold">{entry.weightKg.toFixed(1)} kg</span>
              <span className="text-muted-foreground block text-xs">
                trend {entry.trendWeightKg?.toFixed(2) ?? '—'}
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="text-muted-foreground/60 size-4 shrink-0" />
          </button>
          <IconButton
            icon={Trash2}
            label={`Delete weigh-in on ${formatDateVi(entry.logDate)}`}
            className="text-muted-foreground hover:text-destructive mr-1 size-11 md:size-8"
            onClick={() => onRequestDelete(entry)}
          />
        </div>
      ))}
    </ListSection>
  )
}
