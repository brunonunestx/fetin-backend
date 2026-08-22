import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type BottomNavigationProps = {
  activeHref: string;
  items: readonly NavigationItem[];
};

function BottomNavigation({ activeHref, items }: BottomNavigationProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="safe-area-bottom sticky bottom-0 z-20 mt-auto grid min-h-18 border-t border-border bg-card/95 px-2 pt-1 backdrop-blur"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ href, icon: Icon, label }) => {
        const isActive = href === activeHref;

        return (
          <Link
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            key={href}
            to={href}
          >
            <Icon aria-hidden="true" className="size-6" strokeWidth={isActive ? 2.75 : 2} />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { BottomNavigation };
export type { NavigationItem };
