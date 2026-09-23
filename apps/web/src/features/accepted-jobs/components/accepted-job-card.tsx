import { ArrowRight, CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import type { AcceptedJob } from '@/features/accepted-jobs/accepted-job-types';
import {
  formatAddress,
  formatCurrency,
  formatDuration,
  formatJobDate,
  formatJobTime,
} from '@/features/jobs/job-formatters';

function AcceptedJobCard({ job, upcoming }: { job: AcceptedJob; upcoming: boolean }) {
  const titleId = `accepted-job-${job.jobId}`;
  const status = job.cancelledAt ? 'cancelled' : upcoming ? 'upcoming' : 'previous';

  return (
    <article
      aria-labelledby={titleId}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge status={status} />
          <h3 className="mt-2 text-xl leading-tight font-extrabold" id={titleId}>
            {job.title}
          </h3>
        </div>
        <strong className="shrink-0 text-xl font-extrabold text-primary">
          {formatCurrency(job.value)}
        </strong>
      </div>

      <dl className="mt-5 space-y-4">
        <div className="flex items-start gap-3">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <dt className="sr-only">Data</dt>
            <dd className="font-extrabold">{formatJobDate(job.startsAt)}</dd>
            <dd className="text-sm text-muted-foreground">às {formatJobTime(job.startsAt)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <dt className="sr-only">Duração</dt>
            <dd className="font-bold">{formatDuration(job.durationMinutes)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <dt className="sr-only">Local</dt>
            <dd className="font-extrabold">{job.local.name}</dd>
            <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              {formatAddress(job.local)}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-1 gap-2 border-t border-border pt-4 min-[400px]:grid-cols-2">
        <Button asChild size="sm" variant="outline">
          <Link to={`/perfis/${job.local.ownerId}`}>
            <UserRound aria-hidden="true" />
            Contratante
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to={`/trabalhos/${job.jobId}`}>
            Detalhes
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export { AcceptedJobCard };
