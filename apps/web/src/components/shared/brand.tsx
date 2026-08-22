import { cn } from '@/lib/utils';

type BrandProps = {
  className?: string;
  compact?: boolean;
};

function BrandMark({ className }: Pick<BrandProps, 'className'>) {
  return (
    <svg
      aria-hidden="true"
      className={cn('size-11 shrink-0', className)}
      viewBox="0 0 44 44"
      fill="none"
    >
      <rect width="44" height="44" rx="13" fill="var(--accent)" />
      <path
        d="M12 15.5h20M12 22h13M12 28.5h8"
        stroke="var(--accent-foreground)"
        strokeWidth="3.25"
        strokeLinecap="round"
      />
      <path
        d="m25.5 28 2.7 2.7 5.3-6.2"
        stroke="var(--primary)"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Brand({ className, compact = false }: BrandProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark className={compact ? 'size-9' : undefined} />
      <span className={cn('text-xl font-extrabold tracking-tight', compact && 'text-lg')}>
        Trampo<span className="text-primary">Fácil</span>
      </span>
    </div>
  );
}

export { Brand, BrandMark };
