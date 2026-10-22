'use client'

import { Button } from '@/components/ui/button'
import { focusWizardNext } from './WizardShell'

interface SuggestionNoteProps {
  readonly onConfirm: () => void
  readonly message?: string
  readonly action?: string
}

/**
 * Giá trị đang hiện chỉ là GỢI Ý (người dùng chưa chạm): nút Tiếp theo đang khoá; chạm vào bánh xe / thước / thanh trượt hoặc bấm nút này để xác nhận. Chỉ giá trị
 * đã xác nhận mới được gửi BE. Dùng cho ngày sinh / chiều cao / cân nặng (Basics) và cân mục tiêu + tốc độ (Goal).
 */
export function SuggestionNote({
  onConfirm,
  message = 'This is only a suggested starting point. Scroll to set yours.',
  action = 'Use this value',
}: SuggestionNoteProps) {
  const confirm = () => {
    onConfirm()
    // Nút này biến mất ngay khi được bấm: chuyển focus sang nút Next vừa được bật thay vì để rơi về body
    focusWizardNext()
  }
  return (
    <div className="mt-4 flex flex-col items-center gap-2 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button type="button" variant="secondary" onClick={confirm}>
        {action}
      </Button>
    </div>
  )
}
