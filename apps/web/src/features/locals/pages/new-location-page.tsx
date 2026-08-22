import { useNavigate } from 'react-router';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { LocalForm } from '@/features/locals/components/local-form';

function NewLocationPage() {
  const navigate = useNavigate();

  return (
    <MobileShell>
      <PageHeader backHref="/locais" title="Novo local" />
      <main className="flex-1 px-5 py-6">
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
