import * as React from 'react'

import { cn } from '@/lib/utils'

/** `<select>` native: trên iOS mở bánh xe chọn của hệ điều hành (nhanh hơn dropdown tự vẽ). Chữ 16px tránh zoom khi focus. */
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-11 w-full min-w-0 rounded-md border bg-transparent px-3 text-base outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:h-8 md:px-2.5 md:text-xs',
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
