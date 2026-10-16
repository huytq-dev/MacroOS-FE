'use client'

import {
  Camera,
  Ellipsis,
  MessagesSquare,
  Music2,
  Play,
  Tag,
  ThumbsUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { StepHeading } from './ChoiceStep'
import { OptionCard } from './OptionCard'
import { REFERRAL_OPTIONS } from '../../types/onboarding-options.types'

const ICONS: Record<string, LucideIcon> = {
  Affiliate: Tag,
  YouTube: Play,
  Reddit: MessagesSquare,
  'Bạn bè': Users,
  Instagram: Camera,
  TikTok: Music2,
  Facebook: ThumbsUp,
  Khác: Ellipsis,
}

interface ReferralStepProps {
  readonly source: string | null
  readonly affiliateCode: string
  readonly onSourceChange: (source: string) => void
  readonly onAffiliateCodeChange: (code: string) => void
}

/** "Bạn biết đến chúng tôi từ đâu?" (tuỳ chọn); chọn Affiliate thì mở ô nhập mã người giới thiệu. */
export function ReferralStep({
  source,
  affiliateCode,
  onSourceChange,
  onAffiliateCodeChange,
}: ReferralStepProps) {
  return (
    <div>
      <StepHeading title="Bạn biết đến MacroOS từ đâu?" subtitle="Không bắt buộc" />
      <div role="radiogroup" aria-label="Nguồn biết đến" className="space-y-3">
        {REFERRAL_OPTIONS.map((option, index) => (
          <OptionCard
            key={option}
            index={index}
            label={option}
            icon={ICONS[option]}
            selected={source === option}
            onSelect={() => onSourceChange(option)}
          >
            {option === 'Affiliate' && source === 'Affiliate' && (
              <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:animation-duration-200 px-4 pb-4">
                <FormField label="Cho chúng tôi biết ai đã giới thiệu bạn">
                  {(field) => (
                    <Input
                      {...field}
                      value={affiliateCode}
                      maxLength={50}
                      autoComplete="off"
                      placeholder="Nhập mã giới thiệu"
                      onChange={(event) => onAffiliateCodeChange(event.target.value)}
                    />
                  )}
                </FormField>
              </div>
            )}
          </OptionCard>
        ))}
      </div>
    </div>
  )
}
