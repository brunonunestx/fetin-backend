import { CircleAlert } from 'lucide-react';
import { isApiError } from '@/lib/api/api-error';

function FormError({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }

  const message = isApiError(error) ? error.message : 'Não foi possível concluir. Tente novamente.';
  const correlationId = isApiError(error) ? error.correlationId : undefined;

  return (
    <div className="rounded-xl border border-destructive/25 bg-destructive/8 p-3" role="alert">
      <div className="flex gap-2 text-destructive">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="text-base leading-snug font-bold">{message}</p>
      </div>
      {correlationId ? (
        <p className="mt-2 text-xs text-muted-foreground">Código de atendimento: {correlationId}</p>
      ) : null}
    </div>
  );
}

export { FormError };
