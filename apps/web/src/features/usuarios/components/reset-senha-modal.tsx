'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

type ResetSenhaModalProps = {
  open: boolean;
  usuarioNome: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => Promise<void>;
};

export function ResetSenhaModal({
  open,
  usuarioNome,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ResetSenhaModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPassword('');
      setError(null);
    }

    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (password.length < 6) {
      setError('Informe uma senha com no mínimo 6 caracteres');
      return;
    }

    setError(null);

    try {
      await onConfirm(password);
      setPassword('');
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao resetar senha';
      setError(message);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Resetar senha de {usuarioNome}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Defina uma senha temporária. O usuário será obrigado a trocá-la no
            próximo login.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="reset-senha-temporaria"
            className="text-sm font-medium text-foreground"
          >
            Senha temporária
          </label>
          <input
            id="reset-senha-temporaria"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Confirmar reset
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
