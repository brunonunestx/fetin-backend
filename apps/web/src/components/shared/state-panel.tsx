import { CircleAlert, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type StatePanelProps = {
  action?: {
    label: string;
    onClick: () => void;
  };
  description: string;
  icon?: ReactNode;
  title: string;
};

function StatePanel({ action, description, icon, title }: StatePanelProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
        {icon ?? <SearchX aria-hidden="true" className="size-8" />}
      </span>
      <h2 className="text-xl font-extrabold">{title}</h2>
      <p className="mt-2 max-w-72 text-base leading-relaxed text-muted-foreground">{description}</p>
      {action ? (
        <Button className="mt-6" onClick={action.onClick} type="button" variant="outline">
          {action.label}
        </Button>
      ) : null}
    </section>
  );
}

function ErrorState({
  action,
  description,
  title = 'Algo deu errado',
}: Omit<StatePanelProps, 'icon'>) {
  return (
    <StatePanel
      action={action}
      description={description}
      icon={<CircleAlert aria-hidden="true" className="size-8" />}
      title={title}
    />
  );
}

export { ErrorState, StatePanel };
