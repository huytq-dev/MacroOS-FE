import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ADJUSTMENT_REASON } from '@/config/enums'
import { formatDateVi } from '@/lib/date'
import type { ProgramWeek } from '../../types/program.types'

interface WeeksTableProps {
  readonly weeks: ProgramWeek[]
}

export function WeeksTable({ weeks }: WeeksTableProps) {
  if (weeks.length === 0) return null
  const sorted = [...weeks].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Từ ngày</TableHead>
            <TableHead className="text-right">kcal</TableHead>
            <TableHead className="text-right">P</TableHead>
            <TableHead className="text-right">C</TableHead>
            <TableHead className="text-right">F</TableHead>
            <TableHead className="text-right">Δ</TableHead>
            <TableHead className="hidden sm:table-cell">Lý do</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {sorted.map((week) => (
            <TableRow key={week.id}>
              <TableCell className="whitespace-nowrap">
                {formatDateVi(week.effectiveFrom)}
              </TableCell>
              <TableCell className="text-right font-medium">{week.caloriesTarget}</TableCell>
              <TableCell className="text-right">{Math.round(week.proteinTarget)}</TableCell>
              <TableCell className="text-right">{Math.round(week.carbsTarget)}</TableCell>
              <TableCell className="text-right">{Math.round(week.fatTarget)}</TableCell>
              <TableCell className="text-right">
                {week.previousCaloriesTarget === null
                  ? '—'
                  : week.caloriesTarget - week.previousCaloriesTarget}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary">{ADJUSTMENT_REASON[week.adjustmentReason]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
