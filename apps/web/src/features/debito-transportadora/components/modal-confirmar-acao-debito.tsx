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

import type { DebitoDetalhe } from '@/features/debito-transportadora/types/debito.schema';

export type AcaoDebitoConfirmacao = 'assinatura' | 'cancelar';

type ModalConfirmarAcaoDebitoProps = {
  open: boolean;
  acao: AcaoDebitoConfirmacao | null;
  debito: DebitoDetalhe;
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
  AcaoDebitoConfirmacao,
  {
    title: string;
    confirmLabel: string;
    destructive?: boolean;
  }
> = {
  assinatura: {
    title: 'Enviar para assinatura?',
    confirmLabel: 'Enviar para assinatura',
  },
  cancelar: {
    title: 'Cancelar cobrança?',
    confirmLabel: 'Confirmar cancelamento',
    destructive: true,
  },
};

export function ModalConfirmarAcaoDebito({
  open,
  acao,
  debito,
  processando,
  onOpenChange,
  onConfirm,
}: ModalConfirmarAcaoDebitoProps) {
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
              {acao === 'assinatura' ? (
                <p>
                  A cobrança{' '}
                  <span className="font-semibold text-foreground">
                    {debito.protocolo}
                  </span>{' '}
                  será encaminhada para fluxo de assinatura digital. A
                  transportadora{' '}
                  <span className="font-semibold text-foreground">
                    {debito.transportadora}
                  </span>{' '}
                  receberá a carta de débito para validação.
                </p>
              ) : (
                <p>
                  A cobrança{' '}
                  <span className="font-semibold text-foreground">
                    {debito.protocolo}
                  </span>{' '}
                  será cancelada e não poderá ser reenviada sem nova análise.
                  Esta ação é simulada apenas em memória (mock).
                </p>
              )}
              <p className="rounded-lg border border-outline-variant bg-surface-low px-3 py-2 text-sm">
                Valor reclamado:{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrency(debito.valorReclamado)}
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
