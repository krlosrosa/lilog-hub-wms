'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  deleteUnidade,
  getUnidade,
} from '@/features/filiais/lib/unidade-api';
import { mapUnidadeToFormValues } from '@/features/filiais/lib/map-filial-lista-to-form';
import {
  useFilialForm,
  type UseFilialFormOptions,
} from '@/features/filiais/hooks/use-filial-form';
import type { FilialListaItem } from '@/features/filiais/types/filial-lista.schema';
import type { CentroAtrelado } from '@/features/filiais/types/filial.schema';
import { ApiClientError } from '@/lib/api';

export function useFilialDetalhe(filialId: string) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [filial, setFilial] = useState<FilialListaItem | null>(null);
  const [centrosIniciais, setCentrosIniciais] = useState<CentroAtrelado[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);

      try {
        const unidade = await getUnidade(filialId);

        if (!ativo) {
          return;
        }

        setFilial({
          id: unidade.id,
          nome: unidade.nome,
          nomeFilial: unidade.nomeFilial,
          cluster: unidade.cluster,
          centrosCount: unidade.centros.length,
        });

        setCentrosIniciais(
          unidade.centros.map((centro) => ({
            id: centro.id,
            centro: centro.centro,
            nome: centro.nome,
            empresa: centro.empresa,
          })),
        );
      } catch (error) {
        if (!ativo) {
          return;
        }

        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar a unidade';

        toast.error(message);
        setFilial(null);
        setCentrosIniciais([]);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [filialId]);

  const seedConfig = useMemo(() => {
    if (!filial) {
      return undefined;
    }

    return {
      key: filial.id,
      values: mapUnidadeToFormValues({
        id: filial.id,
        nome: filial.nome,
        cluster: filial.cluster,
        nomeFilial: filial.nomeFilial,
        createdAt: '',
        updatedAt: '',
        centros: [],
      }),
    };
  }, [filial]);

  const opcoesFilialForm = useMemo<UseFilialFormOptions | undefined>(() => {
    if (!seedConfig) {
      return undefined;
    }

    return {
      mode: 'edit',
      unidadeId: filialId,
      seed: seedConfig,
      initialCentros: centrosIniciais,
    };
  }, [seedConfig, filialId, centrosIniciais]);

  const formHook = useFilialForm(opcoesFilialForm);

  const [dialogExclusaoAberta, setDialogExclusaoAberta] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const solicitarExclusao = useCallback(() => {
    setDialogExclusaoAberta(true);
  }, []);

  const confirmarExclusao = useCallback(async () => {
    setExcluindo(true);

    try {
      await deleteUnidade(filialId);

      toast.success('Unidade excluída!', {
        description: filial ? `${filial.nome} (${filial.id})` : undefined,
      });

      setDialogExclusaoAberta(false);
      router.push('/unidades');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível excluir a unidade';

      toast.error(message);
    } finally {
      setExcluindo(false);
    }
  }, [filial, filialId, router]);

  const voltarLista = useCallback(() => {
    router.push('/unidades');
  }, [router]);

  return {
    ...formHook,
    filial,
    carregando,
    dialogExclusaoAberta,
    setDialogExclusaoAberta,
    solicitarExclusao,
    confirmarExclusao,
    excluindo,
    voltarLista,
  };
}
