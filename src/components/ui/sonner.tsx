'use client'

import { useTheme } from '@/lib/theme'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      // Kiểu thông báo của app di động: viên nang gọn ở đầu màn hình (dưới tai thỏ), nền thẻ tối, icon màu theo loại, chữ 15px.
      offset={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)', left: 16, right: 16 }}
      visibleToasts={2}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            'cn-toast !min-h-12 !items-center !gap-3 !rounded-2xl !border-border !px-4 !py-3 !text-[15px] !font-medium !shadow-xl',
          title: '!font-medium',
          description: '!text-sm !text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
