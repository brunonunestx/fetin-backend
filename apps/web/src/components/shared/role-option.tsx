import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

type RoleOptionProps = {
  description: string;
  icon: LucideIcon;
  title: string;
  to: string;
  tone?: 'primary' | 'accent';
};

function RoleOption({ description, icon: Icon, title, to, tone = 'primary' }: RoleOptionProps) {
  return (
    <Link
      className="group flex min-h-24 items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 shadow-[0_3px_0_var(--border)] transition-[border-color,box-shadow,transform] outline-none hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30 active:translate-y-px active:shadow-none"
      to={to}
    >
      <span
        className={cn(
          'flex size-13 shrink-0 items-center justify-center rounded-xl',
          tone === 'primary'
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent text-accent-foreground',
        )}
      >
        <Icon aria-hidden="true" className="size-7" strokeWidth={2.25} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-tight font-extrabold">{title}</span>
        <span className="mt-1 block text-base leading-snug text-muted-foreground">
          {description}
        </span>
      </span>

      <ChevronRight
        aria-hidden="true"
        className="size-6 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
        strokeWidth={2.5}
      />
    </Link>
  );
}

export { RoleOption };
