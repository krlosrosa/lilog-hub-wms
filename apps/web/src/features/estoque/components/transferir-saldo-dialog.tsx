'use client';

import { useCallback, useEffect, useState } from 'react';

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
import { Loader2, Search } from 'lucide-react';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listEnderecos } from '@/features/enderecos/lib/endereco-api';
import type { SaldoDetalhe } from '@/features/estoque/types/estoque-gestao.schema';
import { ApiClientError } from '@/lib/api';

type TransferirSaldoDialogProps = {
  open: boolean;
  saldo: SaldoDetalhe;
  processando: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: {
    enderecoDestinoId: string;
    quantidade: number;
    observacao?: string;
  }) => void;
};

const fieldClassName = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

type EnderecoOption = {
  id: string;
  enderecoMascarado: string;
  status: string;
};

export function TransferirSaldoDialog({
  open,
  saldo,
  processando,
  onOpenChange,
  onConfirm,
}: TransferirSaldoDialogProps) {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [enderecoDestinoId, setEnderecoDestinoId] = useState('');
  const [quantidade, setQuantidade] = useState(String(saldo.quantidade));
  const [observacao, setObservacao] = useState('');
  const [buscaEndereco, setBuscaEndereco] = useState('');
  const [enderecos, setEnderecos] = useState<EnderecoOption[]>([]);
  const [carregandoEnderecos, setCarregandoEnderecos] = useState(false);

  const carregarEnderecos = useCallback(async () => {
    if (!unidadeId || !open) {
      return;
    }

    setCarregandoEnderecos(true);

    try {
      const response = await listEnderecos({
        unidadeId,
        search: buscaEndereco.trim() || undefined,
        limit: 50,
        page: 1,
      });

      setEnderecos(
        response.items
          .filter((item) => item.id !== saldo.enderecoId)
          .map((item) => ({
            id: item.id,
            enderecoMascarado: item.enderecoMascarado,
            status: item.status,
          })),
      );
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar endereços.';

      setEnderecos([]);
      console.error(message);
    } finally {
      setCarregandoEnderecos(false);
    }
  }, [buscaEndereco, open, saldo.enderecoId, unidadeId]);

  useEffect(() => {
    if (!open) {
      setEnderecoDestinoId('');
      setQuantidade(String(saldo.quantidade));
      setObservacao('');
      setBuscaEndereco('');
      return;
    }

    const timer = setTimeout(() => {
      void carregarEnderecos();
    }, 300);

    return () => clearTimeout(timer);
  }, [carregarEnderecos, open, saldo.quantidade]);

  const quantidadeNumerica = Number(quantidade);
  const quantidadeValida =
    quantidade.trim() !== '' &&
    Number.isFinite(quantidadeNumerica) &&
    quantidadeNumerica > 0 &&
    quantidadeNumerica <= saldo.quantidade;

  const handleConfirm = () => {
    if (!enderecoDestinoId || !quantidadeValida) {
      return;
    }

    onConfirm({
      enderecoDestinoId,
      quantidade: quantidadeNumerica,
      observacao: observacao.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle>Transferir para outra posição</DialogTitle>
          <DialogDescription>
            Mover quantidade do endereço{' '}
            <span className="font-mono font-semibold text-foreground">
              {saldo.enderecoMascarado}
            </span>{' '}
            para uma nova posição no depósito {saldo.depositoCodigo}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="busca-endereco-destino"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Endereço destino <span className="text-destructive">*</span>
            </label>
            <div className="relative mb-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="busca-endereco-destino"
                value={buscaEndereco}
                onChange={(event) => setBuscaEndereco(event.target.value)}
                className={cn(fieldClassName, 'pl-9')}
                placeholder="Buscar endereço..."
              />
            </div>
            <select
              value={enderecoDestinoId}
              onChange={(event) => setEnderecoDestinoId(event.target.value)}
              className={fieldClassName}
              disabled={carregandoEnderecos}
            >
              <option value="">
                {carregandoEnderecos
                  ? 'Carregando endereços...'
                  : 'Selecione o endereço destino'}
              </option>
              {enderecos.map((endereco) => (
                <option key={endereco.id} value={endereco.id}>
                  {endereco.enderecoMascarado} ({endereco.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quantidade-transferencia"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Quantidade <span className="text-destructive">*</span>
            </label>
            <input
              id="quantidade-transferencia"
              type="number"
              min={0}
              max={saldo.quantidade}
              step="any"
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
              className={fieldClassName}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Máximo disponível: {saldo.quantidade} {saldo.unidadeMedida}
            </p>
          </div>

          <div>
            <label
              htmlFor="observacao-transferencia"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Observação
            </label>
            <textarea
              id="observacao-transferencia"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              rows={2}
              className={fieldClassName}
              placeholder="Motivo da transferência (opcional)..."
            />
          </div>
        </div>

        <DialogFooter>
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
            disabled={
              processando || !enderecoDestinoId || !quantidadeValida
            }
            onClick={handleConfirm}
            className="gap-2"
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Confirmar transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
