'use client'

import { useState } from 'react'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { IconButton } from '@/components/shared/IconButton'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'> & {
  /** Biểu tượng trang trí ở đầu ô. */
  readonly startIcon?: LucideIcon
}

/** Ô mật khẩu có nút hiện/ẩn; nhận ref và props của react-hook-form như `Input`. */
export function PasswordInput({ startIcon: StartIcon, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      {StartIcon && (
        <StartIcon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        />
      )}
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-11 md:pr-11', StartIcon && 'pl-10 md:pl-10', className)}
      />
      <IconButton
        type="button"
        icon={visible ? EyeOff : Eye}
        label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="text-muted-foreground absolute top-1/2 right-0.5 -translate-y-1/2"
      />
    </div>
  )
}
