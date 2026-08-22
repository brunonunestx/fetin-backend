import { useQuery } from '@tanstack/react-query';
import { Search, SearchX } from 'lucide-react';
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

function JobsListPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const jobsQuery = useQuery({
    queryFn: ({ signal }) => listJobs(signal),
    queryKey: jobsQueryKeys.list(),
  });
  const availableJobs = getAvailableJobs(jobsQuery.data ?? []);
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
        </section>

        {jobsQuery.isPending ? <LoadingList count={4} /> : null}

        {jobsQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void jobsQuery.refetch() }}
            description="Não conseguimos buscar os trabalhos. Verifique sua conexão e tente novamente."
            title="Trabalhos indisponíveis"
          />
        ) : null}

        {jobsQuery.isSuccess && availableJobs.length === 0 ? (
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
                Disponíveis agora
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
