'use client';

import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import type { UpdateCncItemBody } from '@/features/cnc/lib/cnc-api';
import type { CncItem } from '@/features/cnc/types/cnc.schema';
import { CNC_SUBTIPO_LABELS } from '@/features/cnc/types/cnc.schema';

type ModalEditarItemCncProps = {
  open: boolean;
  item: CncItem;
  processando: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirm: (body: UpdateCncItemBody) => void;
};

const inputClass = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

function formatPesoInput(value: number | null): string {
  return value !== null ? String(value) : '';
}

function formatQuantidadeInput(value: number | null): string {
  return value !== null ? String(value) : '';
}

export function ModalEditarItemCnc({
  open,
  item,
  processando,
  onOpenChange,
  onConfirm,
}: ModalEditarItemCncProps) {
  const isPesoDivergente = item.subtipoOcorrencia === 'peso_divergente';

  const [esperado, setEsperado] = useState(
    isPesoDivergente
      ? formatPesoInput(item.pesoEsperado)
      : formatQuantidadeInput(item.quantidadeEsperada),
  );
  const [recebido, setRecebido] = useState(
    isPesoDivergente
      ? formatPesoInput(item.pesoRecebido)
      : formatQuantidadeInput(item.quantidadeRecebida),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setEsperado(
      isPesoDivergente
        ? formatPesoInput(item.pesoEsperado)
        : formatQuantidadeInput(item.quantidadeEsperada),
    );
    setRecebido(
      isPesoDivergente
        ? formatPesoInput(item.pesoRecebido)
        : formatQuantidadeInput(item.quantidadeRecebida),
    );
  }, [
    open,
    item,
    isPesoDivergente,
    item.pesoEsperado,
    item.pesoRecebido,
    item.quantidadeEsperada,
    item.quantidadeRecebida,
  ]);

  const handleConfirm = () => {
    const esperadoNum = esperado.trim() === '' ? null : Number(esperado);
    const recebidoNum = recebido.trim() === '' ? null : Number(recebido);

    if (
      (esperadoNum !== null && Number.isNaN(esperadoNum)) ||
      (recebidoNum !== null && Number.isNaN(recebidoNum))
    ) {
      return;
    }

    if (isPesoDivergente) {
      onConfirm({
        pesoEsperado: esperadoNum,
        pesoRecebido: recebidoNum,
      });
      return;
    }

    onConfirm({
      quantidadeEsperada: esperadoNum,
      quantidadeRecebida: recebidoNum,
    });
  };

  const unidadeSuffix = isPesoDivergente ? 'Kg' : (item.unidadeMedida ?? '');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Editar item</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1 text-left">
              <p className="font-mono text-xs font-semibold text-primary">
                {item.sku ?? item.produtoId ?? '—'}
              </p>
              <p className="text-sm text-foreground">
                {item.descricaoProduto ?? 'Sem descrição cadastrada'}
              </p>
              {item.subtipoOcorrencia ? (
                <p className="text-xs text-muted-foreground">
                  {CNC_SUBTIPO_LABELS[item.subtipoOcorrencia]}
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="item-esperado"
              className="text-xs font-semibold text-foreground"
            >
              {isPesoDivergente ? 'Peso esperado' : 'Quantidade esperada'}
            </label>
            <div className="relative">
              <input
                id="item-esperado"
                type="number"
                step="any"
                min="0"
                value={esperado}
                onChange={(event) => setEsperado(event.target.value)}
                className={cn(inputClass, unidadeSuffix ? 'pr-12' : undefined)}
                placeholder="0"
              />
              {unidadeSuffix ? (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  {unidadeSuffix}
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="item-recebido"
              className="text-xs font-semibold text-foreground"
            >
              {isPesoDivergente ? 'Peso recebido' : 'Quantidade recebida'}
            </label>
            <div className="relative">
              <input
                id="item-recebido"
                type="number"
                step="any"
                min="0"
                value={recebido}
                onChange={(event) => setRecebido(event.target.value)}
                className={cn(inputClass, unidadeSuffix ? 'pr-12' : undefined)}
                placeholder="0"
              />
              {unidadeSuffix ? (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  {unidadeSuffix}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            disabled={processando}
            onClick={handleConfirm}
          >
            {processando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
