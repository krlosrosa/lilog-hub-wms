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
import { AlertTriangle } from 'lucide-react';

import type { RotaConflitanteUpload } from '@/features/transporte/lib/expedicao-api';

type UploadConflitoDialogProps = {
  aberto: boolean;
  rotasConflitantes: RotaConflitanteUpload[];
  onFechar: () => void;
};

export function UploadConflitoDialog({
  aberto,
  rotasConflitantes,
  onFechar,
}: UploadConflitoDialogProps) {
  return (
    <AlertDialog open={aberto} onOpenChange={(open) => !open && onFechar()}>
      <AlertDialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden />
            Rotas já cadastradas
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Não é possível importar o arquivo porque as rotas abaixo já existem
            para esta data. Exclua os transportes existentes na listagem antes de
            importar novamente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-outline-variant bg-surface-low/40 p-3 text-xs">
          {rotasConflitantes.map((item) => (
            <li
              key={item.transporteId}
              className="flex items-center justify-between gap-2"
            >
              <span className="font-semibold text-foreground">{item.rota}</span>
              <span className="text-muted-foreground">
                {item.ultimoMapaLoteId ? 'com mapa salvo' : item.status}
              </span>
            </li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogCancel type="button" onClick={onFechar}>
            Entendi
          </AlertDialogCancel>
          <Button type="button" size="sm" onClick={onFechar}>
            Fechar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
