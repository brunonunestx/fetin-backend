import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  formatCurrency,
  formatDuration,
  formatJobTime,
  formatShortJobDate,
} from '@/features/jobs/job-formatters';
import { getJobAvailability } from '@/features/jobs/job-rules';
import type { Job } from '@/features/jobs/job-types';

function OwnerJobCard({ job }: { job: Job }) {
  return (
    <Link
      aria-label={`Acompanhar vaga: ${job.title}`}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] outline-none hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30 active:translate-y-px"
      to={`/painel/vagas/${job.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge status={getJobAvailability(job)} />
          <h3 className="mt-2 text-xl leading-tight font-extrabold">{job.title}</h3>
        </div>
        <strong className="shrink-0 text-lg font-extrabold text-primary">
          {formatCurrency(job.value)}
        </strong>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
        <div className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-5 shrink-0 text-primary" />
          <div>
            <dt className="sr-only">Data</dt>
            <dd className="font-bold">{formatShortJobDate(job.startsAt)}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="size-5 shrink-0 text-primary" />
          <div>
            <dt className="sr-only">Horário e duração</dt>
            <dd className="font-bold">
              {formatJobTime(job.startsAt)} · {formatDuration(job.durationMinutes)}
            </dd>
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <dt className="sr-only">Local</dt>
            <dd className="truncate font-bold">{job.local.name}</dd>
          </div>
        </div>
      </dl>
    </Link>
  );
}

export { OwnerJobCard };
