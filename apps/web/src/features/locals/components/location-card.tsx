import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import type { WorkLocation } from '@/features/locals/local-types';

function LocationCard({ location }: { location: WorkLocation }) {
  return (
    <Link
      aria-label={`Ver local: ${location.name}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] outline-none hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30 active:translate-y-px"
      to={`/locais/${location.id}`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <MapPin aria-hidden="true" className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-lg font-extrabold">{location.name}</strong>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {location.address}
        </span>
        <span className="block truncate text-sm font-bold text-muted-foreground">
          {location.city}/{location.state}
        </span>
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-primary" />
    </Link>
  );
}

export { LocationCard };
