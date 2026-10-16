import { Scale, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconButton } from '@/components/shared/IconButton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateVi } from '@/lib/date'
import type { WeightEntry } from '../../types/weight.types'

interface WeightTableProps {
  readonly items: WeightEntry[]
  readonly onRequestDelete: (entry: WeightEntry) => void
  readonly emptyAction?: React.ReactNode
}

export function WeightTable({ items, onRequestDelete, emptyAction }: WeightTableProps) {
  if (items.length === 0)
    return (
      <EmptyState
        icon={Scale}
        title="Chưa có lần cân nào"
        description="Ghi cân nặng để xem trend và tốc độ thay đổi."
        action={emptyAction}
      />
    )
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ngày</TableHead>
          <TableHead className="text-right">Cân (kg)</TableHead>
          <TableHead className="text-right">Trend</TableHead>
          <TableHead className="hidden sm:table-cell">Ghi chú</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Thao tác</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="tabular-nums">
        {items.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="whitespace-nowrap">{formatDateVi(entry.logDate)}</TableCell>
            <TableCell className="text-right font-medium">{entry.weightKg.toFixed(1)}</TableCell>
            <TableCell className="text-right">{entry.trendWeightKg?.toFixed(2) ?? '—'}</TableCell>
            <TableCell
              className="text-muted-foreground hidden max-w-60 truncate sm:table-cell"
              title={entry.notes ?? undefined}
            >
              {entry.notes ?? '—'}
            </TableCell>
            <TableCell className="p-1">
              <IconButton
                icon={Trash2}
                label={`Xoá cân ngày ${formatDateVi(entry.logDate)}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRequestDelete(entry)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
