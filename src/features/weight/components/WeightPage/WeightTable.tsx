import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateVi } from '@/lib/date'
import type { WeightEntry } from '../../types/weight.types'

interface WeightTableProps {
  readonly items: WeightEntry[]
  readonly isDeleting: boolean
  readonly onDelete: (logDate: string) => void
}

export function WeightTable({ items, isDeleting, onDelete }: WeightTableProps) {
  if (items.length === 0)
    return <p className="text-muted-foreground px-3 py-6 text-center text-xs">Chưa có lần cân nào trong khoảng này.</p>
  return (
    <table className="w-full text-xs">
      <thead className="text-muted-foreground">
        <tr className="border-b">
          <th className="px-3 py-2 text-left font-medium">Ngày</th>
          <th className="px-3 py-2 text-right font-medium">Cân (kg)</th>
          <th className="px-3 py-2 text-right font-medium">Trend</th>
          <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Ghi chú</th>
          <th className="w-10" />
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {items.map((entry) => (
          <tr key={entry.id} className="border-b last:border-0">
            <td className="px-3 py-1.5 whitespace-nowrap">{formatDateVi(entry.logDate)}</td>
            <td className="px-3 py-1.5 text-right font-medium">{entry.weightKg.toFixed(1)}</td>
            <td className="px-3 py-1.5 text-right">{entry.trendWeightKg?.toFixed(2) ?? '—'}</td>
            <td className="text-muted-foreground hidden max-w-60 truncate px-3 py-1.5 sm:table-cell" title={entry.notes ?? undefined}>
              {entry.notes ?? ''}
            </td>
            <td className="px-1 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                disabled={isDeleting}
                onClick={() => onDelete(entry.logDate)}
                aria-label={`Xoá cân ngày ${formatDateVi(entry.logDate)}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
