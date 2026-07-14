'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@lilog/ui';

import { useAuthContext } from '@/contexts/auth-context';
import { changeOwnPassword } from '@/features/usuarios/lib/usuario-api';

const AlterarSenhaSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmNewPassword: z.string().min(6, 'Mínimo de 6 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não conferem',
    path: ['confirmNewPassword'],
  });

type AlterarSenhaFormValues = z.infer<typeof AlterarSenhaSchema>;

export function AlterarSenhaView() {
  const { user, completePasswordChange } = useAuthContext();
  const router = useRouter();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresCurrentPassword = user?.mustChangePassword === false;

  const form = useForm<AlterarSenhaFormValues>({
    resolver: zodResolver(AlterarSenhaSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  async function onSubmit(values: AlterarSenhaFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      await changeOwnPassword({
        currentPassword: requiresCurrentPassword
          ? values.currentPassword
          : undefined,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });

      completePasswordChange();
      toast.success('Senha alterada com sucesso');
      router.push('/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao alterar senha';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary">
            <Lock className="size-7 text-primary-foreground" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {user?.mustChangePassword
              ? 'Troca de senha obrigatória'
              : 'Alterar senha'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.mustChangePassword
              ? 'Defina uma nova senha para continuar usando o sistema.'
              : 'Informe sua senha atual e a nova senha desejada.'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form
            id="alterar-senha-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            {requiresCurrentPassword ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="currentPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Senha atual
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register('currentPassword')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-foreground"
              >
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register('newPassword')}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showNewPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              {form.formState.errors.newPassword ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmNewPassword"
                className="text-sm font-medium text-foreground"
              >
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register('confirmNewPassword')}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={
                    showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              {form.formState.errors.confirmNewPassword ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirmNewPassword.message}
                </p>
              ) : null}
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              form="alterar-senha-form"
              disabled={isSubmitting}
              className="mt-1 w-full gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
