import { useNavigate } from 'react-router';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { homeRouteByUserType } from '@/features/auth/auth-types';
import { useAuth } from '@/features/auth/use-auth';
import { ProfileForm } from '@/features/profile/components/profile-form';

function OnboardingPage() {
  const navigate = useNavigate();
  const { logout, profile, user } = useAuth();

  if (!profile || !user) {
    return null;
  }

  const isWorker = user.type === 'operator';

  return (
    <MobileShell>
      <PageHeader title="Complete seu perfil" />
      <main className="flex-1 px-5 py-6">
        <p className="text-sm font-extrabold tracking-wide text-primary uppercase">
          Só falta uma etapa
        </p>
        <h2 className="mt-2 text-3xl leading-tight font-extrabold">
          {isWorker ? 'Conte qual trabalho você faz.' : 'Como podemos chamar você?'}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {isWorker
            ? 'Essas informações ajudam quem está contratando a conhecer você.'
            : 'Precisamos apenas dos dados essenciais para identificar seu perfil.'}
        </p>

        <div className="mt-7">
          <ProfileForm
            onSaved={() => {
              void navigate(homeRouteByUserType[user.type], { replace: true });
            }}
            profile={profile}
            submitLabel="Concluir meu perfil"
            type={user.type}
          />
        </div>

        <Button className="mt-4 w-full" onClick={logout} type="button" variant="link">
          Sair e continuar depois
        </Button>
      </main>
    </MobileShell>
  );
}

export { OnboardingPage };
