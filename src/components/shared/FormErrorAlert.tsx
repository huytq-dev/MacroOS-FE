import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FormErrorAlertProps {
  readonly title: string
  readonly message?: string | null
}

/** Lỗi người dùng phải sửa tại chỗ: hiện ngay đầu form (UI.md mục 13, 15), không chỉ toast. */
export function FormErrorAlert({ title, message }: FormErrorAlertProps) {
  if (!message) return null
  return (
    <Alert variant="destructive" className="text-xs">
      <CircleAlert aria-hidden="true" />
      <AlertTitle className="text-xs font-medium">{title}</AlertTitle>
      <AlertDescription className="text-xs">{message}</AlertDescription>
    </Alert>
  )
}
