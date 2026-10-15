import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  height?: number
}

export function Logo({ className, height = 32 }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="bg-primary text-primary-foreground flex items-center justify-center rounded-lg"
        style={{ width: height, height }}
      >
        <Flame aria-hidden="true" style={{ width: height * 0.6, height: height * 0.6 }} />
      </span>
      <span className="text-primary font-semibold" style={{ fontSize: height * 0.55 }}>
        MacroOS
      </span>
    </span>
  )
}
