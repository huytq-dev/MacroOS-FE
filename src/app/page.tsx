import { redirect } from 'next/navigation'
import { routePath } from '@/config/route-path'

export default function Home() {
  redirect(routePath.dashboard)
}
