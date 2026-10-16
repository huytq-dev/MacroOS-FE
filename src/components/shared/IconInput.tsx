import type { LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type IconInputProps = React.ComponentProps<typeof Input> & {
  /** Biểu tượng trang trí ở đầu ô. */
  readonly startIcon: LucideIcon
}

/** `Input` có biểu tượng ở đầu ô; nhận ref và props của react-hook-form như `Input`. */
export function IconInput({ startIcon: StartIcon, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <StartIcon
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      />
      <Input {...props} className={cn('pl-10 md:pl-10', className)} />
    </div>
  )
}
