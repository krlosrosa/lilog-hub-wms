'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';
import { Loader2, Mail, Plus, X } from 'lucide-react';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/docas/components/form-field-classes';
import type { TransportadoraListaItem } from '@/features/transporte/types/transportadora.schema';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TransportadoraEmailsDialogProps = {
  open: boolean;
  transportadora: TransportadoraListaItem | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (emails: string[]) => void | Promise<void>;
};

export function TransportadoraEmailsDialog({
  open,
  transportadora,
  isSubmitting,
  onOpenChange,
  onSave,
}: TransportadoraEmailsDialogProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [novoEmail, setNovoEmail] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !transportadora) {
      return;
    }

    setEmails(transportadora.emails ?? []);
    setNovoEmail('');
    setInputError(null);
  }, [open, transportadora]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const adicionarEmail = () => {
    const email = novoEmail.trim().toLowerCase();

    if (!email) {
      setInputError('Informe um e-mail');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setInputError('Informe um e-mail válido');
      return;
    }

    if (emails.includes(email)) {
      setInputError('Este e-mail já foi adicionado');
      return;
    }

    setEmails((current) => [...current, email]);
    setNovoEmail('');
    setInputError(null);
  };

  const removerEmail = (email: string) => {
    setEmails((current) => current.filter((item) => item !== email));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave(emails);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      adicionarEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-outline-variant bg-card sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
              <Mail className="size-4" aria-hidden />
            </span>
            <DialogTitle className="text-foreground">
              E-mails da transportadora
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {transportadora ? (
              <>
                Gerencie os e-mails de contato de{' '}
                <span className="font-medium text-foreground">
                  {transportadora.nome}
                </span>
                .
              </>
            ) : (
              'Adicione ou remova e-mails de contato.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="transportadora-novo-email" className={fieldLabelClassName}>
              Adicionar e-mail
            </label>
            <div className="flex gap-2">
              <input
                id="transportadora-novo-email"
                type="email"
                className={cn(fieldInputClassName, 'min-w-0 flex-1')}
                placeholder="contato@transportadora.com.br"
                value={novoEmail}
                onChange={(event) => {
                  setNovoEmail(event.target.value);
                  if (inputError) {
                    setInputError(null);
                  }
                }}
                onKeyDown={handleKeyDown}
                aria-invalid={Boolean(inputError)}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={isSubmitting}
                onClick={adicionarEmail}
              >
                <Plus className="size-4" aria-hidden />
                Adicionar
              </Button>
            </div>
            {inputError ? (
              <p className={fieldErrorClassName} role="alert">
                {inputError}
              </p>
            ) : null}
          </div>

          <div>
            <p className={fieldLabelClassName}>
              E-mails cadastrados{' '}
              <span className="font-normal text-muted-foreground">
                ({emails.length})
              </span>
            </p>

            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-low/40 px-4 py-8 text-center">
                <Mail className="size-5 text-muted-foreground/70" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Nenhum e-mail cadastrado ainda.
                </p>
              </div>
            ) : (
              <ul className="flex flex-wrap gap-2 rounded-lg border border-outline-variant bg-surface-low/30 p-3">
                {emails.map((email) => (
                  <li key={email}>
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-medium text-primary">
                      <span className="truncate">{email}</span>
                      <button
                        type="button"
                        className="flex size-5 shrink-0 items-center justify-center rounded-full text-primary/80 transition-colors hover:bg-primary/15 hover:text-primary"
                        aria-label={`Remover ${email}`}
                        disabled={isSubmitting}
                        onClick={() => removerEmail(email)}
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                'Salvar e-mails'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
