import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import {
  formatCurrency,
  formatDuration,
  formatJobTime,
  formatShortJobDate,
} from '@/features/jobs/job-formatters';
import type { Job } from '@/features/jobs/job-types';

function JobCard({ job }: { job: Job }) {
  return (
    <Link
      aria-label={`Ver trabalho: ${job.title}`}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] outline-none hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30 active:translate-y-px"
      to={`/trabalhos/${job.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-xl leading-tight font-extrabold">{job.title}</h3>
        <strong className="shrink-0 rounded-lg bg-success px-2.5 py-1.5 text-base text-success-foreground">
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
        <div className="col-span-2 flex items-start gap-2">
          <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <dt className="sr-only">Local</dt>
            <dd className="truncate font-bold">{job.local.name}</dd>
            <dd className="truncate text-muted-foreground">
              {job.local.city}/{job.local.state}
            </dd>
          </div>
        </div>
      </dl>
    </Link>
  );
}

export { JobCard };
