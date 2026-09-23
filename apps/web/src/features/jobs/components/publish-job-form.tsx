import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Check, Clock3, LoaderCircle, MapPin, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/features/auth/components/form-error';
import {
  formatCurrency,
  formatDuration,
  formatJobDate,
  formatJobTime,
} from '@/features/jobs/job-formatters';
import {
  formatDateTimeLocalValue,
  jobFormSchema,
  localDateTimeToIso,
  toCreateJobInput,
  type JobFormValues,
} from '@/features/jobs/job-form-schema';
import { useCreateJobMutation } from '@/features/jobs/owner-job-mutations';
import type { Job } from '@/features/jobs/job-types';
import type { WorkLocation } from '@/features/locals/local-types';
import { cn } from '@/lib/utils';

const fieldsByStep: Record<1 | 2 | 3, (keyof JobFormValues)[]> = {
  1: ['localId', 'title', 'description'],
  2: ['startsAtLocal', 'durationHours'],
  3: ['value'],
};

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="text-sm font-bold text-destructive" id={id}>
      {message}
    </p>
  ) : null;
}

function StepProgress({ step }: { step: number }) {
  return (
    <div aria-label={`Etapa ${step} de 4`} className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((item) => (
        <span
          aria-hidden="true"
          className={cn('h-2 rounded-full', item <= step ? 'bg-primary' : 'bg-muted')}
          key={item}
        />
      ))}
    </div>
  );
}

