'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Hash, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@lilog/ui';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { LoginFormSchema, type LoginFormValues } from '@/features/auth/types/auth.types';

export function LoginView() {
  const { login, isSubmitting, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { loginId: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    await login(Number(values.loginId), values.password);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary">
            <Lock className="size-7 text-primary-foreground" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            LiLog Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Portal interno de gestão logística do seu centro de distribuição.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form
            id="login-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="loginId"
                className="text-sm font-medium text-foreground"
              >
                ID de acesso
              </label>
              <div className="relative">
                <Hash
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="loginId"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="Informe o ID fornecido pela TI"
                  {...form.register('loginId')}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
              {form.formState.errors.loginId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.loginId.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register('password')}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              form="login-form"
              disabled={isSubmitting}
              className="mt-1 w-full gap-2"
            >
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {isSubmitting ? 'Entrando…' : 'Entrar no portal'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ambiente interno — acesso restrito a colaboradores autorizados.
        </p>
      </div>
    </div>
  );
}
