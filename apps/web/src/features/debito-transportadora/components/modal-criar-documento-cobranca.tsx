'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { criarDocumentoCobranca } from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import type { DebitoOcorrencia } from '@/features/debito-transportadora/types/debito.schema';
import { DEBITO_TIPO_LABELS } from '@/features/debito-transportadora/types/debito.schema';
import { ApiClientError } from '@/lib/api';

type ModalCriarDocumentoCobrancaProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selecionados: DebitoOcorrencia[];
  transportadoraNome: string;
  transportadoraId: string | null;
  valorTotal: number;
  onSuccess: () => void;
};

function formatValor(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function ModalCriarDocumentoCobranca({
  open,
  onOpenChange,
  selecionados,
  transportadoraNome,
  transportadoraId,
  valorTotal,
  onSuccess,
}: ModalCriarDocumentoCobrancaProps) {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [observacao, setObservacao] = useState('');
  const [processando, setProcessando] = useState(false);

  const handleConfirmar = async () => {
    if (!unidadeId || selecionados.length === 0) {
      return;
    }

    setProcessando(true);

    try {
      const resultado = await criarDocumentoCobranca({
        unidadeId,
        transportadoraId,
        transportadoraNome,
        processoDebitoIds: selecionados.map((item) => item.id),
        observacao: observacao.trim() || undefined,
      });

      toast.success('Documento de cobrança criado', {
        description: resultado.numeroDocumento,
      });

      onSuccess();
      onOpenChange(false);
      setObservacao('');
      router.push(`/debito-transportadora/cobrancas/${resultado.id}`);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível criar o documento de cobrança.';

      toast.error(message);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-outline-variant bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Gerar documento de cobrança
          </DialogTitle>
          <DialogDescription>
            Revise as ocorrências selecionadas antes de confirmar a geração do
            documento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-outline-variant bg-surface-low p-3 text-sm">
            <div>
              <p className="text-caption text-muted-foreground">Transportadora</p>
              <p className="font-semibold text-foreground">{transportadoraNome}</p>
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Ocorrências</p>
              <p className="font-semibold text-foreground">
                {selecionados.length}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-caption text-muted-foreground">Valor total</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {formatValor(valorTotal)}
              </p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-outline-variant">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-highest">
                <tr className="text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Protocolo</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {selecionados.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-mono font-semibold text-foreground">
                      {item.protocolo}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {DEBITO_TIPO_LABELS[item.tipo]}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {formatValor(item.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="block space-y-1.5">
            <span className="text-caption font-medium text-foreground">
              Observação (opcional)
            </span>
            <textarea
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Informações adicionais para o documento..."
              className="w-full resize-none rounded-lg border border-input bg-surface-low px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={processando}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={processando}
            onClick={() => void handleConfirmar()}
          >
            {processando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Gerando…
              </>
            ) : (
              'Confirmar e gerar documento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
