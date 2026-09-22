import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BriefcaseBusiness, LoaderCircle, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { JobCandidate } from '@/features/jobs/job-types';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { getPublicProfile } from '@/features/profile/profile-api';
import { profileQueryKeys } from '@/features/profile/profile-query-keys';

type CandidateProfileCardProps = {
  candidate: JobCandidate;
  disabled: boolean;
  isSelecting: boolean;
  onSelect: () => void;
};

function CandidateProfileCard({
  candidate,
  disabled,
  isSelecting,
  onSelect,
}: CandidateProfileCardProps) {
  const profileQuery = useQuery({
    queryFn: () => getPublicProfile(candidate.operatorId),
    queryKey: profileQueryKeys.public(candidate.operatorId),
  });

  if (profileQuery.isPending) {
    return (
      <div aria-label="Carregando candidato" className="rounded-2xl border border-border p-4">
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
        <p className="font-bold text-destructive">Não conseguimos abrir este candidato.</p>
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

  const candidateName = profileQuery.data.name ?? 'Perfil sem nome';

  return (
    <article aria-label={`Candidato: ${candidateName}`} className="rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <ProfileAvatar className="size-14" name={profileQuery.data.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="truncate text-lg font-extrabold">{candidateName}</h4>
            {candidate.status === 'rejected' ? (
              <Badge variant="secondary">Não escolhido</Badge>
            ) : null}
          </div>
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
        <Link to={`/perfis/${candidate.operatorId}`}>
          Ver perfil completo
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>

      {candidate.status === 'pending' ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="mt-3 w-full" disabled={disabled} size="sm">
              {isSelecting ? (
                <>
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                  Confirmando escolha...
                </>
              ) : (
                <>
                  <UserRoundCheck aria-hidden="true" />
                  Escolher trabalhador
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Escolher {candidateName}?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa pessoa ficará com a vaga e os outros candidatos serão avisados de que não foram
                escolhidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={onSelect}>Sim, escolher trabalhador</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </article>
  );
}

export { CandidateProfileCard };
