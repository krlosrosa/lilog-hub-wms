'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { atualizarItensProcessoDebitoEmMassa } from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import {
  ParseValorizacaoDebitoError,
  parseValorizacaoDebitoXlsx,
} from '@/features/debito-transportadora/lib/parse-valorizacao-debito-xlsx';
import type { DebitoConferenciaItem } from '@/features/debito-transportadora/types/debito.schema';
import { ApiClientError } from '@/lib/api';

export type ValorizacaoPreviewItem = {
  itemId: string;
  sku: string;
  produto: string;
  pesoTotalKg: number | null;
  valorPorKg: number | null;
  valorDebito: number | null;
  matched: boolean;
  podeSalvar: boolean;
  motivoBloqueio: string | null;
};

type UseValorizacaoExcelOptions = {
  processoId: string;
  unidadeId: string | null;
  itens: readonly DebitoConferenciaItem[];
  onRefetch: () => Promise<void>;
};

function normalizarSku(sku: string): string {
  return sku.trim();
}

function buildPreview(
  itens: readonly DebitoConferenciaItem[],
  mapaValorPorKg: Map<string, number>,
): ValorizacaoPreviewItem[] {
  return itens.map((item) => {
    const sku = normalizarSku(item.sku);
    const valorPorKg = mapaValorPorKg.get(sku) ?? null;
    const matched = valorPorKg != null;
    const pesoTotalKg = item.pesoTotalKg;

    let motivoBloqueio: string | null = null;

    if (!matched) {
      motivoBloqueio = 'SKU não encontrado na planilha';
    } else if (pesoTotalKg == null || pesoTotalKg <= 0) {
      motivoBloqueio = 'Peso total indisponível';
    }

    const valorDebito =
      matched && pesoTotalKg != null && pesoTotalKg > 0
        ? Number((valorPorKg * pesoTotalKg).toFixed(2))
        : null;

    return {
      itemId: item.id,
      sku: item.sku,
      produto: item.produto,
      pesoTotalKg,
      valorPorKg,
      valorDebito,
      matched,
      podeSalvar: matched && valorDebito != null,
      motivoBloqueio,
    };
  });
}

export function useValorizacaoExcel({
  processoId,
  unidadeId,
  itens,
  onRefetch,
}: UseValorizacaoExcelOptions) {
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [mapaValorPorKg, setMapaValorPorKg] = useState<Map<string, number> | null>(
    null,
  );
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const preview = useMemo(() => {
    if (!mapaValorPorKg) {
      return [];
    }

    return buildPreview(itens, mapaValorPorKg);
  }, [itens, mapaValorPorKg]);

  const resumo = useMemo(() => {
    const itensSalvaveis = preview.filter((item) => item.podeSalvar);
    const itensSemCorrespondencia = preview.filter((item) => !item.matched);
    const valorTotal = itensSalvaveis.reduce(
      (acc, item) => acc + (item.valorDebito ?? 0),
      0,
    );

    return {
      totalItens: preview.length,
      itensSalvaveis: itensSalvaveis.length,
      itensSemCorrespondencia: itensSemCorrespondencia.length,
      valorTotal,
    };
  }, [preview]);

  const limpar = useCallback(() => {
    setNomeArquivo(null);
    setMapaValorPorKg(null);
  }, []);

  const processarArquivo = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.xlsx$/i)) {
        toast.error('Selecione um arquivo Excel (.xlsx)');
        return;
      }

      setIsParsing(true);

      try {
        const mapa = await parseValorizacaoDebitoXlsx(file);
        setMapaValorPorKg(mapa);
        setNomeArquivo(file.name);
        toast.success('Planilha carregada', {
          description: `${mapa.size} SKU(s) com valor por KG encontrado(s)`,
        });
      } catch (error) {
        limpar();

        const message =
          error instanceof ParseValorizacaoDebitoError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível ler a planilha.';

        toast.error(message);
      } finally {
        setIsParsing(false);
      }
    },
    [limpar],
  );

  const aplicarValorizacao = useCallback(async () => {
    if (!unidadeId || !mapaValorPorKg) {
      return;
    }

    const itensParaSalvar = preview.filter((item) => item.podeSalvar);

    if (itensParaSalvar.length === 0) {
      toast.error('Nenhum item elegível para valorização');
      return;
    }

    setIsSaving(true);

    try {
      await atualizarItensProcessoDebitoEmMassa(processoId, unidadeId, {
        itens: itensParaSalvar.map((item) => ({
          itemId: item.itemId,
          valorUnitario: item.valorPorKg,
          valorDebito: item.valorDebito ?? 0,
        })),
      });

      await onRefetch();
      limpar();

      toast.success('Valorização aplicada', {
        description: `${itensParaSalvar.length} item(ns) atualizado(s)`,
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível salvar a valorização.';

      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [limpar, mapaValorPorKg, onRefetch, preview, processoId, unidadeId]);

  return {
    nomeArquivo,
    preview,
    resumo,
    isParsing,
    isSaving,
    temPreview: preview.length > 0,
    processarArquivo,
    aplicarValorizacao,
    limpar,
  };
}
