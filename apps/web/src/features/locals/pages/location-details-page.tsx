import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { LoadingList } from '@/components/shared/loading-list';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState, StatePanel } from '@/components/shared/state-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { formatAddress } from '@/features/jobs/job-formatters';
import { listJobs } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import { LocalJobSummary } from '@/features/locals/components/local-job-summary';
import { getLocation } from '@/features/locals/locals-api';
import { localsQueryKeys } from '@/features/locals/locals-query-keys';

function LocationDetailsLoading() {
  return (
    <div aria-label="Carregando local" className="space-y-4 px-5 py-7">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="mt-8 h-28 w-full rounded-2xl" />
    </div>
  );
}

function LocationDetailsPage() {
  const { user } = useAuth();
  const { locationId = '' } = useParams();
  const locationQuery = useQuery({
    enabled: Boolean(locationId),
    queryFn: ({ signal }) => getLocation(locationId, signal),
    queryKey: localsQueryKeys.detail(locationId),
  });
  const jobsQuery = useQuery({
    enabled: Boolean(locationId) && locationQuery.isSuccess,
    queryFn: ({ signal }) => listJobs({ localId: locationId, signal }),
    queryKey: jobsQueryKeys.localList(locationId),
  });

  return (
    <MobileShell
      bottomNavigation={
        user ? <AccountNavigation activeHref="/locais" desktopOnly type={user.type} /> : null
      }
    >
      <PageHeader backHref="/locais" title="Detalhes do local" />
      <main className="flex flex-1 flex-col">
        {locationQuery.isPending ? <LocationDetailsLoading /> : null}

        {locationQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void locationQuery.refetch() }}
            description="Não conseguimos abrir este local. Verifique sua conexão e tente novamente."
            title="Local indisponível"
          />
        ) : null}

        {locationQuery.data ? (
          <div className="lg:grid lg:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)]">
            <section className="px-5 py-7 sm:px-6 lg:px-8 lg:py-10">
              <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <MapPin aria-hidden="true" className="size-6" />
              </span>
              <h2 className="mt-4 text-3xl leading-tight font-extrabold">
                {locationQuery.data.name}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {formatAddress(locationQuery.data)}
              </p>
              <Button asChild className="mt-5 w-full">
                <Link to={`/painel/vagas/nova?localId=${locationQuery.data.id}`}>
                  Publicar vaga neste local
                </Link>
              </Button>
            </section>

            <section
              aria-labelledby="local-jobs-heading"
              className="border-t border-border pt-6 lg:border-t-0 lg:border-l lg:py-10"
            >
              <div className="flex items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
                <div>
                  <p className="text-sm font-extrabold tracking-wide text-primary uppercase">
                    Neste endereço
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold" id="local-jobs-heading">
                    Vagas cadastradas
                  </h2>
                </div>
                {jobsQuery.data ? (
                  <span className="text-sm font-bold text-muted-foreground">
                    {jobsQuery.data.length}
                  </span>
                ) : null}
              </div>

              {jobsQuery.isPending ? <LoadingList count={2} /> : null}

              {jobsQuery.isError ? (
                <ErrorState
                  action={{ label: 'Tentar novamente', onClick: () => void jobsQuery.refetch() }}
                  description="Não conseguimos buscar as vagas deste local."
                  title="Vagas indisponíveis"
                />
              ) : null}

              {jobsQuery.isSuccess && jobsQuery.data.length === 0 ? (
                <StatePanel
                  description="As vagas publicadas neste endereço aparecerão aqui."
                  title="Nenhuma vaga neste local"
                />
              ) : null}

              {jobsQuery.data && jobsQuery.data.length > 0 ? (
                <div className="grid gap-3 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-2">
                  {jobsQuery.data.map((job) => (
                    <LocalJobSummary job={job} key={job.id} />
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </main>
    </MobileShell>
  );
}

export { LocationDetailsPage };
