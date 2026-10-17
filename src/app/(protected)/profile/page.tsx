import type { Metadata } from 'next'
import { ProfilePage } from '@/features/users/pages/ProfilePage'

export const metadata: Metadata = { title: 'Profile' }

export default function ProfileRoute() {
  return <ProfilePage />
}
