import { useQuery } from '@tanstack/react-query';
import { MapPinned, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { LoadingList } from '@/components/shared/loading-list';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState, StatePanel } from '@/components/shared/state-panel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { LocationCard } from '@/features/locals/components/location-card';
import { listLocations } from '@/features/locals/locals-api';
import { localsQueryKeys } from '@/features/locals/locals-query-keys';

function LocationsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationsQuery = useQuery({
    queryFn: ({ signal }) => listLocations(signal),
    queryKey: localsQueryKeys.list(),
  });

  if (!user) {
    return null;
  }

  return (
    <MobileShell bottomNavigation={<AccountNavigation activeHref="/locais" type={user.type} />}>
      <PageHeader
        action={
          <Button asChild size="sm">
            <Link to="/locais/novo">
              <Plus aria-hidden="true" />
              Novo
            </Link>
          </Button>
        }
        title="Meus locais"
      />
      <main className="flex flex-1 flex-col">
        <section className="px-5 pt-6 pb-5 sm:px-6 lg:px-8 lg:pt-8">
          <h2 className="text-3xl leading-tight font-extrabold lg:text-4xl">
            Onde o trabalho acontece?
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Cadastre seus endereços para publicar vagas no local certo.
          </p>
        </section>

        {locationsQuery.isPending ? <LoadingList count={3} /> : null}

        {locationsQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void locationsQuery.refetch() }}
            description="Não conseguimos buscar seus locais. Verifique sua conexão e tente novamente."
            title="Locais indisponíveis"
          />
        ) : null}

        {locationsQuery.isSuccess && locationsQuery.data.length === 0 ? (
          <StatePanel
            action={{
              label: 'Cadastrar meu primeiro local',
              onClick: () => void navigate('/locais/novo'),
            }}
            description="Você precisa de um local antes de publicar seu primeiro trabalho."
            icon={<MapPinned aria-hidden="true" className="size-8" />}
            title="Nenhum local cadastrado"
          />
        ) : null}

        {locationsQuery.data && locationsQuery.data.length > 0 ? (
          <section aria-labelledby="locations-heading" className="px-4 pb-7 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h2 className="text-lg font-extrabold" id="locations-heading">
                Locais cadastrados
              </h2>
              <span className="text-sm font-bold text-muted-foreground">
                {locationsQuery.data.length}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {locationsQuery.data.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </MobileShell>
  );
}

export { LocationsListPage };
