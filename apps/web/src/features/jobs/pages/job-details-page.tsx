import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness, CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/state-panel';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/use-auth';
import { AcceptancePanel } from '@/features/jobs/components/acceptance-panel';
import {
  formatAddress,
  formatCurrency,
  formatDuration,
  formatJobDate,
  formatJobTime,
} from '@/features/jobs/job-formatters';
import { getJob } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import { getJobAvailability } from '@/features/jobs/job-rules';
import { useJobAcceptance } from '@/features/jobs/use-job-acceptance';

function JobDetailsLoading() {
  return (
    <div aria-label="Carregando trabalho" className="space-y-5 px-5 py-7">
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}

function JobDetailsPage() {
  const { user } = useAuth();
  const { jobId = '' } = useParams();
  const jobQuery = useQuery({
    enabled: Boolean(jobId),
    queryFn: ({ signal }) => getJob(jobId, signal),
    queryKey: jobsQueryKeys.detail(jobId),
  });
  const acceptance = useJobAcceptance(jobId, user?.userId ?? '');
  const availability = jobQuery.data ? getJobAvailability(jobQuery.data) : null;

  return (
    <MobileShell>
      <PageHeader backHref="/trabalhos" title="Detalhes do trabalho" />
      <main className="flex flex-1 flex-col">
        {jobQuery.isPending ? <JobDetailsLoading /> : null}

        {jobQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void jobQuery.refetch() }}
            description="Não conseguimos abrir este trabalho. Ele pode ter sido removido ou sua conexão falhou."
            title="Trabalho indisponível"
          />
        ) : null}

        {jobQuery.data && availability ? (
          <>
            <div className="px-5 py-7">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-3xl font-extrabold text-primary">
                  {formatCurrency(jobQuery.data.value)}
                </strong>
                <StatusBadge status={availability} />
              </div>
              <h2 className="mt-4 text-3xl leading-tight font-extrabold">{jobQuery.data.title}</h2>

              <dl className="mt-6 grid gap-4 rounded-2xl bg-secondary p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays
                    aria-hidden="true"
                    className="mt-0.5 size-6 shrink-0 text-primary"
                  />
                  <div>
                    <dt className="text-sm font-bold text-muted-foreground">Data e horário</dt>
                    <dd className="text-base font-extrabold">
                      {formatJobDate(jobQuery.data.startsAt)}, às{' '}
                      {formatJobTime(jobQuery.data.startsAt)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
                  <div>
                    <dt className="text-sm font-bold text-muted-foreground">Duração</dt>
                    <dd className="text-base font-extrabold">
                      {formatDuration(jobQuery.data.durationMinutes)}
                    </dd>
                  </div>
                </div>
              </dl>

              <section
                aria-labelledby="description-heading"
                className="mt-7 border-t border-border pt-6"
              >
                <h3
                  className="flex items-center gap-2 text-lg font-extrabold"
                  id="description-heading"
                >
                  <BriefcaseBusiness aria-hidden="true" className="size-5 text-primary" />O que
                  precisa ser feito
                </h3>
                <p className="mt-3 text-base leading-relaxed whitespace-pre-line text-muted-foreground">
                  {jobQuery.data.description}
                </p>
              </section>

              <section
                aria-labelledby="location-heading"
                className="mt-7 border-t border-border pt-6"
              >
                <h3
                  className="flex items-center gap-2 text-lg font-extrabold"
                  id="location-heading"
                >
                  <MapPin aria-hidden="true" className="size-5 text-primary" />
                  Local do trabalho
                </h3>
                <p className="mt-3 text-base font-extrabold">{jobQuery.data.local.name}</p>
                <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                  {formatAddress(jobQuery.data.local)}
                </p>
              </section>

              <section
                aria-labelledby="contractor-heading"
                className="mt-7 border-t border-border pt-6"
              >
                <h3 className="text-lg font-extrabold" id="contractor-heading">
                  Quem está contratando
                </h3>
                <Button asChild className="mt-3 w-full" variant="outline">
                  <Link to={`/perfis/${jobQuery.data.local.ownerId}`}>
                    <UserRound aria-hidden="true" />
                    Ver perfil do contratante
                  </Link>
                </Button>
              </section>

              {acceptance.state !== 'idle' ? (
                <div className="mt-7">
                  <AcceptancePanel
                    error={acceptance.error}
                    onTryAgain={acceptance.tryAgain}
                    state={acceptance.state}
                  />
                </div>
              ) : null}
            </div>

            {acceptance.state === 'idle' && availability === 'available' ? (
              <div className="safe-area-bottom sticky bottom-0 mt-auto border-t border-border bg-card/95 px-5 pt-4 backdrop-blur">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={!acceptance.isOnline} size="lg">
                      {acceptance.isOnline ? 'Quero este trabalho' : 'Sem conexão'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Quer aceitar este trabalho?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao confirmar, seu pedido entrará na fila. Outra pessoa pode estar tentando
                        ao mesmo tempo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction onClick={acceptance.submitAcceptance}>
                        Sim, quero este trabalho
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </MobileShell>
  );
}

export { JobDetailsPage };
