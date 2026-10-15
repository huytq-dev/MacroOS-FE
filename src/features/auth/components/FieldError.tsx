interface FieldErrorProps {
  readonly message?: string
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return <p className="text-destructive text-[11px]">{message}</p>
}
