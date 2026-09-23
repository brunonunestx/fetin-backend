import { useNavigate } from 'react-router';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/features/auth/use-auth';
import { LocalForm } from '@/features/locals/components/local-form';

function NewLocationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <MobileShell
      bottomNavigation={<AccountNavigation activeHref="/locais" desktopOnly type={user.type} />}
    >
      <PageHeader backHref="/locais" title="Novo local" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6 sm:px-6 lg:py-10">
        <p className="text-sm font-extrabold tracking-wide text-primary uppercase">
          Endereço do serviço
        </p>
        <h2 className="mt-2 text-3xl leading-tight font-extrabold">Cadastre um local.</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Essas informações ajudam o trabalhador a saber onde deverá ir.
        </p>

        <div className="mt-7">
          <LocalForm
            onCreated={(location) => {
              void navigate(`/locais/${location.id}`, { replace: true });
            }}
          />
        </div>
      </main>
    </MobileShell>
  );
}

export { NewLocationPage };
