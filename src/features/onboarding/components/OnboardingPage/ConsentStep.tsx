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
          Healthy eating reminder and privacy notice
        </h1>
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Health disclaimer</h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            MacroOS provides educational health information based on the data you enter. It is not
            medical advice or personal counselling. Always ask a healthcare professional before
            making important health decisions, such as changing your diet or exercise routine. You
            understand and accept the risks of using the app, including changes to your eating and
            activity. You are responsible for your own health decisions and should seek professional
            guidance when needed.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Health data privacy</h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong className="text-foreground font-medium">Privacy and safety come first:</strong>{' '}
            we keep your data safe, tell you how it is used and promise never to sell it. Your data
            is only used to improve your MacroOS experience with features that fit your goals.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong className="text-foreground font-medium">
              Your health, your data, your choice:
            </strong>{' '}
            we need your consent to use information such as body metrics and nutrition to give you
            personalised feedback. Without this data, the app cannot give feedback tailored to you.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong className="text-foreground font-medium">You are in control:</strong> you decide
            what information to provide and can edit or delete your data at any time, which may
            affect your personalised recommendations.
          </p>
        </section>
      </div>

      <div className="bg-background sticky bottom-0 -mx-4 space-y-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] in-data-[keyboard=open]:bottom-(--kb-bottom)">
        {[
          {
            id: healthId,
            label: 'I agree to the terms of the Health Disclaimer.',
            checked: healthAccepted,
            onChange: onHealthChange,
          },
          {
            id: privacyId,
            label: 'I agree to the terms of the Health Data Privacy Notice.',
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
          {isPending ? 'Finishing...' : 'Accept and continue'}
        </Button>
      </div>
    </div>
  )
}
