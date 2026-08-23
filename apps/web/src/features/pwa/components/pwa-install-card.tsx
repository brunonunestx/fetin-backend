import { Download, Share2, Smartphone } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/features/pwa/use-pwa-install';

function PwaInstallCard() {
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const { installMode, requestInstall } = usePwaInstall();

  if (!installMode) {
    return null;
  }

  const isIos = installMode === 'ios';

  return (
    <>
      <section
        aria-label="Instalar aplicativo"
        className="rounded-2xl border border-border bg-secondary p-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
            <Smartphone aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Use como aplicativo</h2>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              {isIos
                ? 'Adicione o TrampoFácil à Tela de Início.'
                : 'Instale para abrir direto da tela inicial.'}
            </p>
          </div>
        </div>
        <Button
          aria-label={isIos ? 'Ver como instalar no iPhone' : 'Instalar aplicativo'}
          className="mt-3 w-full"
          onClick={() => {
            if (isIos) {
              setShowIosInstructions(true);
              return;
            }

            void requestInstall();
          }}
          size="sm"
          type="button"
        >
          {isIos ? <Share2 aria-hidden="true" /> : <Download aria-hidden="true" />}
          {isIos ? 'Como instalar' : 'Instalar'}
        </Button>
      </section>

      <AlertDialog open={showIosInstructions} onOpenChange={setShowIosInstructions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Instalar no iPhone</AlertDialogTitle>
            <AlertDialogDescription>
              Toque em Compartilhar e depois em Adicionar à Tela de Início. O ícone do TrampoFácil
              aparecerá junto dos seus aplicativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-2xl bg-secondary p-4 font-bold text-secondary-foreground">
            Compartilhar → Adicionar à Tela de Início
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { PwaInstallCard };
