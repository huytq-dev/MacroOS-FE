'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { IconButton } from '@/components/shared/IconButton'

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>

/** Ô mật khẩu có nút hiện/ẩn; nhận ref và props của react-hook-form như `Input`. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-11" />
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
