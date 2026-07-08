'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, KeyRound, Loader2, Lock, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@lilog/ui';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  CodeStepSchema,
  EmailStepSchema,
  type CodeStepValues,
  type EmailStepValues,
} from '@/features/auth/types/auth.types';

const RESEND_COOLDOWN_SECONDS = 60;

export function LoginView() {
  const { requestCode, verifyCode, isSubmitting, error } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailForm = useForm<EmailStepValues>({
    resolver: zodResolver(EmailStepSchema),
    defaultValues: { email: '' },
  });

  const codeForm = useForm<CodeStepValues>({
    resolver: zodResolver(CodeStepSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function onSubmitEmail(values: EmailStepValues) {
    const normalizedEmail = values.email.trim().toLowerCase();
    await requestCode(normalizedEmail);
    setEmail(normalizedEmail);
    setStep('code');
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    codeForm.reset({ code: '' });
  }

  async function onSubmitCode(values: CodeStepValues) {
    await verifyCode(email, values.code.trim());
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || !email) return;

    await requestCode(email);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary">
            <Lock className="size-7 text-primary-foreground" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Portal de Terceiros
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 'email'
              ? 'Informe o e-mail cadastrado da transportadora'
              : `Enviamos um código para ${email}`}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {step === 'email' ? (
            <form
              onSubmit={emailForm.handleSubmit(onSubmitEmail)}
              noValidate
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    {...emailForm.register('email')}
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {emailForm.formState.errors.email.message}
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
                disabled={isSubmitting}
                className="mt-1 w-full gap-2"
              >
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                {isSubmitting ? 'Enviando…' : 'Continuar'}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={codeForm.handleSubmit(onSubmitCode)}
              noValidate
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-foreground"
                >
                  Código de acesso
                </label>
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    {...codeForm.register('code')}
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-center text-lg tracking-[0.35em] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>
                {codeForm.formState.errors.code && (
                  <p className="text-xs text-destructive">
                    {codeForm.formState.errors.code.message}
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
                disabled={isSubmitting}
                className="mt-1 w-full gap-2"
              >
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                {isSubmitting ? 'Validando…' : 'Entrar'}
              </Button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setResendCooldown(0);
                  }}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={() => void handleResendCode()}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
