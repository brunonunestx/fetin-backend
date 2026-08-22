import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { MobileShell } from '@/components/shared/mobile-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/features/auth/components/form-error';
import { PasswordInput } from '@/features/auth/components/password-input';
import { useLoginMutation } from '@/features/auth/auth-mutations';
import { homeRouteByUserType } from '@/features/auth/auth-types';

const loginSchema = z.object({
  email: z.string().trim().email('Digite um e-mail válido.'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginMutation = useLoginMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  });
  const sessionExpired = searchParams.get('motivo') === 'sessao-expirada';

  const submit = handleSubmit((values) => {
    loginMutation.mutate(
      { ...values, email: values.email.toLowerCase() },
      {
        onSuccess: (user) => {
          void navigate(homeRouteByUserType[user.type], { replace: true });
        },
      },
    );
  });

  return (
    <MobileShell>
      <PageHeader backHref="/boas-vindas" title="Entrar" />
      <main className="flex-1 px-5 py-7">
        <h2 className="text-3xl leading-tight font-extrabold">Bom ter você de volta.</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Use o e-mail e a senha que você cadastrou.
        </p>

        {sessionExpired ? (
          <div
            className="mt-5 rounded-xl bg-warning px-4 py-3 text-base font-bold text-warning-foreground"
            role="status"
          >
            Sua sessão venceu. Entre novamente para continuar.
          </div>
        ) : null}

        <form className="mt-7 space-y-5" noValidate onSubmit={(event) => void submit(event)}>
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
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
              autoComplete="current-password"
              id="password"
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-sm font-bold text-destructive" id="password-error">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <FormError error={loginMutation.error} />

          <Button className="w-full" disabled={loginMutation.isPending} size="lg" type="submit">
            {loginMutation.isPending ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-base text-muted-foreground">
          Ainda não tem uma conta?{' '}
          <Link
            className="font-extrabold text-primary underline-offset-4 hover:underline"
            to="/boas-vindas"
          >
            Começar agora
          </Link>
        </p>
      </main>
    </MobileShell>
  );
}

export { LoginPage };
