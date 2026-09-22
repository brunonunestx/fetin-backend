import { useQuery } from '@tanstack/react-query';
import { LocateFixed, LoaderCircle, Search, SearchX, X } from 'lucide-react';
import { useState } from 'react';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { LoadingList } from '@/components/shared/loading-list';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState, StatePanel } from '@/components/shared/state-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/use-auth';
import { JobCard } from '@/features/jobs/components/job-card';
import { listJobs } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import { getAvailableJobs, searchJobs } from '@/features/jobs/job-rules';
import { getGeolocationErrorMessage } from '@/lib/geolocation';
import { useCurrentLocation } from '@/lib/use-current-location';

function JobsListPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const currentLocation = useCurrentLocation();
  const nearbyMode = Boolean(currentLocation.coordinates);
  const jobsQuery = useQuery({
    queryFn: ({ signal }) => listJobs({ coordinates: currentLocation.coordinates, signal }),
    queryKey: jobsQueryKeys.list(currentLocation.coordinates),
  });
  const availableJobs = getAvailableJobs(
    jobsQuery.data ?? [],
    new Date(),
    nearbyMode ? 'distance' : 'date',
  );
  const visibleJobs = searchJobs(availableJobs, search);

  if (!user) {
    return null;
  }

  return (
    <MobileShell>
      <PageHeader title="Trabalhos" />
      <main className="flex flex-1 flex-col">
        <section className="px-5 pt-6 pb-4">
          <h2 className="text-3xl leading-tight font-extrabold">Encontre seu próximo serviço.</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Veja oportunidades disponíveis e escolha a que combina com você.
          </p>

          <div className="relative mt-5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-3.5 left-4 size-5 text-muted-foreground"
            />
            <Input
              aria-label="Buscar trabalhos"
              className="pr-12 pl-11"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Trabalho, profissão ou cidade"
              type="search"
              value={search}
            />
            {search ? (
              <Button
                aria-label="Limpar busca"
                className="absolute top-0 right-0"
                onClick={() => setSearch('')}
                size="icon"
                type="button"
                variant="ghost"
              >
                <SearchX aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <LocateFixed aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold">
                  {nearbyMode ? 'Mais perto de você' : 'Quer ver o que está mais perto?'}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {nearbyMode
                    ? 'As vagas com localização estão ordenadas da mais próxima para a mais distante.'
                    : 'Sua localização será usada somente nesta busca e não ficará salva.'}
                </p>
              </div>
            </div>

            {nearbyMode ? (
              <Button
                className="mt-3 w-full"
                onClick={currentLocation.clear}
                type="button"
                variant="outline"
              >
                <X aria-hidden="true" />
                Ver todas as vagas
              </Button>
            ) : (
              <Button
                className="mt-3 w-full"
                disabled={currentLocation.status === 'loading'}
                onClick={() => void currentLocation.request()}
                type="button"
                variant="outline"
              >
                {currentLocation.status === 'loading' ? (
                  <>
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                    Buscando localização...
                  </>
                ) : (
                  <>
                    <LocateFixed aria-hidden="true" />
                    {currentLocation.status === 'error'
                      ? 'Tentar localização novamente'
                      : 'Mais perto de mim'}
                  </>
                )}
              </Button>
            )}

            {currentLocation.status === 'error' ? (
              <p className="mt-3 text-sm font-bold text-destructive" role="alert">
                {getGeolocationErrorMessage(currentLocation.error)}
              </p>
            ) : null}
          </div>
        </section>

        {jobsQuery.isPending ? <LoadingList count={4} /> : null}

        {jobsQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void jobsQuery.refetch() }}
            description="Não conseguimos buscar os trabalhos. Verifique sua conexão e tente novamente."
            title="Trabalhos indisponíveis"
          />
        ) : null}

        {jobsQuery.isSuccess && availableJobs.length === 0 && nearbyMode ? (
          <StatePanel
            action={{ label: 'Ver todas as vagas', onClick: currentLocation.clear }}
            description="Alguns locais ainda não têm uma posição cadastrada. Você pode voltar para a lista completa."
            title="Nenhuma vaga com localização encontrada"
          />
        ) : null}

        {jobsQuery.isSuccess && availableJobs.length === 0 && !nearbyMode ? (
          <StatePanel
            description="Quando uma nova oportunidade for publicada, ela aparecerá aqui."
            title="Nenhum trabalho disponível agora"
          />
        ) : null}

        {jobsQuery.isSuccess && availableJobs.length > 0 && visibleJobs.length === 0 ? (
          <StatePanel
            action={{ label: 'Limpar busca', onClick: () => setSearch('') }}
            description="Tente buscar outra profissão ou cidade."
            title="Nenhum resultado encontrado"
          />
        ) : null}

        {visibleJobs.length > 0 ? (
          <section aria-labelledby="available-heading" className="px-4 pb-6">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h2 className="text-lg font-extrabold" id="available-heading">
                {nearbyMode ? 'Mais perto primeiro' : 'Disponíveis agora'}
              </h2>
              <span className="text-sm font-bold text-muted-foreground">
                {visibleJobs.length} {visibleJobs.length === 1 ? 'oportunidade' : 'oportunidades'}
              </span>
            </div>
            <div className="space-y-3">
              {visibleJobs.map((job) => (
                <JobCard job={job} key={job.id} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <AccountNavigation activeHref="/trabalhos" type={user.type} />
    </MobileShell>
  );
}

export { JobsListPage };
