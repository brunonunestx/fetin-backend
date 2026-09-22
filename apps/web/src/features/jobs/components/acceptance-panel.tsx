import { CheckCircle2, LoaderCircle, RefreshCw, UserRoundX, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AcceptanceViewState } from '@/features/jobs/use-job-acceptance';
import { isApiError } from '@/lib/api/api-error';
import { cn } from '@/lib/utils';

type AcceptancePanelProps = {
  error: unknown;
  onTryAgain: () => void;
  state: Exclude<AcceptanceViewState, 'idle'>;
};

const content = {
  applied: {
    description: 'Agora é só aguardar o contratante escolher quem fará o trabalho.',
    icon: CheckCircle2,
    title: 'Candidatura enviada',
    tone: 'success',
  },
  checking: {
    description: 'Estamos verificando se você já se candidatou a este trabalho.',
    icon: LoaderCircle,
    title: 'Verificando candidatura',
    tone: 'warning',
  },
  error: {
    description: 'Não conseguimos enviar sua candidatura agora.',
    icon: RefreshCw,
    title: 'Não foi possível continuar',
    tone: 'error',
  },
  offline: {
    description: 'Conecte-se à internet para verificar ou enviar sua candidatura.',
    icon: WifiOff,
    title: 'Você está sem conexão',
    tone: 'error',
  },
  submitting: {
    description: 'Estamos enviando seu interesse ao contratante.',
    icon: LoaderCircle,
    title: 'Enviando candidatura',
    tone: 'warning',
  },
  lost: {
    description: 'O contratante escolheu outra pessoa para realizar este trabalho.',
    icon: UserRoundX,
    title: 'Outra pessoa foi escolhida',
    tone: 'info',
  },
  won: {
    description: 'O contratante escolheu você para realizar este trabalho.',
    icon: CheckCircle2,
    title: 'Você foi escolhido',
    tone: 'success',
  },
} as const;

function AcceptancePanel({ error, onTryAgain, state }: AcceptancePanelProps) {
  const stateContent = content[state];
  const Icon = stateContent.icon;
  const canTryAgain = state === 'error' || state === 'offline';
  const errorMessage = state === 'error' && isApiError(error) ? error.message : null;

  return (
    <section
      aria-live="polite"
      className={cn(
        'rounded-2xl border p-5 text-center',
        stateContent.tone === 'success' && 'border-success bg-success text-success-foreground',
        stateContent.tone === 'warning' && 'border-warning bg-warning text-warning-foreground',
        stateContent.tone === 'info' && 'border-info bg-info text-info-foreground',
        stateContent.tone === 'error' && 'border-destructive/25 bg-destructive/8 text-destructive',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mx-auto size-9',
          (state === 'checking' || state === 'submitting') && 'animate-spin',
        )}
      />
      <h2 className="mt-3 text-xl font-extrabold">{stateContent.title}</h2>
      <p className="mt-2 text-base leading-relaxed">{errorMessage ?? stateContent.description}</p>
      {canTryAgain ? (
        <Button className="mt-5 w-full" onClick={onTryAgain} type="button" variant="outline">
          Tentar novamente
        </Button>
      ) : null}
    </section>
  );
}

export { AcceptancePanel };
