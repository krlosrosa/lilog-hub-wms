'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listCentros, listEnderecos } from '@/features/enderecos/lib/endereco-api';
import { listRuas, listZonas } from '@/features/inventario/lib/inventario-api';
import {
  createRegraEnderecamento,
  getRegraEnderecamento,
  mapRegraToListaItem,
  updateRegraEnderecamento,
} from '@/features/regras-enderecamento/lib/regra-enderecamento-api';
import {
  DEFAULT_REGRA_FORM_VALUES,
  type RegraEnderecamentoFormValues,
  type RegraEnderecamentoListaItem,
  regraEnderecamentoFormSchema,
} from '@/features/regras-enderecamento/types/regra-enderecamento.schema';
import { ApiClientError } from '@/lib/api';

const LIST_PATH = '/armazenagem/regras-enderecamento';

type EnderecoOption = {
  id: string;
  label: string;
};

function mapRegraToFormValues(
  regra: RegraEnderecamentoListaItem,
): RegraEnderecamentoFormValues {
  return {
    nome: regra.nome,
    criterioTipo: regra.criterioTipo,
    criterioValor: regra.criterioValor,
    prioridade: regra.prioridade,
    ativo: regra.ativo,
    destinos: regra.destinos.map((destino) => ({
      prioridade: destino.prioridade,
      tipo: destino.tipo,
      zona: destino.zona ?? undefined,
      rua: destino.rua ?? undefined,
      enderecoId: destino.enderecoId ?? undefined,
      ativo: destino.ativo,
    })),
  };
}

type UseRegraEnderecamentoCadastroOptions = {
  regraId?: string;
};

export function useRegraEnderecamentoCadastro({
  regraId,
}: UseRegraEnderecamentoCadastroOptions = {}) {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;
  const isEditing = Boolean(regraId);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [zonas, setZonas] = useState<string[]>([]);
  const [centroId, setCentroId] = useState<string | undefined>();
  const [ruasByZona, setRuasByZona] = useState<Record<string, string[]>>({});
  const [enderecos, setEnderecos] = useState<EnderecoOption[]>([]);
  const [optionsLoadError, setOptionsLoadError] = useState<string | null>(null);

  const form = useForm<RegraEnderecamentoFormValues>({
    resolver: zodResolver(regraEnderecamentoFormSchema),
    defaultValues: DEFAULT_REGRA_FORM_VALUES,
  });

  useEffect(() => {
    if (!isEditing || !regraId) {
      return;
    }

    const id = regraId;
    let cancelled = false;

    async function carregarRegra() {
      setIsLoading(true);
      setNotFound(false);

      try {
        const response = await getRegraEnderecamento(id);
        if (cancelled) {
          return;
        }

        form.reset(mapRegraToFormValues(mapRegraToListaItem(response)));
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 404) {
          setNotFound(true);
          return;
        }

        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar a regra.';
        toast.error(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void carregarRegra();

    return () => {
      cancelled = true;
    };
  }, [form, isEditing, regraId]);

  useEffect(() => {
    if (!unidadeId) {
      setZonas([]);
      setCentroId(undefined);
      setRuasByZona({});
      setEnderecos([]);
      setOptionsLoadError(null);
      setIsLoadingOptions(false);
      return;
    }

    let cancelled = false;

    async function carregarOpcoes() {
      setIsLoadingOptions(true);
      setOptionsLoadError(null);

      try {
        const [zonasResponse, enderecosResponse] = await Promise.all([
          listZonas(unidadeId),
          listEnderecos({
            unidadeId,
            status: 'disponivel',
            limit: 100,
          }),
        ]);

        if (cancelled) {
          return;
        }

        const resolvedCentroId = (await listCentros(unidadeId))[0]?.id;
        setCentroId(resolvedCentroId);
        setRuasByZona({});
        setZonas(zonasResponse.map((item) => item.zona));
        setEnderecos(
          enderecosResponse.items.map((item) => ({
            id: item.id,
            label: `${item.enderecoMascarado} · ${item.zona}`,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          setZonas([]);
          setCentroId(undefined);
          setRuasByZona({});
          setEnderecos([]);
          const message =
            error instanceof ApiClientError
              ? error.message
              : 'Não foi possível carregar zonas e endereços.';
          setOptionsLoadError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      }
    }

    void carregarOpcoes();

    return () => {
      cancelled = true;
    };
  }, [unidadeId]);

  const destinosAtuais = form.watch('destinos');

  const zonasComFallback = useMemo(() => {
    const extras = destinosAtuais
      .map((destino) => destino.zona?.trim())
      .filter((zona): zona is string => Boolean(zona));

    return [...new Set([...zonas, ...extras])].sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );
  }, [destinosAtuais, zonas]);

  const getRuasForZona = useCallback(
    (zona?: string) => {
      const key = zona?.trim();
      if (!key) {
        return [];
      }

      const extras = destinosAtuais
        .filter((destino) => destino.zona?.trim() === key && destino.rua?.trim())
        .map((destino) => destino.rua!.trim());

      const cached = ruasByZona[key] ?? [];

      return [...new Set([...cached, ...extras])].sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      );
    },
    [destinosAtuais, ruasByZona],
  );

  const carregarRuasDaZona = useCallback(
    async (zona?: string) => {
      const key = zona?.trim();
      if (!key || !unidadeId || ruasByZona[key]) {
        return;
      }

      try {
        const response = await listRuas({ unidadeId, zona: key });
        setRuasByZona((current) => ({
          ...current,
          [key]: response.map((item) => item.rua),
        }));
      } catch {
        setRuasByZona((current) => ({
          ...current,
          [key]: [],
        }));
      }
    },
    [unidadeId, ruasByZona],
  );

  useEffect(() => {
    const zonasDestino = [
      ...new Set(
        destinosAtuais
          .map((destino) => destino.zona?.trim())
          .filter((zona): zona is string => Boolean(zona)),
      ),
    ];

    zonasDestino.forEach((zona) => {
      void carregarRuasDaZona(zona);
    });
  }, [carregarRuasDaZona, destinosAtuais]);

  const buildPayloadDestinos = (values: RegraEnderecamentoFormValues) =>
    values.destinos.map((destino) => ({
      prioridade: destino.prioridade,
      tipo: destino.tipo,
      zona: destino.tipo === 'zona' ? destino.zona?.trim() || undefined : undefined,
      rua: destino.tipo === 'zona' ? destino.rua?.trim() || undefined : undefined,
      enderecoId: destino.tipo === 'endereco' ? destino.enderecoId : undefined,
      ativo: destino.ativo,
    }));

  const salvar = form.handleSubmit(async (values) => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payloadBase = {
        nome: values.nome.trim(),
        criterioTipo: values.criterioTipo,
        criterioValor: values.criterioValor.trim(),
        prioridade: values.prioridade,
        ativo: values.ativo,
        destinos: buildPayloadDestinos(values),
      };

      if (isEditing && regraId) {
        await updateRegraEnderecamento(regraId, payloadBase);
        toast.success('Regra atualizada com sucesso.');
      } else {
        await createRegraEnderecamento({
          unidadeId,
          ...payloadBase,
        });
        toast.success('Regra criada com sucesso.');
      }

      router.push(LIST_PATH);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar a regra.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push(LIST_PATH);
  }, [router]);

  return {
    unidadeId,
    isEditing,
    isLoading,
    isLoadingOptions,
    isSubmitting,
    notFound,
    optionsLoadError,
    form,
    zonas: zonasComFallback,
    getRuasForZona,
    carregarRuasDaZona,
    enderecos,
    salvar,
    cancelar,
  };
}
