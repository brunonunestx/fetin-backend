import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Brand } from '@/components/shared/brand';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  action?: ReactNode;
  backHref?: string;
  className?: string;
  title?: string;
};

function PageHeader({ action, backHref, className, title }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'safe-area-top flex min-h-18 items-center gap-3 border-b border-border bg-card px-4 pb-3',
        className,
      )}
    >
      {backHref ? (
        <Button aria-label="Voltar" asChild size="icon" variant="ghost">
          <Link to={backHref}>
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <Brand compact />
      )}

      {title ? <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold">{title}</h1> : null}
      {!title ? <span className="flex-1" /> : null}
      {action}
    </header>
  );
}

export { PageHeader };
