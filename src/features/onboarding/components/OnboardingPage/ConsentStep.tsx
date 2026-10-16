'use client'

import { useId } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface ConsentStepProps {
  readonly healthAccepted: boolean
  readonly privacyAccepted: boolean
  readonly onHealthChange: (accepted: boolean) => void
  readonly onPrivacyChange: (accepted: boolean) => void
  readonly isPending: boolean
  readonly onAccept: () => void
}

/** Nhắc ăn uống có trách nhiệm + quyền riêng tư: phải bật CẢ HAI công tắc mới bấm "Chấp nhận và tiếp tục" được. */
export function ConsentStep({
  healthAccepted,
  privacyAccepted,
  onHealthChange,
  onPrivacyChange,
  isPending,
  onAccept,
}: ConsentStepProps) {
  const healthId = useId()
  const privacyId = useId()
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-6 pb-6">
        <h1 className="text-2xl leading-tight font-bold">
          Nhắc nhở ăn uống có trách nhiệm và lưu ý về quyền riêng tư
        </h1>
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Tuyên bố sức khoẻ</h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            MacroOS cung cấp thông tin sức khoẻ mang tính giáo dục dựa trên dữ liệu bạn nhập, không
            phải lời khuyên y tế hay tư vấn cá nhân. Hãy luôn hỏi chuyên gia y tế trước khi đưa ra
            quyết định quan trọng về sức khoẻ, như thay đổi chế độ ăn hoặc tập luyện. Bạn hiểu và
            chấp nhận các rủi ro khi dùng ứng dụng, gồm cả thay đổi về ăn uống và vận động. Bạn chịu
            trách nhiệm cho quyết định sức khoẻ của mình và nên tìm hướng dẫn chuyên môn khi cần.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Quyền riêng tư dữ liệu sức khoẻ</h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong className="text-foreground font-medium">
              Riêng tư và an toàn là trên hết:
            </strong>{' '}
            chúng tôi giữ dữ liệu của bạn an toàn, cho bạn biết dữ liệu được dùng ra sao và cam kết
            không bán nó. Dữ liệu chỉ dùng để cải thiện trải nghiệm MacroOS với các tính năng phù
            hợp mục tiêu của bạn.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong className="text-foreground font-medium">
              Sức khoẻ của bạn, dữ liệu của bạn, quyền của bạn:
            </strong>{' '}
            chúng tôi cần sự đồng ý của bạn để dùng các thông tin như chỉ số cơ thể và dinh dưỡng
            nhằm đưa ra phản hồi cá nhân hoá. Không có dữ liệu này, ứng dụng không thể đưa phản hồi
            phù hợp với riêng bạn.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong className="text-foreground font-medium">Bạn kiểm soát:</strong> bạn quyết định
            cung cấp thông tin nào và có thể sửa hoặc xoá dữ liệu bất cứ lúc nào, điều này có thể
            ảnh hưởng đến các gợi ý cá nhân hoá.
          </p>
        </section>
      </div>

      <div className="bg-background sticky bottom-0 -mx-4 space-y-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {[
          {
            id: healthId,
            label: 'Tôi đồng ý với điều khoản của Tuyên bố sức khoẻ.',
            checked: healthAccepted,
            onChange: onHealthChange,
          },
          {
            id: privacyId,
            label: 'Tôi đồng ý với điều khoản của Thông báo quyền riêng tư dữ liệu sức khoẻ.',
            checked: privacyAccepted,
            onChange: onPrivacyChange,
          },
        ].map((row) => (
          <div key={row.id} className="flex min-h-11 items-center justify-between gap-4">
            <Label htmlFor={row.id} className="text-base leading-snug font-normal">
              {row.label}
            </Label>
            <Switch
              id={row.id}
              checked={row.checked}
              onCheckedChange={row.onChange}
              disabled={isPending}
            />
          </div>
        ))}
        <Button
          className="h-12 w-full rounded-full text-base"
          disabled={!healthAccepted || !privacyAccepted || isPending}
          aria-busy={isPending}
          onClick={() => {
            if (!isPending) onAccept()
          }}
        >
          {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isPending ? 'Đang hoàn tất...' : 'Chấp nhận và tiếp tục'}
        </Button>
      </div>
    </div>
  )
}
