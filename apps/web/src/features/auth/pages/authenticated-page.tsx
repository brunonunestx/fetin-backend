import { CheckCircle2 } from 'lucide-react';
import { AccountNavigation } from '@/components/shared/account-navigation';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';

type AuthenticatedPageProps = {
  description: string;
  eyebrow: string;
  title: string;
};

function AuthenticatedPage({ description, eyebrow, title }: AuthenticatedPageProps) {
  const { logout, user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <MobileShell>
      <PageHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-success text-success-foreground">
          <CheckCircle2 aria-hidden="true" className="size-9" />
        </span>
        <Badge className="mt-5" variant="success">
          {eyebrow}
        </Badge>
        <h1 className="mt-3 text-3xl leading-tight font-extrabold">{title}</h1>
        <p className="mt-3 max-w-80 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Button className="mt-8" onClick={logout} type="button" variant="outline">
          Sair da conta
        </Button>
      </main>
      <AccountNavigation
        activeHref={user.type === 'operator' ? '/trabalhos' : '/painel'}
        type={user.type}
      />
    </MobileShell>
  );
}

export { AuthenticatedPage };
