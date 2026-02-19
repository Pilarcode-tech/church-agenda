type TopbarProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="bg-brand-white border-b border-brand-border sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="font-serif text-xl text-brand-text">{title}</h1>
        {subtitle && <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
