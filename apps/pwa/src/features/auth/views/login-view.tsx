import { zodResolver } from '@hookform/resolvers/zod';
import { Button, cn } from '@lilog/ui';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, Loader2, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { hapticMedium } from '@/lib/haptics';
import { ApiClientError } from '@/lib/offline/api-client';

import { useAuth } from '../lib/auth-context';

const loginSchema = z.object({
  id: z.coerce.number().int().positive('Informe um ID válido'),
  password: z.string().min(1, 'Informe sua senha'),
});

type LoginForm = z.infer<typeof loginSchema>;

const inputClassName =
  'h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 text-body-md text-on-surface outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary';

export function LoginView() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      id: undefined,
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    hapticMedium();

    try {
      await loginWithCredentials({
        id: values.id,
        password: values.password,
      });
      await navigate({ to: '/', replace: true });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message || 'Credenciais inválidas');
        return;
      }

      setSubmitError('Não foi possível entrar. Tente novamente.');
    }
  });

  return (
    <div className="flex min-h-full flex-col justify-center px-margin-mobile py-8">
      <div className="mx-auto w-full max-w-sm">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
            <User className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-headline-lg-mobile font-bold text-on-surface">
            LILOG - HUB
          </h1>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Entre com seu ID e senha para continuar
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {submitError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/20 px-3 py-2.5 text-body-sm text-on-error-container"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{submitError}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="login-id" className="text-label-md font-medium text-on-surface">
              ID
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                aria-hidden
              />
              <input
                id="login-id"
                type="number"
                inputMode="numeric"
                autoComplete="username"
                placeholder="Digite seu ID"
                className={cn(inputClassName, 'pl-10')}
                {...register('id')}
              />
            </div>
            {errors.id ? (
              <p className="text-label-sm text-destructive">{errors.id.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="text-label-md font-medium text-on-surface"
            >
              Senha
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                aria-hidden
              />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="123456"
                className={cn(inputClassName, 'pl-10')}
                {...register('password')}
              />
            </div>
            {errors.password ? (
              <p className="text-label-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-lg text-body-md font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
