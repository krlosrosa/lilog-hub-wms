'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  calcularTotalAdicionais,
  calcularTotalPago,
  calcularVariacao,
  montarCustoFreteItem,
} from '@/features/transporte/lib/calcular-custo-frete';
import { calcularCustoPrevisto } from '@/features/transporte/lib/calcular-custo';
import { buscarCustoFretePorId } from '@/features/transporte/mocks/custo-frete.mock';
import type {
  CustoAdicionalItem,
  CustoFreteRealizado,
  StatusCustoFrete,
  TipoCustoAdicional,
} from '@/features/transporte/types/transporte.schema';
import { TIPO_CUSTO_ADICIONAL_LABELS } from '@/features/transporte/types/transporte.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolverStatusInformativo(
  totalPago: number,
  statusAtual: StatusCustoFrete,
): StatusCustoFrete {
  if (statusAtual === 'contestado') {
    return 'contestado';
  }

  if (totalPago > 0) {
    return 'pago';
  }

  return 'pendente';
}

function criarItemAdicional(tipo: TipoCustoAdicional = 'outros'): CustoAdicionalItem {
  return {
    id: `ca-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo,
    descricao: TIPO_CUSTO_ADICIONAL_LABELS[tipo],
    valor: 0,
  };
}

export function useCustoFreteDetalhe(custoFreteId: string) {
  const itemInicial = buscarCustoFretePorId(custoFreteId);

  const [custoFrete, setCustoFrete] = useState<CustoFreteRealizado | null>(
    () => itemInicial?.custoFrete ?? null,
  );
  const [custoDiariaPago, setCustoDiariaPago] = useState(
    () => itemInicial?.custoFrete.custoDiariaPago ?? 0,
  );
  const [custosAdicionais, setCustosAdicionais] = useState<CustoAdicionalItem[]>(
    () => itemInicial?.custoFrete.custosAdicionais ?? [],
  );
  const [status] = useState<StatusCustoFrete>(
    () => itemInicial?.custoFrete.status ?? 'pendente',
  );
  const [observacoes, setObservacoes] = useState(
    () => itemInicial?.custoFrete.observacoes ?? '',
  );
  const [salvando, setSalvando] = useState(false);

  const transporte = itemInicial?.transporte ?? null;

  const custoPrevistoDetalhado = useMemo(() => {
    if (!transporte) {
      return null;
    }

    const tipoVeiculo =
      transporte.veiculoAlocado?.tipo ?? transporte.perfilEsperado;

    return calcularCustoPrevisto(tipoVeiculo);
  }, [transporte]);

  const totalAdicionais = useMemo(
    () => calcularTotalAdicionais(custosAdicionais),
    [custosAdicionais],
  );

  const totalPago = useMemo(
    () => calcularTotalPago(custoDiariaPago, custosAdicionais),
    [custoDiariaPago, custosAdicionais],
  );

  const custoPrevisto = custoPrevistoDetalhado?.total ?? 0;

  const variacao = useMemo(
    () => calcularVariacao(custoPrevisto, totalPago),
    [custoPrevisto, totalPago],
  );

  const itemAtualizado = useMemo(() => {
    if (!custoFrete || !transporte) {
      return undefined;
    }

    const atualizado: CustoFreteRealizado = {
      ...custoFrete,
      custoDiariaPago,
      custosAdicionais,
      totalAdicionais,
      totalPago,
      status: resolverStatusInformativo(totalPago, status),
      observacoes: observacoes.trim() || undefined,
    };

    return montarCustoFreteItem(atualizado, transporte);
  }, [
    custoFrete,
    transporte,
    custoDiariaPago,
    custosAdicionais,
    totalAdicionais,
    totalPago,
    status,
    observacoes,
  ]);

  const adicionarCustoAdicional = useCallback(() => {
    setCustosAdicionais((prev) => [...prev, criarItemAdicional()]);
  }, []);

  const removerCustoAdicional = useCallback((id: string) => {
    setCustosAdicionais((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const atualizarCustoAdicional = useCallback(
    (id: string, patch: Partial<CustoAdicionalItem>) => {
      setCustosAdicionais((prev) =>
        prev.map((item) => {
          if (item.id !== id) {
            return item;
          }

          const atualizado = { ...item, ...patch };

          if (patch.tipo && !patch.descricao) {
            atualizado.descricao = TIPO_CUSTO_ADICIONAL_LABELS[patch.tipo];
          }

          return atualizado;
        }),
      );
    },
    [],
  );

  const salvar = useCallback(async () => {
    if (!custoFrete) {
      return;
    }

    setSalvando(true);

    try {
      await delay(600);

      const statusAtualizado = resolverStatusInformativo(totalPago, status);

      const atualizado: CustoFreteRealizado = {
        ...custoFrete,
        custoDiariaPago,
        custosAdicionais,
        totalAdicionais,
        totalPago,
        status: statusAtualizado,
        observacoes: observacoes.trim() || undefined,
        dataPagamento:
          statusAtualizado === 'pago'
            ? new Date().toISOString().slice(0, 10)
            : custoFrete.dataPagamento,
      };

      setCustoFrete(atualizado);
      toast.success('Custos de frete salvos com sucesso.');
    } finally {
      setSalvando(false);
    }
  }, [
    custoFrete,
    custoDiariaPago,
    custosAdicionais,
    totalAdicionais,
    totalPago,
    status,
    observacoes,
  ]);

  return {
    item: itemAtualizado,
    transporte,
    custoPrevistoDetalhado,
    custoPrevisto,
    custoDiariaPago,
    setCustoDiariaPago,
    custosAdicionais,
    totalAdicionais,
    totalPago,
    variacao,
    status: resolverStatusInformativo(totalPago, status),
    observacoes,
    setObservacoes,
    salvando,
    adicionarCustoAdicional,
    removerCustoAdicional,
    atualizarCustoAdicional,
    salvar,
  };
}
