import { Skeleton } from '@/components/ui/skeleton'

export default function ProtectedLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <Skeleton className="h-16 shrink-0 rounded-xl" />
      <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="min-h-0 flex-1 rounded-xl" />
    </div>
  )
}
