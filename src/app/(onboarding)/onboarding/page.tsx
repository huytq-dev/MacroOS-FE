import type { Metadata } from 'next'
import { OnboardingPage } from '@/features/onboarding/pages/OnboardingPage'

export const metadata: Metadata = { title: 'Thiết lập' }

export default function OnboardingRoute() {
  return <OnboardingPage />
}
