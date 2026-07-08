'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { Loader2, Scale } from 'lucide-react';

import type { ItemPesoVariavelElegivel } from '@/features/devolucao/lib/resolve-itens-peso-variavel';
import type { FaltaPesoDetalhe } from '@/features/devolucao/types/devolucao-falta-peso.schema';
import { MOTIVO_FALTA_PESO_DEVOLUCAO } from '@/features/devolucao/types/devolucao-falta-peso.schema';

export type FaltaPesoFormValues = {
  notaFiscalId?: string;
  itemId: string;
  sku: string;
  diferencaKg: number;
  zerarQuantidadeContabil: boolean;
  observacao: string;
  faltaPesoId?: string;
};

type ModalRegistrarFaltaPesoProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (values: FaltaPesoFormValues) => void | Promise<void>;
  itensElegiveis: ItemPesoVariavelElegivel[];
  faltaPesoEdicao?: FaltaPesoDetalhe | null;
  isLoading?: boolean;
};

function parseKgInput(value: string): number | null {
  const parsed = Number(value.replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function formatKgInput(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function ModalRegistrarFaltaPeso({
  open,
  onClose,
  onConfirm,
  itensElegiveis,
  faltaPesoEdicao = null,
  isLoading = false,
}: ModalRegistrarFaltaPesoProps) {
  const isEditMode = faltaPesoEdicao != null;

  const [itemId, setItemId] = useState('');
  const [diferencaKg, setDiferencaKg] = useState('');
  const [zerarQuantidadeContabil, setZerarQuantidadeContabil] = useState(true);
  const [observacao, setObservacao] = useState('');

  const itemSelecionado = useMemo(() => {
    if (isEditMode && faltaPesoEdicao) {
      return (
        itensElegiveis.find((entry) => entry.item.id === faltaPesoEdicao.itemId) ??
        ({
          notaFiscalId: faltaPesoEdicao.notaFiscalId,
          numeroNf: '—',
          item: {
            id: faltaPesoEdicao.itemId,
            sku: faltaPesoEdicao.sku,
            descricaoProduto: faltaPesoEdicao.descricaoProduto,
          },
        } as ItemPesoVariavelElegivel)
      );
    }

    return itensElegiveis.find((entry) => entry.item.id === itemId) ?? null;
  }, [faltaPesoEdicao, isEditMode, itemId, itensElegiveis]);

  const diferencaNum = parseKgInput(diferencaKg);

  useEffect(() => {
    if (!open) return;

    if (faltaPesoEdicao) {
      setItemId(faltaPesoEdicao.itemId);
      setDiferencaKg(formatKgInput(faltaPesoEdicao.pesoFaltanteKg));
      setZerarQuantidadeContabil(faltaPesoEdicao.zerarQuantidadeContabil);
      setObservacao(faltaPesoEdicao.observacao ?? '');
      return;
    }

    const primeiro = itensElegiveis[0];
    if (!primeiro) {
      setItemId('');
      return;
    }

    setItemId(primeiro.item.id);
    setDiferencaKg('');
    setZerarQuantidadeContabil(true);
    setObservacao('');
  }, [open, faltaPesoEdicao, itensElegiveis]);

  const handleConfirm = () => {
    if (!itemSelecionado || !diferencaNum || diferencaNum <= 0) return;

    void onConfirm({
      notaFiscalId: itemSelecionado.notaFiscalId,
      itemId: itemSelecionado.item.id,
      sku: itemSelecionado.item.sku,
      diferencaKg: diferencaNum,
      zerarQuantidadeContabil,
      observacao: observacao.trim(),
      faltaPesoId: faltaPesoEdicao?.id,
    });
  };

  const podeConfirmar =
    !isLoading &&
    itemSelecionado &&
    diferencaNum != null &&
    diferencaNum > 0 &&
    (isEditMode || itensElegiveis.length > 0);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border-outline-variant bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Scale className="size-4 text-primary" aria-hidden />
            {isEditMode ? 'Editar diferença de peso' : 'Registrar diferença de peso'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Informe a diferença em kg para o item variável (PVAR). Motivo:{' '}
            <span className="font-medium text-foreground">
              {MOTIVO_FALTA_PESO_DEVOLUCAO}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {!isEditMode && itensElegiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Não há itens de peso variável elegíveis nesta demanda.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="falta-peso-item"
                className="text-xs font-medium text-foreground"
              >
                Item (peso variável)
              </label>
              {isEditMode ? (
                <p className="rounded-md border border-outline-variant bg-muted/20 px-3 py-2 text-sm text-foreground">
                  {itemSelecionado?.item.sku} —{' '}
                  {itemSelecionado?.item.descricaoProduto ??
                    itemSelecionado?.item.sku}
                </p>
              ) : (
                <select
                  id="falta-peso-item"
                  value={itemId}
                  onChange={(event) => setItemId(event.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-md border border-outline-variant bg-background px-3 py-2 text-sm text-foreground"
                >
                  {itensElegiveis.map((entry) => (
                    <option key={entry.item.id} value={entry.item.id}>
                      NF {entry.numeroNf} · {entry.item.sku} —{' '}
                      {entry.item.descricaoProduto ?? entry.item.sku}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="diferenca-kg"
                className="text-xs font-medium text-foreground"
              >
                Diferença (kg)
              </label>
              <input
                id="diferenca-kg"
                type="text"
                inputMode="decimal"
                value={diferencaKg}
                onChange={(event) => setDiferencaKg(event.target.value)}
                disabled={isLoading}
                placeholder="0,200"
                className="w-full rounded-md border border-outline-variant bg-background px-3 py-2 text-sm tabular-nums text-foreground"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-outline-variant bg-muted/10 px-3 py-2.5">
              <input
                type="checkbox"
                checked={zerarQuantidadeContabil}
                onChange={(event) =>
                  setZerarQuantidadeContabil(event.target.checked)
                }
                disabled={isLoading}
                className="mt-0.5 size-4 rounded border-outline-variant"
              />
              <span className="text-xs leading-relaxed text-foreground">
                Zerar quantidade contábil (caixas) na conferência
                <span className="mt-0.5 block text-muted-foreground">
                  {zerarQuantidadeContabil
                    ? 'O previsto será considerado 0, mantendo a quantidade fiscal da NF apenas como referência.'
                    : 'A quantidade fiscal da NF continuará sendo usada na conferência; apenas a diferença de peso será registrada.'}
                </span>
              </span>
            </label>

            <div className="space-y-1.5">
              <label
                htmlFor="falta-peso-observacao"
                className="text-xs font-medium text-foreground"
              >
                Observação (opcional)
              </label>
              <textarea
                id="falta-peso-observacao"
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                disabled={isLoading}
                rows={2}
                className="w-full resize-none rounded-md border border-outline-variant bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!podeConfirmar}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : null}
            {isEditMode ? 'Salvar' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Use FaltaPesoFormValues */
export type RegistrarFaltaPesoFormValues = FaltaPesoFormValues;
