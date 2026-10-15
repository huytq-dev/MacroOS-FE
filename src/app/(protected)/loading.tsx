export default function ProtectedLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div className="h-16 shrink-0 animate-pulse rounded-xl bg-muted" />
      <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="min-h-0 flex-1 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