function PublishJobForm({
  initialLocationId,
  locations,
  onPublished,
  ownerId,
}: {
  initialLocationId?: string;
  locations: WorkLocation[];
  onPublished: (job: Job) => void;
  ownerId: string;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formOpenedAt] = useState(() => new Date());
  const createMutation = useCreateJobMutation(ownerId);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    trigger,
  } = useForm<JobFormValues>({
    defaultValues: {
      description: '',
      durationHours: '',
      localId: initialLocationId ?? (locations.length === 1 ? locations[0]?.id : ''),
      startsAtLocal: '',
      title: '',
      value: '',
    },
    resolver: zodResolver(jobFormSchema),
  });
  const values = useWatch({ control });
  const selectedLocation = locations.find((location) => location.id === values.localId);
  const startsAtIso = values.startsAtLocal
    ? localDateTimeToIso(values.startsAtLocal)
    : formOpenedAt.toISOString();
  const submit = handleSubmit((validValues) => {
    const location = locations.find((item) => item.id === validValues.localId);

    if (!location) {
      return;
    }

    createMutation.mutate(
      { input: toCreateJobInput(validValues), location },
      {
        onSuccess: (createdJob) => onPublished({ ...createdJob, filled: false, local: location }),
      },
    );
  });

  const continueToNextStep = async () => {
    if (step === 4) {
      return;
    }

    const valid = await trigger(fieldsByStep[step]);

    if (valid) {
      setStep((current) => Math.min(current + 1, 4) as 1 | 2 | 3 | 4);
    }
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)}>
      <StepProgress step={step} />
      <p className="mt-3 text-sm font-extrabold tracking-wide text-primary uppercase">
        Etapa {step} de 4
      </p>

      {step === 1 ? (
        <div className="mt-2 space-y-6">
          <div>
            <h2 className="text-3xl leading-tight font-extrabold">Qual trabalho você precisa?</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Comece pelo local e explique o serviço de forma direta.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-base leading-tight font-bold">Local do trabalho</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {locations.map((location) => (
                <label
                  className={cn(
                    'flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 bg-card p-3 transition-colors',
                    values.localId === location.id ? 'border-primary bg-secondary' : 'border-input',
                  )}
                  key={location.id}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    value={location.id}
                    {...register('localId')}
                  />
                  <MapPin aria-hidden="true" className="size-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate">{location.name}</strong>
                    <span className="block truncate text-sm text-muted-foreground">
                      {location.city}/{location.state}
                    </span>
                  </span>
                  {values.localId === location.id ? (
                    <Check aria-hidden="true" className="size-5 shrink-0 text-primary" />
                  ) : null}
                </label>
              ))}
            </div>
            <FieldError id="job-local-error" message={errors.localId?.message} />
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="job-title">Título do trabalho</Label>
            <Input
              aria-describedby={errors.title ? 'job-title-error' : undefined}
              aria-invalid={Boolean(errors.title)}
              id="job-title"
              maxLength={120}
              placeholder="Ex.: Descarregar um caminhão"
              {...register('title')}
            />
            <FieldError id="job-title-error" message={errors.title?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-description">O que precisa ser feito?</Label>
            <Textarea
              aria-describedby={
                errors.description ? 'job-description-error' : 'job-description-help'
              }
              aria-invalid={Boolean(errors.description)}
              className="min-h-32"
              id="job-description"
              maxLength={2000}
              placeholder="Explique o serviço e o que o trabalhador precisa saber."
              {...register('description')}
            />
            {errors.description ? (
              <FieldError id="job-description-error" message={errors.description.message} />
            ) : (
              <p className="text-sm text-muted-foreground" id="job-description-help">
                Uma explicação curta e clara já é suficiente.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-2 space-y-6">
          <div>
            <h2 className="text-3xl leading-tight font-extrabold">Quando será o serviço?</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Informe o início e uma estimativa de duração.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-starts-at">Data e horário</Label>
            <Input
              aria-describedby={errors.startsAtLocal ? 'job-starts-at-error' : undefined}
              aria-invalid={Boolean(errors.startsAtLocal)}
              id="job-starts-at"
              min={formatDateTimeLocalValue(formOpenedAt)}
              type="datetime-local"
              {...register('startsAtLocal')}
            />
            <FieldError id="job-starts-at-error" message={errors.startsAtLocal?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-duration">Duração estimada em horas</Label>
            <Input
              aria-describedby={errors.durationHours ? 'job-duration-error' : 'job-duration-help'}
              aria-invalid={Boolean(errors.durationHours)}
              id="job-duration"
              inputMode="decimal"
              min="0.01"
              placeholder="Ex.: 4"
              step="0.5"
              type="number"
              {...register('durationHours')}
            />
            {errors.durationHours ? (
              <FieldError id="job-duration-error" message={errors.durationHours.message} />
            ) : (
              <p className="text-sm text-muted-foreground" id="job-duration-help">
                Para meia hora, use 0,5.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-2 space-y-6">
          <div>
            <h2 className="text-3xl leading-tight font-extrabold">Quanto será pago?</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Informe o valor total oferecido por este trabalho.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-value">Valor total</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-3 left-4 font-extrabold text-primary">
                R$
              </span>
              <Input
                aria-describedby={errors.value ? 'job-value-error' : 'job-value-help'}
                aria-invalid={Boolean(errors.value)}
                className="pl-12 text-lg font-extrabold"
                id="job-value"
                inputMode="decimal"
                placeholder="0,00"
                type="text"
                {...register('value')}
              />
            </div>
            {errors.value ? (
              <FieldError id="job-value-error" message={errors.value.message} />
            ) : (
              <p className="text-sm text-muted-foreground" id="job-value-help">
                Esse valor ficará visível para os trabalhadores.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-2 space-y-6">
          <div>
            <h2 className="text-3xl leading-tight font-extrabold">Revise antes de publicar.</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Confira os dados. Você poderá cancelar a vaga, mas não editá-la.
            </p>
          </div>

          <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
            <div className="py-4">
              <dt className="text-sm font-bold text-muted-foreground">Trabalho</dt>
              <dd className="mt-1 text-lg font-extrabold">{values.title}</dd>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {values.description}
              </dd>
            </div>
            <div className="flex gap-3 py-4">
              <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <dt className="text-sm font-bold text-muted-foreground">Local</dt>
                <dd className="font-extrabold">{selectedLocation?.name}</dd>
              </div>
            </div>
            <div className="flex gap-3 py-4">
              <CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <dt className="text-sm font-bold text-muted-foreground">Data e horário</dt>
                <dd className="font-extrabold">
                  {formatJobDate(startsAtIso)}, às {formatJobTime(startsAtIso)}
                </dd>
              </div>
            </div>
            <div className="flex gap-3 py-4">
              <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <dt className="text-sm font-bold text-muted-foreground">Duração</dt>
                <dd className="font-extrabold">
                  {formatDuration(
                    Math.round(Number((values.durationHours ?? '').replace(',', '.')) * 60),
                  )}
                </dd>
              </div>
            </div>
            <div className="flex gap-3 py-4">
              <WalletCards aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <dt className="text-sm font-bold text-muted-foreground">Pagamento</dt>
                <dd className="text-xl font-extrabold text-primary">
                  {formatCurrency((values.value ?? '0').replace(',', '.'))}
                </dd>
              </div>
            </div>
          </dl>

          <FormError error={createMutation.error} />
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
        {step < 4 ? (
          <Button
            className="sm:min-w-44"
            onClick={(event) => {
              event.preventDefault();
              void continueToNextStep();
            }}
            size="lg"
            type="button"
          >
            Continuar
          </Button>
        ) : (
          <Button
            className="sm:min-w-44"
            disabled={createMutation.isPending}
            size="lg"
            type="submit"
          >
            {createMutation.isPending ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar vaga'
            )}
          </Button>
        )}
        {step > 1 ? (
          <Button
            disabled={createMutation.isPending}
            onClick={() => setStep((current) => Math.max(current - 1, 1) as 1 | 2 | 3 | 4)}
            type="button"
            variant="ghost"
          >
            Voltar uma etapa
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export { PublishJobForm };
