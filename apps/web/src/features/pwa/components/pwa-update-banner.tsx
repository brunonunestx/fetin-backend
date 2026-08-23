import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PwaUpdateBanner({
  isUpdating,
  onDismiss,
  onUpdate,
}: {
  isUpdating: boolean;
  onDismiss: () => void;
  onUpdate: () => void;
}) {
  return (
    <aside
      aria-live="polite"
      className="safe-area-bottom fixed right-3 bottom-3 left-3 z-50 mx-auto max-w-[28rem] rounded-2xl border border-border bg-card p-4 shadow-xl"
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <RefreshCw aria-hidden="true" className={isUpdating ? 'animate-spin' : undefined} />
        </span>
        <div>
          <p className="font-extrabold">Atualização disponível</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Atualize quando terminar o que está fazendo.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button disabled={isUpdating} onClick={onDismiss} type="button" variant="outline">
          Depois
        </Button>
        <Button disabled={isUpdating} onClick={onUpdate} type="button">
          {isUpdating ? 'Atualizando...' : 'Atualizar agora'}
        </Button>
      </div>
    </aside>
  );
}

export { PwaUpdateBanner };
