import { AuthenticatedPage } from '@/features/auth/pages/authenticated-page';

function CompleteProfilePage() {
  return (
    <AuthenticatedPage
      description="Sua conta já está protegida e pronta. Na próxima etapa, você informará os dados essenciais do seu perfil."
      eyebrow="Conta criada"
      title="Agora falta seu perfil."
    />
  );
}

function WorkerHomePage() {
  return (
    <AuthenticatedPage
      description="Sua sessão de trabalhador está ativa. A lista de oportunidades será conectada na etapa de trabalhos."
      eyebrow="Área do trabalhador"
      title="Você entrou no TrampoFácil."
    />
  );
}

function OwnerHomePage() {
  return (
    <AuthenticatedPage
      description="Sua sessão de contratante está ativa. O painel de vagas será conectado na etapa do contratante."
      eyebrow="Área do contratante"
      title="Você entrou no TrampoFácil."
    />
  );
}

export { CompleteProfilePage, OwnerHomePage, WorkerHomePage };
