import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Brand } from '@/components/shared/brand';
import { cn } from '@/lib/utils';

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type BottomNavigationProps = {
  activeHref: string;
  desktopOnly?: boolean;
  items: readonly NavigationItem[];
};

function BottomNavigation({ activeHref, desktopOnly = false, items }: BottomNavigationProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'safe-area-bottom sticky bottom-0 z-20 mt-auto grid min-h-18 border-t border-border bg-card/95 px-2 pt-1 backdrop-blur',
        'lg:sticky lg:top-0 lg:bottom-auto lg:col-start-1 lg:row-start-1 lg:mt-0 lg:flex lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:flex-col lg:border-t-0 lg:border-r lg:bg-card lg:px-4 lg:py-6 lg:backdrop-blur-none',
        desktopOnly && 'hidden lg:flex',
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      <div className="hidden px-2 lg:block">
        <Brand />
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Trabalho e confiança, sem complicação.
        </p>
      </div>

      <div className="contents lg:mt-8 lg:flex lg:flex-col lg:gap-2">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = href === activeHref;

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
                'lg:min-h-13 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-base',
                isActive
                  ? 'text-primary lg:bg-secondary'
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
      </div>
    </nav>
  );
}

export { BottomNavigation };
export type { NavigationItem };
