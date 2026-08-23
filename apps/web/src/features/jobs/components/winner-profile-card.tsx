import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { getPublicProfile } from '@/features/profile/profile-api';
import { profileQueryKeys } from '@/features/profile/profile-query-keys';

function WinnerProfileCard({ operatorId }: { operatorId: string }) {
  const profileQuery = useQuery({
    queryFn: () => getPublicProfile(operatorId),
    queryKey: profileQueryKeys.public(operatorId),
  });

  if (profileQuery.isPending) {
    return (
      <div aria-label="Carregando trabalhador" className="rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/8 p-4">
        <p className="font-bold text-destructive">Não conseguimos abrir o perfil agora.</p>
        <Button
          className="mt-3"
          onClick={() => void profileQuery.refetch()}
          size="sm"
          type="button"
          variant="outline"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <article
      aria-label="Trabalhador confirmado"
      className="rounded-2xl border border-success bg-success/15 p-4"
    >
      <div className="flex items-center gap-3">
        <ProfileAvatar className="size-14" name={profileQuery.data.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-extrabold">
            {profileQuery.data.name ?? 'Perfil sem nome'}
          </h3>
          {profileQuery.data.position ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-primary">
              <BriefcaseBusiness aria-hidden="true" className="size-4" />
              {profileQuery.data.position}
            </p>
          ) : null}
        </div>
      </div>
      {profileQuery.data.bio ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {profileQuery.data.bio}
        </p>
      ) : null}
      <Button asChild className="mt-4 w-full" size="sm" variant="outline">
        <Link to={`/perfis/${operatorId}`}>
          Ver perfil completo
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}

export { WinnerProfileCard };
