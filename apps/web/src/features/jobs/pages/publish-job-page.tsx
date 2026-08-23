import { useQuery } from '@tanstack/react-query';
import { MapPinned } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState, StatePanel } from '@/components/shared/state-panel';
import { useAuth } from '@/features/auth/use-auth';
import { PublishJobForm } from '@/features/jobs/components/publish-job-form';
import { listLocations } from '@/features/locals/locals-api';
import { localsQueryKeys } from '@/features/locals/locals-query-keys';

function PublishJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const locationsQuery = useQuery({
    queryFn: ({ signal }) => listLocations(signal),
    queryKey: localsQueryKeys.list(),
  });
  const requestedLocationId = searchParams.get('localId') ?? undefined;
  const initialLocationId = locationsQuery.data?.some(
    (location) => location.id === requestedLocationId,
  )
    ? requestedLocationId
    : undefined;

  if (!user) {
    return null;
  }

  return (
    <MobileShell>
      <PageHeader backHref="/painel" title="Nova vaga" />
      <main className="flex flex-1 flex-col px-5 py-6">
        {locationsQuery.isPending ? (
          <p className="py-10 text-center text-base font-bold text-muted-foreground">
            Carregando seus locais...
          </p>
        ) : null}

        {locationsQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void locationsQuery.refetch() }}
            description="Não conseguimos buscar seus locais."
            title="Não foi possível começar"
          />
        ) : null}

        {locationsQuery.isSuccess && locationsQuery.data.length === 0 ? (
          <StatePanel
            action={{
              label: 'Cadastrar um local',
              onClick: () => void navigate('/locais/novo'),
            }}
            description="Toda vaga precisa informar onde o trabalho será realizado."
            icon={<MapPinned aria-hidden="true" className="size-8" />}
            title="Cadastre um local primeiro"
          />
        ) : null}

        {locationsQuery.data && locationsQuery.data.length > 0 ? (
          <PublishJobForm
            initialLocationId={initialLocationId}
            locations={locationsQuery.data}
            onPublished={(job) => void navigate(`/painel/vagas/${job.id}`, { replace: true })}
            ownerId={user.userId}
          />
        ) : null}
      </main>
    </MobileShell>
  );
}

export { PublishJobPage };
