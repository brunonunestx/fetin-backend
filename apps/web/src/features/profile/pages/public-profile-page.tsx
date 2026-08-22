import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { ErrorState } from '@/components/shared/state-panel';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { homeRouteByUserType } from '@/features/auth/auth-types';
import { useAuth } from '@/features/auth/use-auth';
import { getPublicProfile } from '@/features/profile/profile-api';
import { ProfileSummary } from '@/features/profile/components/profile-summary';
import { profileQueryKeys } from '@/features/profile/profile-query-keys';
import { isApiError } from '@/lib/api/api-error';

function PublicProfileLoading() {
  return (
    <div aria-label="Carregando perfil" className="flex flex-col items-center px-5 py-8">
      <Skeleton className="size-20 rounded-full" />
      <Skeleton className="mt-5 h-7 w-24" />
      <Skeleton className="mt-3 h-9 w-52" />
      <Skeleton className="mt-8 h-28 w-full rounded-2xl" />
    </div>
  );
}

function PublicProfilePage() {
  const { user } = useAuth();
  const { userId = '' } = useParams();
  const profileQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => getPublicProfile(userId),
    queryKey: profileQueryKeys.public(userId),
  });
  const backHref = user ? homeRouteByUserType[user.type] : '/';

  return (
    <MobileShell>
      <PageHeader backHref={backHref} title="Perfil" />
      <main className="flex flex-1 flex-col">
        {profileQuery.isPending ? <PublicProfileLoading /> : null}
        {profileQuery.isError ? (
          <ErrorState
            action={{ label: 'Tentar novamente', onClick: () => void profileQuery.refetch() }}
            description={
              isApiError(profileQuery.error) && profileQuery.error.code === 'USER_NOT_FOUND'
                ? 'Esse perfil não está mais disponível.'
                : 'Não conseguimos abrir este perfil. Verifique sua conexão e tente novamente.'
            }
            title="Perfil indisponível"
          />
        ) : null}
        {profileQuery.data ? <ProfileSummary profile={profileQuery.data} /> : null}
      </main>
    </MobileShell>
  );
}

export { PublicProfilePage };
