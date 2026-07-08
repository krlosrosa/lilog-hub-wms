'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  ajustarSaldoEndereco,
  bloquearSaldoEndereco,
  desbloquearSaldoEndereco,
  getSaldoEndereco,
  listMotivosBloqueioSaldo,
  mapSaldoEnderecoDetalheApi,
  transferirSaldoEndereco,
} from '@/features/estoque/lib/estoque-api';
import type { SaldoDetalhe } from '@/features/estoque/types/estoque-gestao.schema';
import type {
  AjustarSaldoEnderecoBody,
  BloquearSaldoEnderecoBody,
  DesbloquearSaldoEnderecoBody,
  MotivoBloqueioSaldoApi,
  TransferirSaldoEnderecoBody,
} from '@/features/estoque/types/estoque.api';
import { ApiClientError } from '@/lib/api';

export function useSaldoDetalhe(saldoEnderecoId: string) {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [saldo, setSaldo] = useState<SaldoDetalhe | null>(null);
  const [motivosBloqueio, setMotivosBloqueio] = useState<MotivoBloqueioSaldoApi[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const carregarDetalhe = useCallback(async () => {
    if (!unidadeId) {
      setSaldo(null);
      setNotFound(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);

    try {
      const [saldoResponse, motivosResponse] = await Promise.all([
        getSaldoEndereco(saldoEnderecoId),
        listMotivosBloqueioSaldo(unidadeId),
      ]);

      setSaldo(mapSaldoEnderecoDetalheApi(saldoResponse));
      setMotivosBloqueio(motivosResponse.items);
    } catch (error) {
      setSaldo(null);

      if (error instanceof ApiClientError && error.status === 404) {
        setNotFound(true);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o saldo.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [saldoEnderecoId, unidadeId]);

  useEffect(() => {
    void carregarDetalhe();
  }, [carregarDetalhe]);

  const executarAcao = useCallback(
    async (acao: () => Promise<unknown>, mensagemSucesso: string) => {
      setProcessandoAcao(true);

      try {
        await acao();
        toast.success(mensagemSucesso);
        await carregarDetalhe();
        return true;
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível concluir a ação.';

        toast.error(message);
        return false;
      } finally {
        setProcessandoAcao(false);
      }
    },
    [carregarDetalhe],
  );

  const bloquear = useCallback(
    (body: BloquearSaldoEnderecoBody) =>
      executarAcao(
        () => bloquearSaldoEndereco(saldoEnderecoId, body),
        'Saldo bloqueado com sucesso.',
      ),
    [executarAcao, saldoEnderecoId],
  );

  const desbloquear = useCallback(
    (body: DesbloquearSaldoEnderecoBody = {}) =>
      executarAcao(
        () => desbloquearSaldoEndereco(saldoEnderecoId, body),
        'Saldo desbloqueado com sucesso.',
      ),
    [executarAcao, saldoEnderecoId],
  );

  const ajustar = useCallback(
    (body: AjustarSaldoEnderecoBody) =>
      executarAcao(
        () => ajustarSaldoEndereco(saldoEnderecoId, body),
        'Saldo ajustado com sucesso.',
      ),
    [executarAcao, saldoEnderecoId],
  );

  const transferir = useCallback(
    (body: TransferirSaldoEnderecoBody) =>
      executarAcao(
        () => transferirSaldoEndereco(saldoEnderecoId, body),
        'Transferência registrada com sucesso.',
      ),
    [executarAcao, saldoEnderecoId],
  );

  return {
    saldo,
    motivosBloqueio,
    isLoading,
    notFound,
    processandoAcao,
    recarregar: carregarDetalhe,
    actions: {
      bloquear,
      desbloquear,
      ajustar,
      transferir,
    },
  };
}
