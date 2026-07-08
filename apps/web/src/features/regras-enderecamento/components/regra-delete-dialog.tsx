'use client';

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

type RegraDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nome?: string;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
};

export function RegraDeleteDialog({
  open,
  onOpenChange,
  nome,
  isSubmitting,
  onConfirm,
}: RegraDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir regra de endereçamento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a regra{' '}
            <strong>{nome ?? 'selecionada'}</strong>? Essa ação não pode ser
            desfeita e a sugestão automática deixará de usar esta configuração.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => void onConfirm()}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            )}
            Excluir regra
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
