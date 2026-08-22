import {
  CheckCircle2,
  ClockAlert,
  LoaderCircle,
  RefreshCw,
  UserRoundX,
  WifiOff,
} from 'lucide-react';
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
  confirming: {
    description: 'Estamos aguardando a confirmação. Isso costuma levar poucos segundos.',
    icon: LoaderCircle,
    title: 'Confirmando seu aceite',
    tone: 'warning',
  },
  delayed: {
    description: 'A confirmação continua em andamento. Você pode verificar o resultado novamente.',
    icon: ClockAlert,
    title: 'Está demorando um pouco',
    tone: 'warning',
  },
  error: {
    description: 'Não conseguimos confirmar o resultado agora.',
    icon: RefreshCw,
    title: 'Não foi possível continuar',
    tone: 'error',
  },
  lost: {
    description: 'Este trabalho já foi confirmado para outra pessoa.',
    icon: UserRoundX,
    title: 'Outra pessoa conseguiu primeiro',
    tone: 'info',
  },
  offline: {
    description: 'Conecte-se à internet para continuar verificando o resultado.',
    icon: WifiOff,
    title: 'Você está sem conexão',
    tone: 'error',
  },
  submitting: {
    description: 'Estamos enviando seu pedido para a fila.',
    icon: LoaderCircle,
    title: 'Enviando seu aceite',
    tone: 'warning',
  },
  won: {
    description: 'O contratante poderá ver seu perfil para dar continuidade ao serviço.',
    icon: CheckCircle2,
    title: 'A vaga é sua',
    tone: 'success',
  },
} as const;

function AcceptancePanel({ error, onTryAgain, state }: AcceptancePanelProps) {
  const stateContent = content[state];
  const Icon = stateContent.icon;
  const canTryAgain = state === 'delayed' || state === 'error' || state === 'offline';
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
          (state === 'confirming' || state === 'submitting') && 'animate-spin',
        )}
      />
      <h2 className="mt-3 text-xl font-extrabold">{stateContent.title}</h2>
      <p className="mt-2 text-base leading-relaxed">{errorMessage ?? stateContent.description}</p>
      {canTryAgain ? (
        <Button className="mt-5 w-full" onClick={onTryAgain} type="button" variant="outline">
          {state === 'error' ? 'Tentar novamente' : 'Verificar novamente'}
        </Button>
      ) : null}
    </section>
  );
}

export { AcceptancePanel };
