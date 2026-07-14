import { zodResolver } from '@hookform/resolvers/zod';
import { Button, cn } from '@lilog/ui';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { hapticMedium } from '@/lib/haptics';
import { ApiClientError } from '@/lib/offline/api-client';

import { changePasswordApi } from '../api';
import { useAuth } from '../lib/auth-context';

const alterarSenhaSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmNewPassword: z.string().min(6, 'Mínimo de 6 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não conferem',
    path: ['confirmNewPassword'],
  });

type AlterarSenhaForm = z.infer<typeof alterarSenhaSchema>;

const inputClassName =
  'h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 text-body-md text-on-surface outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary';

export function AlterarSenhaView() {
  const navigate = useNavigate();
  const { user, completePasswordChange, logout } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const requiresCurrentPassword = user?.mustChangePassword === false;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlterarSenhaForm>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    hapticMedium();

    try {
      await changePasswordApi({
        currentPassword: requiresCurrentPassword
          ? values.currentPassword
          : undefined,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });

      completePasswordChange();
      await navigate({ to: '/', replace: true });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message || 'Erro ao alterar senha');
        return;
      }

      setSubmitError('Não foi possível alterar a senha. Tente novamente.');
    }
  });

  return (
    <div className="flex min-h-full flex-col justify-center px-margin-mobile py-8">
      <div className="mx-auto w-full max-w-sm">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
            <Lock className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-headline-lg-mobile font-bold text-on-surface">
            {user?.mustChangePassword
              ? 'Troca de senha obrigatória'
              : 'Alterar senha'}
          </h1>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            {user?.mustChangePassword
              ? 'Defina uma nova senha para continuar usando o sistema.'
              : 'Informe sua senha atual e a nova senha desejada.'}
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

          {requiresCurrentPassword ? (
            <div className="space-y-1.5">
              <label
                htmlFor="current-password"
                className="text-label-md font-medium text-on-surface"
              >
                Senha atual
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                  aria-hidden
                />
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha atual"
                  className={cn(inputClassName, 'pl-10 pr-10')}
                  {...register('currentPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none"
                  aria-label={
                    showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="text-label-md font-medium text-on-surface"
            >
              Nova senha
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                aria-hidden
              />
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo de 6 caracteres"
                className={cn(inputClassName, 'pl-10 pr-10')}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none"
                aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            {errors.newPassword ? (
              <p className="text-label-sm text-destructive">
                {errors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-new-password"
              className="text-label-md font-medium text-on-surface"
            >
              Confirmar nova senha
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                aria-hidden
              />
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                className={cn(inputClassName, 'pl-10 pr-10')}
                {...register('confirmNewPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none"
                aria-label={
                  showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            {errors.confirmNewPassword ? (
              <p className="text-label-sm text-destructive">
                {errors.confirmNewPassword.message}
              </p>
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
                Salvando...
              </>
            ) : (
              'Salvar nova senha'
            )}
          </Button>

          <button
            type="button"
            onClick={() => void logout()}
            disabled={isSubmitting}
            className="w-full text-center text-body-sm text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
          >
            Sair e voltar ao login
          </button>
        </form>
      </div>
    </div>
  );
}
