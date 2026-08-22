import { LoaderCircle } from 'lucide-react';
import { Brand } from '@/components/shared/brand';
import { MobileShell } from '@/components/shared/mobile-shell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';

function SessionLoadingScreen() {
  return (
    <MobileShell>
      <main
        aria-label="Verificando sua sessão"
        className="safe-area-top flex flex-1 flex-col items-center justify-center px-6 text-center"
      >
        <Brand />
        <LoaderCircle aria-hidden="true" className="mt-8 size-8 animate-spin text-primary" />
        <p className="mt-3 text-base text-muted-foreground">Abrindo sua conta...</p>
      </main>
    </MobileShell>
  );
}

function SessionErrorScreen() {
  const { logout, retrySession } = useAuth();

  return (
    <MobileShell>
      <main className="safe-area-top flex flex-1 flex-col items-center justify-center px-6 text-center">
        <Brand />
        <h1 className="mt-8 text-2xl font-extrabold">Não foi possível abrir sua conta</h1>
        <p className="mt-3 max-w-80 text-base leading-relaxed text-muted-foreground">
          Verifique sua conexão e tente novamente. Seus dados continuam salvos neste aparelho.
        </p>
        <Button className="mt-7 w-full" onClick={retrySession} type="button">
          Tentar novamente
        </Button>
        <Button className="mt-2" onClick={logout} type="button" variant="link">
          Sair desta conta
        </Button>
      </main>
    </MobileShell>
  );
}

export { SessionErrorScreen, SessionLoadingScreen };
