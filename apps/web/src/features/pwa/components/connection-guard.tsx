import { RefreshCw, WifiOff } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Brand } from '@/components/shared/brand';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/lib/use-online-status';

function OfflineScreen() {
  const [checkedConnection, setCheckedConnection] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const retry = async () => {
    setIsChecking(true);
    setCheckedConnection(false);

    try {
      if (!window.navigator.onLine) {
        throw new Error('Browser is offline');
      }

      await fetch('/manifest.webmanifest', { cache: 'no-store', method: 'HEAD' });
      window.location.reload();
    } catch {
      setCheckedConnection(true);
      setIsChecking(false);
    }
  };

  return (
    <div
      aria-labelledby="offline-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] overflow-y-auto bg-background"
      role="dialog"
    >
      <main className="safe-area-top mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 pb-8 text-center">
        <Brand />
        <span className="mt-9 flex size-20 items-center justify-center rounded-full bg-secondary text-primary">
          <WifiOff aria-hidden="true" className="size-10" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold" id="offline-title">
          Você está sem internet
        </h1>
        <p className="mt-3 max-w-80 text-base leading-relaxed text-muted-foreground">
          Reconecte para ver vagas atualizadas e realizar qualquer ação com segurança.
        </p>
        {checkedConnection ? (
          <p aria-live="polite" className="mt-4 font-bold text-destructive">
            Ainda não encontramos uma conexão.
          </p>
        ) : null}
        <Button
          className="mt-7 w-full"
          disabled={isChecking}
          onClick={() => void retry()}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={isChecking ? 'animate-spin' : undefined} />
          {isChecking ? 'Verificando...' : 'Tentar novamente'}
        </Button>
      </main>
    </div>
  );
}

function ConnectionGuard({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();

  return (
    <>
      <div aria-hidden={!isOnline || undefined} inert={!isOnline || undefined}>
        {children}
      </div>
      {!isOnline ? <OfflineScreen /> : null}
    </>
  );
}

export { ConnectionGuard, OfflineScreen };
