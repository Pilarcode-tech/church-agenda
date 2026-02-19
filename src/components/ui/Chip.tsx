type ChipStatus = 'pendente' | 'aprovado' | 'recusado' | 'cancelado' | 'reagendado' | 'blue'

const chipStyles: Record<ChipStatus, string> = {
  pendente: 'bg-brand-amberL text-brand-amber',
  aprovado: 'bg-brand-greenL text-brand-green',
  recusado: 'bg-brand-redL text-brand-red',
  cancelado: 'bg-gray-100 text-brand-dim',
  reagendado: 'bg-brand-accentL text-brand-accent',
  blue: 'bg-brand-accentL text-brand-accent',
}

const chipLabels: Record<ChipStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
  reagendado: 'Reagendado',
  blue: '',
}

type ChipProps = {
  status: ChipStatus
  label?: string
}

export function Chip({ status, label }: ChipProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${chipStyles[status]}`}>
      {label ?? chipLabels[status]}
    </span>
  )
}
