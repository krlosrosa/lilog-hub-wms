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

import type {
  AcaoDocumentoConfirmacao,
  DocumentoCobrancaDetalhe,
} from '@/features/debito-transportadora/types/documento-cobranca.schema';

type ModalConfirmarAcaoDocumentoProps = {
  open: boolean;
  acao: AcaoDocumentoConfirmacao | null;
  documento: DocumentoCobrancaDetalhe;
  processando: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirm: () => void;
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const CONFIG: Record<
  AcaoDocumentoConfirmacao,
  {
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
  }
> = {
  emitir: {
    title: 'Emitir documento de cobrança?',
    description:
      'O documento será marcado como emitido e ficará pronto para envio à transportadora.',
    confirmLabel: 'Emitir documento',
  },
  enviar: {
    title: 'Marcar documento como enviado?',
    description:
      'Confirma que o documento foi enviado à transportadora para cobrança.',
    confirmLabel: 'Marcar como enviado',
  },
  marcarPago: {
    title: 'Marcar documento como pago?',
    description:
      'Confirma o recebimento do valor total deste documento de cobrança.',
    confirmLabel: 'Marcar como pago',
  },
  cancelar: {
    title: 'Cancelar documento de cobrança?',
    description:
      'O documento será cancelado. Esta ação não pode ser desfeita.',
    confirmLabel: 'Confirmar cancelamento',
    destructive: true,
  },
};

export function ModalConfirmarAcaoDocumento({
  open,
  acao,
  documento,
  processando,
  onOpenChange,
  onConfirm,
}: ModalConfirmarAcaoDocumentoProps) {
  if (!acao) {
    return null;
  }

  const config = CONFIG[acao];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-muted-foreground">
              <p>{config.description}</p>
              <p className="rounded-lg border border-outline-variant bg-surface-low px-3 py-2 text-sm">
                Documento{' '}
                <span className="font-semibold text-foreground">
                  {documento.numeroDocumento}
                </span>{' '}
                · {documento.transportadora} ·{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrency(documento.valorTotal)}
                </span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={processando}>
            Voltar
          </AlertDialogCancel>
          <Button
            type="button"
            variant={config.destructive ? 'destructive' : 'default'}
            disabled={processando}
            onClick={onConfirm}
          >
            {processando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Processando…
              </>
            ) : (
              config.confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
