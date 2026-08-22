import { AuthenticatedPage } from '@/features/auth/pages/authenticated-page';

function OwnerHomePage() {
  return (
    <AuthenticatedPage
      description="Sua sessão de contratante está ativa. O painel de vagas será conectado na etapa do contratante."
      eyebrow="Área do contratante"
      title="Você entrou no TrampoFácil."
    />
  );
}

export { OwnerHomePage };
