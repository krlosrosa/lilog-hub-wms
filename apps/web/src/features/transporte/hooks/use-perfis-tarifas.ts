'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  createPerfilTarifa,
  listPerfisTarifas,
  mapPerfilTarifaToItem,
  updatePerfilTarifa,
  upsertFaixasKm,
} from '@/features/transporte/lib/perfis-tarifas-api';
import type {
  FaixaKmItem,
  PerfilTarifaFormValues,
  PerfilTarifaItem,
  TipoCarga,
} from '@/features/transporte/types/perfil-tarifa.schema';
import { ApiClientError } from '@/lib/api';

export type PerfilFormDialogState = {
  open: boolean;
  editingItem: PerfilTarifaItem | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export type TipoCargaFiltro = TipoCarga | null;

export function usePerfisTarifas() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [tipoCargaFiltro, setTipoCargaFiltro] = useState<TipoCargaFiltro>(null);
  const [perfis, setPerfis] = useState<PerfilTarifaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [perfilEditando, setPerfilEditando] = useState<PerfilTarifaItem | null>(
    null,
  );
  const [dadosPerfilEditando, setDadosPerfilEditando] =
    useState<PerfilTarifaItem | null>(null);

  const [perfilFormDialog, setPerfilFormDialog] =
    useState<PerfilFormDialogState>({
      open: false,
      editingItem: null,
    });

  const [tarifaEditandoId, setTarifaEditandoId] = useState<string | null>(null);
  const [faixasEditando, setFaixasEditando] = useState<FaixaKmItem[]>([]);
  const [tarifaSalvaComSucessoId, setTarifaSalvaComSucessoId] = useState<
    string | null
  >(null);

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setPerfis([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listPerfisTarifas({
        unidadeId,
      });

      setPerfis(response.items.map(mapPerfilTarifaToItem));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível carregar os perfis.'));
      setPerfis([]);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const perfisFiltrados = useMemo(() => {
    if (!tipoCargaFiltro) {
      return perfis;
    }

    return perfis.filter((perfil) => perfil.tipoCarga === tipoCargaFiltro);
  }, [perfis, tipoCargaFiltro]);

  const abrirEdicaoPerfil = useCallback((perfil: PerfilTarifaItem) => {
    setPerfilEditando(perfil);
    setDadosPerfilEditando({ ...perfil });
  }, []);

  const atualizarCampoPerfil = useCallback(
    <K extends keyof PerfilTarifaItem>(campo: K, valor: PerfilTarifaItem[K]) => {
      setDadosPerfilEditando((atual) =>
        atual ? { ...atual, [campo]: valor } : atual,
      );
    },
    [],
  );

  const cancelarEdicaoPerfil = useCallback(() => {
    setPerfilEditando(null);
    setDadosPerfilEditando(null);
  }, []);

  const salvarPerfil = useCallback(async () => {
    if (!dadosPerfilEditando || !perfilEditando) {
      return;
    }

    if (
      dadosPerfilEditando.nome.trim().length === 0 ||
      dadosPerfilEditando.peso <= 0
    ) {
      toast.error('Preencha todos os campos obrigatórios com valores válidos.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePerfilTarifa(perfilEditando.id, {
        nome: dadosPerfilEditando.nome.trim(),
        descricao: dadosPerfilEditando.descricao?.trim() || null,
        peso: dadosPerfilEditando.peso,
        cubagem: dadosPerfilEditando.cubagem,
        tipoCarga: dadosPerfilEditando.tipoCarga,
      });

      toast.success(`Perfil ${dadosPerfilEditando.nome} atualizado.`);
      cancelarEdicaoPerfil();
      await carregar();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível salvar o perfil.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [cancelarEdicaoPerfil, carregar, dadosPerfilEditando, perfilEditando]);

  const abrirCriarPerfil = useCallback(() => {
    setPerfilFormDialog({ open: true, editingItem: null });
  }, []);

  const fecharPerfilFormDialog = useCallback(() => {
    setPerfilFormDialog({ open: false, editingItem: null });
  }, []);

  const salvarNovoPerfil = useCallback(
    async (values: PerfilTarifaFormValues) => {
      if (!unidadeId) {
        toast.error('Selecione uma unidade para cadastrar o perfil.');
        return;
      }

      setIsSubmitting(true);

      try {
        await createPerfilTarifa({
          unidadeId,
          idRavex: values.idRavex,
          nome: values.nome.trim(),
          descricao: values.descricao?.trim() || null,
          peso: values.peso,
          cubagem: values.cubagem ?? null,
          tipoCarga: values.tipoCarga,
        });

        toast.success(`Perfil ${values.nome} criado com sucesso.`);
        fecharPerfilFormDialog();
        await carregar();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Não foi possível criar o perfil.'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar, fecharPerfilFormDialog, unidadeId],
  );

  const iniciarEdicaoTarifa = useCallback((perfil: PerfilTarifaItem) => {
    setTarifaEditandoId(perfil.id);
    setFaixasEditando(
      perfil.faixasKm.length > 0
        ? perfil.faixasKm.map((faixa) => ({ ...faixa }))
        : [{ kmInicial: 0, kmFinal: null, valor: 0, itinerario: null }],
    );
  }, []);

  const cancelarEdicaoTarifa = useCallback(() => {
    setTarifaEditandoId(null);
    setFaixasEditando([]);
  }, []);

  const atualizarFaixa = useCallback(
    (
      index: number,
      campo: keyof FaixaKmItem,
      valor: number | string | null,
    ) => {
      setFaixasEditando((atual) =>
        atual.map((faixa, faixaIndex) =>
          faixaIndex === index ? { ...faixa, [campo]: valor } : faixa,
        ),
      );
    },
    [],
  );

  const adicionarFaixa = useCallback(() => {
    setFaixasEditando((atual) => [
      ...atual,
      {
        kmInicial:
          atual.length > 0
            ? (atual.at(-1)?.kmFinal ?? atual.at(-1)?.kmInicial ?? 0) + 1
            : 0,
        kmFinal: null,
        valor: 0,
        itinerario: null,
      },
    ]);
  }, []);

  const removerFaixa = useCallback((index: number) => {
    setFaixasEditando((atual) => atual.filter((_, faixaIndex) => faixaIndex !== index));
  }, []);

  const salvarTarifa = useCallback(async () => {
    if (!tarifaEditandoId) {
      return;
    }

    const faixasValidas = faixasEditando.filter(
      (faixa) => faixa.valor > 0 && faixa.kmInicial >= 0,
    );

    if (faixasValidas.length === 0) {
      toast.error('Adicione ao menos uma faixa com valor válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      await upsertFaixasKm(tarifaEditandoId, {
        faixas: faixasValidas.map((faixa) => ({
          kmInicial: faixa.kmInicial,
          kmFinal: faixa.kmFinal,
          valor: faixa.valor,
          itinerario: faixa.itinerario?.trim() || null,
        })),
      });

      setTarifaSalvaComSucessoId(tarifaEditandoId);
      window.setTimeout(() => setTarifaSalvaComSucessoId(null), 1000);

      toast.success('Tarifas atualizadas com sucesso.');
      cancelarEdicaoTarifa();
      await carregar();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível salvar as tarifas.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [cancelarEdicaoTarifa, carregar, faixasEditando, tarifaEditandoId]);

  const resumo = useMemo(() => {
    const todasFaixas = perfisFiltrados.flatMap((perfil) => perfil.faixasKm);
    const faixasInicio = todasFaixas.filter((faixa) => faixa.kmInicial === 0);
    const valores = todasFaixas.map((faixa) => faixa.valor);

    return {
      totalFaixas: todasFaixas.length,
      menorTarifaInicio:
        faixasInicio.length > 0
          ? Math.min(...faixasInicio.map((faixa) => faixa.valor))
          : 0,
      maiorTarifa: valores.length > 0 ? Math.max(...valores) : 0,
      proporcaoMax: valores.length > 0 ? Math.max(...valores) : 1,
    };
  }, [perfisFiltrados]);

  return {
    tipoCargaFiltro,
    setTipoCargaFiltro,
    perfisFiltrados,
    isLoading,
    isSubmitting,
    unidadeId,
    perfilEditando,
    dadosPerfilEditando,
    abrirEdicaoPerfil,
    atualizarCampoPerfil,
    salvarPerfil,
    cancelarEdicaoPerfil,
    perfilFormDialog,
    abrirCriarPerfil,
    fecharPerfilFormDialog,
    salvarNovoPerfil,
    tarifaEditandoId,
    faixasEditando,
    iniciarEdicaoTarifa,
    atualizarFaixa,
    adicionarFaixa,
    removerFaixa,
    salvarTarifa,
    cancelarEdicaoTarifa,
    tarifaSalvaComSucessoId,
    resumo,
    recarregar: carregar,
  };
}
