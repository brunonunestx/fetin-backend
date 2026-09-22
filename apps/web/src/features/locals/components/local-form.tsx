import { zodResolver } from '@hookform/resolvers/zod';
import { LocateFixed, LoaderCircle, MapPinCheck, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/features/auth/components/form-error';
import {
  formatZipCode,
  localFormSchema,
  toCreateLocationInput,
  type LocalFormValues,
} from '@/features/locals/local-form-schema';
import { useCreateLocationMutation } from '@/features/locals/locals-mutations';
import type { WorkLocation } from '@/features/locals/local-types';
import { getGeolocationErrorMessage } from '@/lib/geolocation';
import { useCurrentLocation } from '@/lib/use-current-location';

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="text-sm font-bold text-destructive" id={id}>
      {message}
    </p>
  ) : null;
}

function LocalForm({ onCreated }: { onCreated: (location: WorkLocation) => void }) {
  const createMutation = useCreateLocationMutation();
  const currentLocation = useCurrentLocation();
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<LocalFormValues>({
    defaultValues: { address: '', city: '', name: '', state: '', zipCode: '' },
    resolver: zodResolver(localFormSchema),
  });
  const stateField = register('state');
  const zipCodeField = register('zipCode');
  const submit = handleSubmit((values) => {
    createMutation.mutate(toCreateLocationInput(values, currentLocation.coordinates), {
      onSuccess: onCreated,
    });
  });

  return (
    <form className="space-y-5" noValidate onSubmit={(event) => void submit(event)}>
      <div className="space-y-2">
        <Label htmlFor="local-name">Nome do local</Label>
        <Input
          aria-describedby={errors.name ? 'local-name-error' : 'local-name-help'}
          aria-invalid={Boolean(errors.name)}
          autoComplete="organization"
          id="local-name"
          maxLength={120}
          placeholder="Ex.: Padaria Central"
          {...register('name')}
        />
        {errors.name ? (
          <FieldError id="local-name-error" message={errors.name.message} />
        ) : (
          <p className="text-sm text-muted-foreground" id="local-name-help">
            Use um nome fácil de reconhecer depois.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="local-address">Endereço</Label>
        <Input
          aria-describedby={errors.address ? 'local-address-error' : undefined}
          aria-invalid={Boolean(errors.address)}
          autoComplete="street-address"
          id="local-address"
          maxLength={200}
          placeholder="Rua, número e complemento"
          {...register('address')}
        />
        <FieldError id="local-address-error" message={errors.address?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="local-city">Cidade</Label>
        <Input
          aria-describedby={errors.city ? 'local-city-error' : undefined}
          aria-invalid={Boolean(errors.city)}
          autoComplete="address-level2"
          id="local-city"
          maxLength={100}
          placeholder="Ex.: Pouso Alegre"
          {...register('city')}
        />
        <FieldError id="local-city-error" message={errors.city?.message} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
        <div className="space-y-2">
          <Label htmlFor="local-zip-code">CEP</Label>
          <Input
            {...zipCodeField}
            aria-describedby={errors.zipCode ? 'local-zip-code-error' : undefined}
            aria-invalid={Boolean(errors.zipCode)}
            autoComplete="postal-code"
            id="local-zip-code"
            inputMode="numeric"
            maxLength={9}
            onChange={(event) => {
              clearErrors('zipCode');
              setValue('zipCode', formatZipCode(event.target.value), { shouldDirty: true });
            }}
            placeholder="00000-000"
            type="text"
          />
          <FieldError id="local-zip-code-error" message={errors.zipCode?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="local-state">UF</Label>
          <Input
            {...stateField}
            aria-describedby={errors.state ? 'local-state-error' : undefined}
            aria-invalid={Boolean(errors.state)}
            autoCapitalize="characters"
            autoComplete="address-level1"
            id="local-state"
            maxLength={2}
            onChange={(event) => {
              clearErrors('state');
              setValue('state', event.target.value.replace(/[^a-z]/gi, '').toUpperCase(), {
                shouldDirty: true,
              });
            }}
            placeholder="MG"
          />
          <FieldError id="local-state-error" message={errors.state?.message} />
        </div>
      </div>

      <section
        aria-labelledby="location-coordinates-heading"
        className="rounded-2xl border border-border bg-secondary/60 p-4"
      >
        <div className="flex items-start gap-3">
          {currentLocation.status === 'success' ? (
            <MapPinCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
          ) : (
            <LocateFixed aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold" id="location-coordinates-heading">
              Localização no mapa (opcional)
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Use quando você estiver neste endereço. Isso ajuda trabalhadores a encontrar vagas
              próximas.
            </p>
          </div>
        </div>

        {currentLocation.status === 'success' ? (
          <div className="mt-4" role="status">
            <p className="text-sm font-bold text-success-foreground">
              Localização adicionada ao cadastro.
            </p>
            <Button
              className="mt-2"
              disabled={createMutation.isPending}
              onClick={currentLocation.clear}
              size="sm"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" />
              Remover localização
            </Button>
          </div>
        ) : (
          <Button
            className="mt-4 w-full"
            disabled={currentLocation.status === 'loading' || createMutation.isPending}
            onClick={() => void currentLocation.request()}
            type="button"
            variant="outline"
          >
            {currentLocation.status === 'loading' ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Buscando localização...
              </>
            ) : (
              <>
                <LocateFixed aria-hidden="true" />
                {currentLocation.status === 'error'
                  ? 'Tentar localização novamente'
                  : 'Usar localização atual'}
              </>
            )}
          </Button>
        )}

        {currentLocation.status === 'error' ? (
          <p className="mt-3 text-sm font-bold text-destructive" role="alert">
            {getGeolocationErrorMessage(currentLocation.error)}
          </p>
        ) : null}
      </section>

      <FormError error={createMutation.error} />

      <Button className="w-full" disabled={createMutation.isPending} size="lg" type="submit">
        {createMutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Salvando local...
          </>
        ) : (
          'Cadastrar local'
        )}
      </Button>
    </form>
  );
}

export { LocalForm };
