import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness, CircleX, Plus, UserRoundCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { LoadingList } from '@/components/shared/loading-list';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState, StatePanel } from '@/components/shared/state-panel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { OwnerJobCard } from '@/features/jobs/components/owner-job-card';
import { listJobs } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import {
  filterOwnerJobs,
  getOwnerJobCounts,
  type OwnerJobFilter,
} from '@/features/jobs/owner-job-rules';
import { cn } from '@/lib/utils';

const filters: { label: string; value: OwnerJobFilter }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Abertas', value: 'available' },
  { label: 'Preenchidas', value: 'filled' },
  { label: 'Canceladas', value: 'cancelled' },
  { label: 'Encerradas', value: 'ended' },
];

function OwnerJobsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<OwnerJobFilter>('all');
  const jobsQuery = useQuery({
    enabled: Boolean(user),
    queryFn: ({ signal }) => listJobs({ signal }),
    queryKey: jobsQueryKeys.ownerList(user?.userId ?? ''),
  });
  const ownerJobs = (jobsQuery.data ?? []).filter((job) => job.local.ownerId === user?.userId);
  const counts = getOwnerJobCounts(ownerJobs);
  const visibleJobs = filterOwnerJobs(ownerJobs, filter);

  if (!user) {
    return null;
  }

  return (
    <MobileShell bottomNavigation={<AccountNavigation activeHref="/painel" type={user.type} />}>
      <PageHeader
        action={
          <Button asChild size="sm">
            <Link to="/painel/vagas/nova">
              <Plus aria-hidden="true" />
              Nova vaga
            </Link>
          </Button>
        }
        title="Painel"
      />
      <main className="flex flex-1 flex-col">
        <section className="px-5 pt-6 pb-5 sm:px-6 lg:px-8 lg:pt-8">
          <h2 className="text-3xl leading-tight font-extrabold lg:text-4xl">
            Acompanhe suas vagas.
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Publique trabalhos e veja rapidamente o que está acontecendo.
          </p>
        </section>

        {jobsQuery.isPending ? <LoadingList count={4} /> : null}

        {jobsQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void jobsQuery.refetch() }}
            description="Não conseguimos buscar suas vagas. Verifique sua conexão e tente novamente."
            title="Painel indisponível"
          />
        ) : null}

        {jobsQuery.isSuccess ? (
          <>
            <section
              aria-label="Resumo das vagas"
              className="grid grid-cols-3 gap-2 px-4 pb-6 sm:px-6 lg:max-w-3xl lg:gap-4 lg:px-8"
            >
              <div className="rounded-2xl bg-secondary p-3 text-center text-secondary-foreground">
                <BriefcaseBusiness aria-hidden="true" className="mx-auto size-5 text-primary" />
                <strong className="mt-1 block text-2xl font-extrabold">{counts.available}</strong>
                <span className="text-xs font-bold">Abertas</span>
              </div>
              <div className="rounded-2xl bg-success p-3 text-center text-success-foreground">
                <UserRoundCheck aria-hidden="true" className="mx-auto size-5" />
                <strong className="mt-1 block text-2xl font-extrabold">{counts.filled}</strong>
                <span className="text-xs font-bold">Preenchidas</span>
              </div>
              <div className="rounded-2xl bg-muted p-3 text-center text-muted-foreground">
                <CircleX aria-hidden="true" className="mx-auto size-5" />
                <strong className="mt-1 block text-2xl font-extrabold">{counts.cancelled}</strong>
                <span className="text-xs font-bold">Canceladas</span>
              </div>
            </section>

            {ownerJobs.length === 0 ? (
              <StatePanel
                action={{
                  label: 'Publicar primeira vaga',
                  onClick: () => void navigate('/painel/vagas/nova'),
                }}
                description="Quando você publicar um trabalho, poderá acompanhar tudo por aqui."
                icon={<BriefcaseBusiness aria-hidden="true" className="size-8" />}
                title="Nenhuma vaga publicada"
              />
            ) : (
              <section aria-labelledby="owner-jobs-heading" className="pb-7">
                <div className="px-4 sm:px-6 lg:px-8">
                  <h2 className="px-1 text-lg font-extrabold" id="owner-jobs-heading">
                    Suas vagas
                  </h2>
                  <div
                    aria-label="Filtrar vagas"
                    className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0"
                    role="group"
                  >
                    {filters.map((item) => (
                      <Button
                        aria-pressed={filter === item.value}
                        className={cn('min-h-11', filter === item.value && 'pointer-events-none')}
                        key={item.value}
                        onClick={() => setFilter(item.value)}
                        size="sm"
                        type="button"
                        variant={filter === item.value ? 'default' : 'outline'}
                      >
                        {item.label}
                        <span aria-hidden="true">
                          {item.value === 'all' ? counts.all : counts[item.value]}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {visibleJobs.length === 0 ? (
                  <StatePanel
                    action={{ label: 'Ver todas', onClick: () => setFilter('all') }}
                    description="Não há vagas com esse status."
                    title="Nenhuma vaga encontrada"
                  />
                ) : (
                  <div className="grid gap-3 px-4 pt-3 sm:px-6 md:grid-cols-2 lg:px-8 2xl:grid-cols-3">
                    {visibleJobs.map((job) => (
                      <OwnerJobCard job={job} key={job.id} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        ) : null}
      </main>
    </MobileShell>
  );
}

export { OwnerJobsPage };
