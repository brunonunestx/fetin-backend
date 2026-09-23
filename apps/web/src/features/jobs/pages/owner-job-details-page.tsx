import { useQuery } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState, StatePanel } from '@/components/shared/state-panel';
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
import { FormError } from '@/features/auth/components/form-error';
import { useAuth } from '@/features/auth/use-auth';
import { CandidateProfileCard } from '@/features/jobs/components/candidate-profile-card';
import { WinnerProfileCard } from '@/features/jobs/components/winner-profile-card';
import {
  formatAddress,
  formatCurrency,
  formatDuration,
  formatJobDate,
  formatJobTime,
} from '@/features/jobs/job-formatters';
import { getJob, listJobCandidates } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import { getJobAvailability } from '@/features/jobs/job-rules';
import {
  useCancelJobMutation,
  useConfirmCandidateMutation,
} from '@/features/jobs/owner-job-mutations';
import { useOwnerJobStatus } from '@/features/jobs/use-owner-job-status';

function OwnerJobDetailsLoading() {
  return (
    <div
      aria-label="Carregando vaga"
      className="mx-auto w-full max-w-6xl space-y-5 px-5 py-7 sm:px-6 lg:px-8"
    >
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}

function OwnerJobDetailsPage() {
  const [openedAt] = useState(() => Date.now());
  const { user } = useAuth();
  const { jobId = '' } = useParams();
  const jobQuery = useQuery({
    enabled: Boolean(jobId),
    queryFn: ({ signal }) => getJob(jobId, signal),
    queryKey: jobsQueryKeys.detail(jobId),
  });
  const belongsToOwner = Boolean(jobQuery.data && jobQuery.data.local.ownerId === user?.userId);
  const availability = jobQuery.data ? getJobAvailability(jobQuery.data) : null;
  const shouldTrackWinner =
    belongsToOwner && (availability === 'available' || availability === 'filled');
  const statusQuery = useOwnerJobStatus(jobId, shouldTrackWinner);
  const candidatesQuery = useQuery({
    enabled: Boolean(jobId && belongsToOwner),
    queryFn: ({ signal }) => listJobCandidates(jobId, signal),
    queryKey: jobsQueryKeys.candidates(jobId),
    refetchInterval: availability === 'available' ? 4_000 : false,
  });
  const cancelMutation = useCancelJobMutation();
  const confirmCandidateMutation = useConfirmCandidateMutation(jobId);
  const candidates = candidatesQuery.data ?? [];
  const confirmedCandidate = candidates.find((candidate) => candidate.status === 'confirmed');
  const winnerId =
    statusQuery.data?.status === 'finished'
      ? statusQuery.data.operatorId
      : confirmedCandidate?.operatorId;
  const remainingCandidates = candidates.filter((candidate) => candidate.operatorId !== winnerId);
  const canCancel = Boolean(
    jobQuery.data && !jobQuery.data.cancelledAt && Date.parse(jobQuery.data.startsAt) > openedAt,
  );

  return (
    <MobileShell
      bottomNavigation={
        user ? <AccountNavigation activeHref="/painel" desktopOnly type={user.type} /> : null
      }
    >
      <PageHeader backHref="/painel" title="Acompanhar vaga" />
      <main className="flex flex-1 flex-col">
        {jobQuery.isPending ? <OwnerJobDetailsLoading /> : null}

        {jobQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void jobQuery.refetch() }}
            description="Não conseguimos abrir esta vaga. Verifique sua conexão e tente novamente."
            title="Vaga indisponível"
          />
        ) : null}

        {jobQuery.data && !belongsToOwner ? (
          <StatePanel
            description="Você só pode acompanhar vagas publicadas pela sua conta."
            title="Esta vaga não pertence a você"
          />
        ) : null}

        {jobQuery.data && belongsToOwner && availability ? (
          <>
            <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:px-8 lg:py-10">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-3xl font-extrabold text-primary">
                    {formatCurrency(jobQuery.data.value)}
                  </strong>
                  <StatusBadge status={availability} />
                </div>
                <h2 className="mt-4 text-3xl leading-tight font-extrabold">
                  {jobQuery.data.title}
                </h2>

                <dl className="mt-6 grid gap-4 rounded-2xl bg-secondary p-4 sm:grid-cols-2 sm:p-5">
                  <div className="flex items-start gap-3">
                    <CalendarDays
                      aria-hidden="true"
                      className="mt-0.5 size-6 shrink-0 text-primary"
                    />
                    <div>
                      <dt className="text-sm font-bold text-muted-foreground">Data e horário</dt>
                      <dd className="font-extrabold">
                        {formatJobDate(jobQuery.data.startsAt)}, às{' '}
                        {formatJobTime(jobQuery.data.startsAt)}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock3 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
                    <div>
                      <dt className="text-sm font-bold text-muted-foreground">Duração</dt>
                      <dd className="font-extrabold">
                        {formatDuration(jobQuery.data.durationMinutes)}
                      </dd>
                    </div>
                  </div>
                </dl>

                <section
                  className="mt-7 border-t border-border pt-6"
                  aria-labelledby="owner-description-heading"
                >
                  <h3
                    className="flex items-center gap-2 text-lg font-extrabold"
                    id="owner-description-heading"
                  >
                    <BriefcaseBusiness aria-hidden="true" className="size-5 text-primary" />
                    Trabalho publicado
                  </h3>
                  <p className="mt-3 text-base leading-relaxed whitespace-pre-line text-muted-foreground">
                    {jobQuery.data.description}
                  </p>
                </section>

                <section
                  className="mt-7 border-t border-border pt-6"
                  aria-labelledby="owner-location-heading"
                >
                  <h3
                    className="flex items-center gap-2 text-lg font-extrabold"
                    id="owner-location-heading"
                  >
                    <MapPin aria-hidden="true" className="size-5 text-primary" />
                    Local
                  </h3>
                  <Button asChild className="mt-3 w-full justify-between" variant="outline">
                    <Link to={`/locais/${jobQuery.data.localId}`}>
                      <span className="min-w-0 text-left">
                        <strong className="block truncate">{jobQuery.data.local.name}</strong>
                        <span className="block truncate text-sm font-normal text-muted-foreground">
                          {formatAddress(jobQuery.data.local)}
                        </span>
                      </span>
                    </Link>
                  </Button>
                </section>
              </div>

              <section
                className="mt-7 border-t border-border pt-6 lg:sticky lg:top-28 lg:mt-0 lg:rounded-2xl lg:border lg:bg-card lg:p-5 lg:shadow-sm"
                aria-labelledby="tracking-heading"
              >
                <h3
                  className="flex items-center gap-2 text-lg font-extrabold"
                  id="tracking-heading"
                >
                  <UsersRound aria-hidden="true" className="size-5 text-primary" />
                  Candidatos {candidates.length > 0 ? `(${candidates.length})` : null}
                </h3>

                {candidatesQuery.isPending ? (
                  <p className="mt-3 flex items-center gap-2 font-bold text-muted-foreground">
                    <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                    Carregando candidatos...
                  </p>
                ) : null}

                {candidatesQuery.isError ? (
                  <div className="mt-3 rounded-2xl border border-destructive/25 bg-destructive/8 p-4">
                    <p className="font-bold text-destructive">
                      Não conseguimos carregar os candidatos.
                    </p>
                    <Button
                      className="mt-3"
                      onClick={() => void candidatesQuery.refetch()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : null}

                {candidatesQuery.isSuccess && candidates.length === 0 && !winnerId ? (
                  <div className="mt-3 rounded-2xl border border-warning bg-warning p-4 text-warning-foreground">
                    <h4 className="font-extrabold">Nenhuma candidatura ainda</h4>
                    <p className="mt-1 text-sm leading-relaxed">
                      Quando alguém demonstrar interesse, o perfil aparecerá aqui automaticamente.
                    </p>
                  </div>
                ) : null}

                {statusQuery.isError && shouldTrackWinner ? (
                  <div className="mt-3 rounded-2xl border border-destructive/25 bg-destructive/8 p-4">
                    <p className="font-bold text-destructive">
                      Não conseguimos atualizar o acompanhamento.
                    </p>
                    <Button
                      className="mt-3"
                      onClick={() => void statusQuery.refetch()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : null}

                {availability === 'filled' && statusQuery.isPending && !winnerId ? (
                  <p className="mt-3 flex items-center gap-2 font-bold text-muted-foreground">
                    <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                    Carregando trabalhador...
                  </p>
                ) : null}

                {winnerId ? (
                  <div className="mt-3">
                    <WinnerProfileCard operatorId={winnerId} />
                  </div>
                ) : null}

                {remainingCandidates.length > 0 ? (
                  <div className="mt-3 grid gap-3" aria-label="Lista de candidatos">
                    {winnerId ? <h4 className="pt-2 font-extrabold">Outros candidatos</h4> : null}
                    {remainingCandidates.map((candidate) => (
                      <CandidateProfileCard
                        candidate={candidate}
                        disabled={
                          availability !== 'available' ||
                          Boolean(winnerId) ||
                          confirmCandidateMutation.isPending ||
                          confirmCandidateMutation.isSuccess
                        }
                        isSelecting={
                          confirmCandidateMutation.variables === candidate.operatorId &&
                          (confirmCandidateMutation.isPending || confirmCandidateMutation.isSuccess)
                        }
                        key={candidate.operatorId}
                        onSelect={() => confirmCandidateMutation.mutate(candidate.operatorId)}
                      />
                    ))}
                  </div>
                ) : null}

                {confirmCandidateMutation.error ? (
                  <div className="mt-3">
                    <FormError error={confirmCandidateMutation.error} />
                  </div>
                ) : null}

                {availability === 'cancelled' ? (
                  <p className="mt-3 rounded-2xl bg-muted p-4 font-bold text-muted-foreground">
                    Esta vaga foi cancelada e não recebe mais candidaturas.
                  </p>
                ) : null}

                {availability === 'ended' ? (
                  <p className="mt-3 rounded-2xl bg-muted p-4 font-bold text-muted-foreground">
                    A data desta vaga passou sem um trabalhador confirmado.
                  </p>
                ) : null}
              </section>

              {cancelMutation.error ? (
                <div className="mt-6">
                  <FormError error={cancelMutation.error} />
                </div>
              ) : null}
            </div>

            {canCancel ? (
              <div className="safe-area-bottom sticky bottom-0 mt-auto border-t border-border bg-card/95 px-5 pt-4 backdrop-blur sm:px-6 lg:static lg:mx-auto lg:w-full lg:max-w-6xl lg:border-t-0 lg:bg-transparent lg:px-8 lg:pt-0 lg:pb-8 lg:backdrop-blur-none">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full lg:ml-auto lg:max-w-sm"
                      disabled={cancelMutation.isPending}
                      variant="destructive"
                    >
                      {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar vaga'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar esta vaga?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ela deixará de receber candidaturas. Esta ação não poderá ser desfeita pelo
                        aplicativo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter vaga</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground shadow-[0_3px_0_#821b13] hover:bg-[#9d2017]"
                        onClick={() => cancelMutation.mutate(jobId)}
                      >
                        Sim, cancelar vaga
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

export { OwnerJobDetailsPage };
