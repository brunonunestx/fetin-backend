import { CalendarDays, Clock3 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  formatCurrency,
  formatDuration,
  formatJobTime,
  formatShortJobDate,
} from '@/features/jobs/job-formatters';
import { getJobAvailability } from '@/features/jobs/job-rules';
import type { Job } from '@/features/jobs/job-types';

function LocalJobSummary({ job }: { job: Job }) {
  const availability = getJobAvailability(job);
  const titleId = `local-job-${job.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge status={availability} />
          <h3 className="mt-2 text-lg leading-tight font-extrabold" id={titleId}>
            {job.title}
          </h3>
        </div>
        <strong className="shrink-0 text-lg font-extrabold text-primary">
          {formatCurrency(job.value)}
        </strong>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
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
      </dl>
    </article>
  );
}

export { LocalJobSummary };
