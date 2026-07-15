'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

type ConfirmarAdicionarApoioDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioNome: string;
  detalhe?: string | null;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
};

export function ConfirmarAdicionarApoioDialog({
  open,
  onOpenChange,
  funcionarioNome,
  detalhe,
  onConfirm,
  isLoading,
}: ConfirmarAdicionarApoioDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar apoio?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja adicionar <strong>{funcionarioNome}</strong> como apoio
            {detalhe ? ` (${detalhe})` : ''}? O funcionário será alocado para
            auxiliar na demanda.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Adicionando...
              </>
            ) : (
              'Confirmar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
