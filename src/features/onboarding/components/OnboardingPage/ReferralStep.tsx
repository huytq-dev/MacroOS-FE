'use client'

import { Ellipsis } from 'lucide-react'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { StepHeading } from './ChoiceStep'
import {
  AffiliateTag,
  FacebookLogo,
  FriendStar,
  InstagramLogo,
  RedditLogo,
  TiktokLogo,
  YoutubeLogo,
} from './BrandIcons'
import { OptionCard } from './OptionCard'
import { REFERRAL_OPTIONS, type OptionIcon } from '../../types/onboarding-options.types'

const ICONS: Record<string, OptionIcon> = {
  Affiliate: AffiliateTag,
  YouTube: YoutubeLogo,
  Reddit: RedditLogo,
  Friends: FriendStar,
  Instagram: InstagramLogo,
  TikTok: TiktokLogo,
  Facebook: FacebookLogo,
  Other: Ellipsis,
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
      <StepHeading title="How did you hear about MacroOS?" subtitle="Optional" />
      <div role="radiogroup" aria-label="How you heard about us" className="space-y-3">
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
                <FormField label="Tell us who referred you">
                  {(field) => (
                    <Input
                      {...field}
                      value={affiliateCode}
                      maxLength={50}
                      autoComplete="off"
                      placeholder="Enter referral code"
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
