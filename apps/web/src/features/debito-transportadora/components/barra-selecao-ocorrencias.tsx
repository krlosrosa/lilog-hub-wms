'use client';

import { Button, cn } from '@lilog/ui';
import { FileText, X } from 'lucide-react';

type BarraSelecaoOcorrenciasProps = {
  quantidade: number;
  transportadora: string;
  valorTotal: number;
  onGerarDocumento: () => void;
  onLimpar: () => void;
};

function formatValor(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function BarraSelecaoOcorrencias({
  quantidade,
  transportadora,
  valorTotal,
  onGerarDocumento,
  onLimpar,
}: BarraSelecaoOcorrenciasProps) {
  if (quantidade === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-card/95 px-4 py-3 shadow-lg backdrop-blur-md',
        'md:px-margin-desktop',
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {quantidade}{' '}
            {quantidade === 1 ? 'ocorrência selecionada' : 'ocorrências selecionadas'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {transportadora} · {formatValor(valorTotal)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onLimpar}
          >
            <X className="size-3.5" aria-hidden />
            Limpar seleção
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={onGerarDocumento}
          >
            <FileText className="size-3.5" aria-hidden />
            Gerar documento de cobrança
          </Button>
        </div>
      </div>
    </div>
  );
}
