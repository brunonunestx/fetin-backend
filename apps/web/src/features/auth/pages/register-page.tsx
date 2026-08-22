import { zodResolver } from '@hookform/resolvers/zod';
import { BriefcaseBusiness, LoaderCircle, Search } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACCOUNT_CREATED_LOGIN_FAILED, useRegisterMutation } from '@/features/auth/auth-mutations';
import type { UserType } from '@/features/auth/auth-types';
import { FormError } from '@/features/auth/components/form-error';
import { PasswordInput } from '@/features/auth/components/password-input';
import { isApiError } from '@/lib/api/api-error';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  email: z.string().trim().email('Digite um e-mail válido.'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
  type: z.enum(['operator', 'local_owner'], {
    error: 'Escolha se você quer trabalhar ou contratar.',
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const roleFromQuery: Record<string, UserType> = {
  contratante: 'local_owner',
  trabalhador: 'operator',
};

function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registerMutation = useRegisterMutation();
  const requestedRole = roleFromQuery[searchParams.get('tipo') ?? ''];
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    defaultValues: { email: '', password: '', type: requestedRole },
    resolver: zodResolver(registerSchema),
  });
  const selectedRole = useWatch({ control, name: 'type' });
  const emailAlreadyExists =
    isApiError(registerMutation.error) &&
    registerMutation.error.code === 'EMAIL_ALREADY_REGISTERED';
  const accountCreatedWithoutSession =
    isApiError(registerMutation.error) &&
    registerMutation.error.code === ACCOUNT_CREATED_LOGIN_FAILED;

  const submit = handleSubmit((values) => {
    registerMutation.mutate(
      { ...values, email: values.email.toLowerCase() },
      {
        onSuccess: () => {
          void navigate('/completar-perfil', { replace: true });
        },
      },
    );
  });

  return (
    <MobileShell>
      <PageHeader backHref="/boas-vindas" title="Criar conta" />
      <main className="flex-1 px-5 py-6">
        <form noValidate onSubmit={(event) => void submit(event)}>
          <fieldset aria-describedby={errors.type ? 'type-error' : undefined}>
            <legend className="text-xl font-extrabold">Como você quer usar o TrampoFácil?</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label
                className={cn(
                  'flex min-h-28 cursor-pointer flex-col rounded-2xl border-2 bg-card p-3 transition-[border-color,background-color,box-shadow] outline-none has-focus-visible:ring-[3px] has-focus-visible:ring-ring/30',
                  selectedRole === 'operator'
                    ? 'border-primary bg-secondary shadow-[0_3px_0_var(--primary)]'
                    : 'border-border',
                )}
              >
                <input className="sr-only" type="radio" value="operator" {...register('type')} />
                <Search aria-hidden="true" className="size-7 text-primary" />
                <span className="mt-3 text-base leading-tight font-extrabold">Quero trabalhar</span>
              </label>

              <label
                className={cn(
                  'flex min-h-28 cursor-pointer flex-col rounded-2xl border-2 bg-card p-3 transition-[border-color,background-color,box-shadow] outline-none has-focus-visible:ring-[3px] has-focus-visible:ring-ring/30',
                  selectedRole === 'local_owner'
                    ? 'border-primary bg-secondary shadow-[0_3px_0_var(--primary)]'
                    : 'border-border',
                )}
              >
                <input className="sr-only" type="radio" value="local_owner" {...register('type')} />
                <BriefcaseBusiness aria-hidden="true" className="size-7 text-primary" />
                <span className="mt-3 text-base leading-tight font-extrabold">Quero contratar</span>
              </label>
            </div>
            {errors.type ? (
              <p className="mt-2 text-sm font-bold text-destructive" id="type-error">
                {errors.type.message}
              </p>
            ) : null}
          </fieldset>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={Boolean(errors.email)}
                autoCapitalize="none"
                autoComplete="email"
                id="email"
                inputMode="email"
                placeholder="seuemail@exemplo.com"
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-sm font-bold text-destructive" id="email-error">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Crie uma senha</Label>
              <PasswordInput
                aria-describedby="password-help"
                aria-invalid={Boolean(errors.password)}
                autoComplete="new-password"
                id="password"
                {...register('password')}
              />
              <p
                className={cn(
                  'text-sm text-muted-foreground',
                  errors.password && 'font-bold text-destructive',
                )}
                id="password-help"
              >
                {errors.password?.message ?? 'Use pelo menos 8 caracteres.'}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <FormError error={registerMutation.error} />
            {emailAlreadyExists || accountCreatedWithoutSession ? (
              <Button asChild className="mt-2" variant="link">
                <Link to="/entrar">
                  {accountCreatedWithoutSession
                    ? 'Entrar na conta criada'
                    : 'Entrar com este e-mail'}
                </Link>
              </Button>
            ) : null}
          </div>

          <Button
            className="mt-6 w-full"
            disabled={registerMutation.isPending}
            size="lg"
            type="submit"
          >
            {registerMutation.isPending ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar minha conta'
            )}
          </Button>
        </form>

        <p className="mt-7 text-center text-base text-muted-foreground">
          Já tem uma conta?{' '}
          <Link
            className="font-extrabold text-primary underline-offset-4 hover:underline"
            to="/entrar"
          >
            Entrar
          </Link>
        </p>
      </main>
    </MobileShell>
  );
}

export { RegisterPage };
