import { Scale, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconButton } from '@/components/shared/IconButton'
import { ListSection } from '@/components/shared/ListGroup'
import { Card } from '@/components/ui/card'
import { formatDateVi } from '@/lib/date'
import type { WeightEntry } from '../../types/weight.types'

interface WeightTableProps {
  readonly items: WeightEntry[]
  readonly onRequestDelete: (entry: WeightEntry) => void
  readonly emptyAction?: React.ReactNode
}

/** Lịch sử cân dạng danh sách: ngày + ghi chú bên trái, cân và trend bên phải, nút xoá cuối dòng. */
export function WeightTable({ items, onRequestDelete, emptyAction }: WeightTableProps) {
  if (items.length === 0)
    return (
      <Card className="rounded-2xl">
        <EmptyState
          icon={Scale}
          title="Chưa có lần cân nào"
          description="Ghi cân nặng để xem trend và tốc độ thay đổi."
          action={emptyAction}
        />
      </Card>
    )
  return (
    <ListSection label="Lịch sử">
      {items.map((entry) => (
        <div
          key={entry.id}
          className="flex min-h-14 items-center gap-2 py-1 pr-1 pl-4 text-base md:text-sm"
        >
          <div className="min-w-0 flex-1">
            <p>{formatDateVi(entry.logDate)}</p>
            {entry.notes && <p className="text-muted-foreground truncate text-xs">{entry.notes}</p>}
          </div>
          <div className="text-right tabular-nums">
            <p className="font-bold">{entry.weightKg.toFixed(1)} kg</p>
            <p className="text-muted-foreground text-xs">
              trend {entry.trendWeightKg?.toFixed(2) ?? '—'}
            </p>
          </div>
          <IconButton
            icon={Trash2}
            label={`Xoá cân ngày ${formatDateVi(entry.logDate)}`}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRequestDelete(entry)}
          />
        </div>
      ))}
    </ListSection>
  )
}
