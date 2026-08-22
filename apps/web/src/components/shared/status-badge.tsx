import { Badge } from '@/components/ui/badge';

const statusContent = {
  available: { label: 'Disponível', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  filled: { label: 'Preenchido', variant: 'secondary' },
  pending: { label: 'Aguardando', variant: 'warning' },
} as const;

type Status = keyof typeof statusContent;

function StatusBadge({ status }: { status: Status }) {
  const content = statusContent[status];

  return <Badge variant={content.variant}>{content.label}</Badge>;
}

export { StatusBadge };
export type { Status };
