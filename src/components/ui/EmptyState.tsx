import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  icon?: React.ReactNode
  message: string
  description?: string
}

export function EmptyState({ icon, message, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 text-brand-dim">
        {icon ?? <Inbox size={36} strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-medium text-brand-text">{message}</p>
      {description && <p className="text-xs text-brand-muted mt-1">{description}</p>}
    </div>
  )
}
