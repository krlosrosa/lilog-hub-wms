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
import { Database, Loader2 } from 'lucide-react';

export type AdicionarBancoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalLinhas: number;
  totalCaixas: number;
  isSalvando: boolean;
  onConfirmar: () => void;
};

export function AdicionarBancoDialog({
  open,
  onOpenChange,
  totalLinhas,
  totalCaixas,
  isSalvando,
  onConfirmar,
}: AdicionarBancoDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <Database className="size-5 text-primary" aria-hidden />
            Adicionar dados ao banco?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Confirma a persistência das{' '}
            <span className="font-semibold text-foreground">
              {totalLinhas} linha{totalLinhas !== 1 ? 's selecionadas' : ' selecionada'}
            </span>{' '}
            ({totalCaixas} caixa{totalCaixas !== 1 ? 's' : ''} no total) na base
            de separação de queijo variável. Esta ação simula gravação no banco
            (mock).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isSalvando}>
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={isSalvando}
            onClick={onConfirmar}
            className="gap-2"
          >
            {isSalvando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              'Confirmar e adicionar'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
