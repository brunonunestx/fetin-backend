import { useQuery } from '@tanstack/react-query';
import { CalendarCheck2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { LoadingList } from '@/components/shared/loading-list';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState, StatePanel } from '@/components/shared/state-panel';
import type { AcceptedJob } from '@/features/accepted-jobs/accepted-job-types';
import { getAcceptedJobs } from '@/features/accepted-jobs/accepted-jobs-api';
import { acceptedJobsQueryKeys } from '@/features/accepted-jobs/accepted-jobs-query-keys';
import { groupAcceptedJobs } from '@/features/accepted-jobs/accepted-jobs-rules';
import { AcceptedJobCard } from '@/features/accepted-jobs/components/accepted-job-card';
import { useAuth } from '@/features/auth/use-auth';

function AcceptedJobsSection({
  jobs,
  title,
  upcoming,
}: {
  jobs: AcceptedJob[];
  title: string;
  upcoming: boolean;
}) {
  if (jobs.length === 0) {
    return null;
  }

  const headingId = upcoming ? 'upcoming-jobs-heading' : 'previous-jobs-heading';

  return (
    <section aria-labelledby={headingId} className="px-4 pb-7">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="text-lg font-extrabold" id={headingId}>
          {title}
        </h2>
        <span className="text-sm font-bold text-muted-foreground">{jobs.length}</span>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <AcceptedJobCard job={job} key={job.jobId} upcoming={upcoming} />
        ))}
      </div>
    </section>
  );
}

function AcceptedJobsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const acceptedJobsQuery = useQuery({
    queryFn: ({ signal }) => getAcceptedJobs(signal),
    queryKey: acceptedJobsQueryKeys.list(),
  });
  const groups = groupAcceptedJobs(acceptedJobsQuery.data ?? []);

  if (!user) {
    return null;
  }

  return (
    <MobileShell>
      <PageHeader title="Histórico" />
      <main className="flex flex-1 flex-col">
        <section className="px-5 pt-6 pb-5">
          <h2 className="text-3xl leading-tight font-extrabold">Seus trabalhos.</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Consulte os próximos serviços e relembre os trabalhos que já passaram.
          </p>
        </section>

        {acceptedJobsQuery.isPending ? <LoadingList count={3} /> : null}

        {acceptedJobsQuery.isError ? (
          <ErrorState
            action={{
              label: 'Tentar novamente',
              onClick: () => void acceptedJobsQuery.refetch(),
            }}
            description="Não conseguimos abrir seu histórico. Verifique sua conexão e tente novamente."
            title="Histórico indisponível"
          />
        ) : null}

        {acceptedJobsQuery.isSuccess && acceptedJobsQuery.data.length === 0 ? (
          <StatePanel
            action={{
              label: 'Procurar trabalhos',
              onClick: () => void navigate('/trabalhos'),
            }}
            description="Quando você conseguir um trabalho, ele ficará guardado aqui."
            icon={<CalendarCheck2 aria-hidden="true" className="size-8" />}
            title="Você ainda não tem trabalhos"
          />
        ) : null}

        {acceptedJobsQuery.isSuccess && acceptedJobsQuery.data.length > 0 ? (
          <>
            <AcceptedJobsSection jobs={groups.upcoming} title="Próximos trabalhos" upcoming />
            <AcceptedJobsSection
              jobs={groups.previous}
              title="Trabalhos anteriores"
              upcoming={false}
            />
          </>
        ) : null}
      </main>
      <AccountNavigation activeHref="/historico" type={user.type} />
    </MobileShell>
  );
}

export { AcceptedJobsPage };
