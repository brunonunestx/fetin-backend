import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { UserType } from '@/features/auth/auth-types';
import { FormError } from '@/features/auth/components/form-error';
import { formatPhone } from '@/features/profile/profile-formatters';
import {
  getProfileFormValues,
  profileFormSchema,
  toUpdateProfileInput,
  validateProfileForRole,
  type ProfileFormValues,
} from '@/features/profile/profile-form-schema';
import { useUpdateProfileMutation } from '@/features/profile/profile-mutations';
import type { UserProfile } from '@/features/profile/profile-types';

type ProfileFormProps = {
  onCancel?: () => void;
  onSaved: (profile: UserProfile) => void;
  profile: UserProfile;
  submitLabel: string;
  type: UserType;
};

function ProfileForm({ onCancel, onSaved, profile, submitLabel, type }: ProfileFormProps) {
  const updateMutation = useUpdateProfileMutation();
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<ProfileFormValues>({
    defaultValues: getProfileFormValues(profile),
    resolver: zodResolver(profileFormSchema),
  });
  const phoneField = register('phone');

  const submit = handleSubmit((values) => {
    const roleError = validateProfileForRole(values, type);

    if (roleError) {
      setError('position', { message: roleError });
      return;
    }

    updateMutation.mutate(toUpdateProfileInput(values, type), { onSuccess: onSaved });
  });

  return (
    <form className="space-y-5" noValidate onSubmit={(event) => void submit(event)}>
      <div className="space-y-2">
        <Label htmlFor="profile-name">Nome completo</Label>
        <Input
          aria-describedby={errors.name ? 'profile-name-error' : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          id="profile-name"
          placeholder="Como você quer ser chamado?"
          {...register('name')}
        />
        {errors.name ? (
          <p className="text-sm font-bold text-destructive" id="profile-name-error">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-phone">Telefone com DDD</Label>
        <Input
          {...phoneField}
          aria-describedby={errors.phone ? 'profile-phone-error' : 'profile-phone-help'}
          aria-invalid={Boolean(errors.phone)}
          autoComplete="tel-national"
          id="profile-phone"
          inputMode="tel"
          onChange={(event) => {
            clearErrors('phone');
            setValue('phone', formatPhone(event.target.value), { shouldDirty: true });
          }}
          placeholder="(35) 99999-9999"
          type="tel"
        />
        <p
          className={
            errors.phone ? 'text-sm font-bold text-destructive' : 'text-sm text-muted-foreground'
          }
          id={errors.phone ? 'profile-phone-error' : 'profile-phone-help'}
        >
          {errors.phone?.message ?? 'Usaremos este número somente nos contatos do serviço.'}
        </p>
      </div>

      {type === 'operator' ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="profile-position">Sua profissão</Label>
            <Input
              aria-describedby={errors.position ? 'profile-position-error' : undefined}
              aria-invalid={Boolean(errors.position)}
              autoComplete="organization-title"
              id="profile-position"
              placeholder="Ex.: Pedreiro, diarista, gesseiro"
              {...register('position')}
            />
            {errors.position ? (
              <p className="text-sm font-bold text-destructive" id="profile-position-error">
                {errors.position.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-age">Idade (opcional)</Label>
            <Input
              aria-describedby={errors.age ? 'profile-age-error' : undefined}
              aria-invalid={Boolean(errors.age)}
              id="profile-age"
              inputMode="numeric"
              max="120"
              min="0"
              placeholder="Ex.: 32"
              type="number"
              {...register('age')}
            />
            {errors.age ? (
              <p className="text-sm font-bold text-destructive" id="profile-age-error">
                {errors.age.message}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="profile-bio">Conte um pouco sobre você (opcional)</Label>
        <Textarea
          aria-describedby={errors.bio ? 'profile-bio-error' : 'profile-bio-help'}
          aria-invalid={Boolean(errors.bio)}
          className="min-h-28"
          id="profile-bio"
          maxLength={500}
          placeholder={
            type === 'operator'
              ? 'Fale brevemente sobre sua experiência e seu jeito de trabalhar.'
              : 'Conte brevemente sobre você ou sobre seu negócio.'
          }
          {...register('bio')}
        />
        <p
          className={
            errors.bio ? 'text-sm font-bold text-destructive' : 'text-sm text-muted-foreground'
          }
          id={errors.bio ? 'profile-bio-error' : 'profile-bio-help'}
        >
          {errors.bio?.message ?? 'Você pode preencher isso depois.'}
        </p>
      </div>

      <FormError error={updateMutation.error} />

      <div className="flex flex-col gap-2 pt-1">
        <Button disabled={updateMutation.isPending} size="lg" type="submit">
          {updateMutation.isPending ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              Salvando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel ? (
          <Button
            disabled={updateMutation.isPending}
            onClick={onCancel}
            type="button"
            variant="ghost"
          >
            Cancelar edição
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export { ProfileForm };
