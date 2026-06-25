'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { listEnderecos } from '@/features/enderecos/lib/endereco-api';
import { MOCK_CATEGORIAS } from '@/features/inventario/mocks/inventario-mock-data';
import {
  createDemanda,
  getInventario,
  listOperators,
  listZonas,
} from '@/features/inventario/lib/inventario-api';
import {
  demandaNovaFullFormSchema,
  type DemandaNovaFullFormValues,
} from '@/features/inventario/types/inventario-lista.schema';
import type { ResponsavelGestorOption } from '@/features/inventario/types/inventario-cadastro.schema';

export type EnderecoContagemOption = {
  id: string;
  enderecoMascarado: string;
  zona: string;
};

function generateDefaultNome() {
  const now = new Date();
  const month = now.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
  const year = now.getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `INV-${year}-${month}-${seq}`;
}

export const DEMANDA_NOVA_FULL_DEFAULT: DemandaNovaFullFormValues = {
  nome: generateDefaultNome(),
  prioridade: 'media',
  statusAtivo: true,
  tipo: 'cega',
  enderecoIds: [],
  zonas: [],
  rackInicio: '',
  rackFim: '',
  categorias: [],
  skuBusca: '',
  responsavelId: '',
  observacoes: '',
  alertaFragilidade: false,
};

export function useInventarioNovaDemanda(inventarioId: string) {
  const router = useRouter();
  const returnPath = `/inventario/${inventarioId}/demandas`;
  const [salvando, setSalvando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEndereco, setFiltroEndereco] = useState('');
  const [centroId, setCentroId] = useState<string | null>(null);
  const [enderecosDisponiveis, setEnderecosDisponiveis] = useState<
    EnderecoContagemOption[]
  >([]);
  const [zonasDisponiveis, setZonasDisponiveis] = useState<string[]>([]);
  const [opcoesResponsavel, setOpcoesResponsavel] = useState<
    ResponsavelGestorOption[]
  >([]);
  const [carregandoEnderecos, setCarregandoEnderecos] = useState(true);
  const [erroEnderecos, setErroEnderecos] = useState<string | null>(null);

  const form = useForm<DemandaNovaFullFormValues>({
    resolver: zodResolver(demandaNovaFullFormSchema),
    defaultValues: DEMANDA_NOVA_FULL_DEFAULT,
    mode: 'onSubmit',
  });

  useEffect(() => {
    void (async () => {
      setCarregandoEnderecos(true);
      setErroEnderecos(null);
      try {
        const inventario = await getInventario(inventarioId);
        setCentroId(inventario.centroId);

        const pageSize = 100;
        const enderecosCarregados: EnderecoContagemOption[] = [];
        let page = 1;
        let total = 0;

        do {
          const enderecosResp = await listEnderecos({
            centroId: inventario.centroId,
            limit: pageSize,
            page,
          });
          total = enderecosResp.total;
          enderecosCarregados.push(
            ...enderecosResp.items.map((item) => ({
              id: item.id,
              enderecoMascarado: item.enderecoMascarado,
              zona: item.zona,
            })),
          );
          page += 1;
        } while (enderecosCarregados.length < total);

        const [zonas, operadores] = await Promise.all([
          listZonas(inventario.centroId),
          listOperators(),
        ]);

        setEnderecosDisponiveis(enderecosCarregados);
        setZonasDisponiveis(zonas.map((item) => item.zona));
        setOpcoesResponsavel(operadores);

        if (enderecosCarregados.length === 0) {
          toast.warning('Nenhum endereço cadastrado para este centro', {
            description:
              'Cadastre endereços em Operacional > Endereços antes de criar a demanda.',
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar endereços do inventário';
        setErroEnderecos(message);
        toast.error('Não foi possível carregar endereços do inventário', {
          description: message,
        });
      } finally {
        setCarregandoEnderecos(false);
      }
    })();
  }, [inventarioId]);

  const enderecoIdsSelecionados = form.watch('enderecoIds');
  const zonasSelecionadas = form.watch('zonas');
  const categoriasSelecionadas = form.watch('categorias');
  const responsavelId = form.watch('responsavelId');

  const responsavelSelecionado = useMemo(
    () => opcoesResponsavel.find((r) => r.value === responsavelId),
    [opcoesResponsavel, responsavelId],
  );

  const enderecosFiltrados = useMemo(() => {
    const termo = filtroEndereco.trim().toLowerCase();
    return enderecosDisponiveis.filter((endereco) => {
      if (termo === '') return true;
      return (
        endereco.enderecoMascarado.toLowerCase().includes(termo) ||
        endereco.zona.toLowerCase().includes(termo)
      );
    });
  }, [enderecosDisponiveis, filtroEndereco]);

  const categoriasFiltradas = useMemo(() => {
    const termo = filtroCategoria.trim().toLowerCase();
    return MOCK_CATEGORIAS.filter(
      (c) =>
        !categoriasSelecionadas.includes(c) &&
        (termo === '' || c.toLowerCase().includes(termo)),
    );
  }, [categoriasSelecionadas, filtroCategoria]);

  const toggleEndereco = useCallback(
    (enderecoId: string) => {
      const atuais = form.getValues('enderecoIds');
      const next = atuais.includes(enderecoId)
        ? atuais.filter((id) => id !== enderecoId)
        : [...atuais, enderecoId];
      void form.setValue('enderecoIds', next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const selecionarTodosFiltrados = useCallback(() => {
    const ids = enderecosFiltrados.map((e) => e.id);
    const atuais = new Set(form.getValues('enderecoIds'));
    for (const id of ids) {
      atuais.add(id);
    }
    void form.setValue('enderecoIds', Array.from(atuais), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [enderecosFiltrados, form]);

  const limparEnderecos = useCallback(() => {
    void form.setValue('enderecoIds', [], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form]);

  const selecionarPorZona = useCallback(
    (zona: string) => {
      const idsDaZona = enderecosDisponiveis
        .filter((e) => e.zona === zona)
        .map((e) => e.id);
      const atuais = new Set(form.getValues('enderecoIds'));
      for (const id of idsDaZona) {
        atuais.add(id);
      }
      void form.setValue('enderecoIds', Array.from(atuais), {
        shouldDirty: true,
        shouldValidate: true,
      });
      void form.setValue(
        'zonas',
        Array.from(new Set([...form.getValues('zonas'), zona])),
        { shouldDirty: true },
      );
    },
    [enderecosDisponiveis, form],
  );

  const adicionarCategoria = useCallback(
    (categoria: string) => {
      const atuais = form.getValues('categorias');
      if (atuais.includes(categoria)) return;
      void form.setValue('categorias', [...atuais, categoria], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setFiltroCategoria('');
    },
    [form],
  );

  const removerCategoria = useCallback(
    (categoria: string) => {
      const atuais = form.getValues('categorias');
      void form.setValue(
        'categorias',
        atuais.filter((c) => c !== categoria),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    [form],
  );

  const voltarLista = useCallback(() => {
    router.push(returnPath);
  }, [router, returnPath]);

  const confirmarConfiguracao = form.handleSubmit(
    async (data: DemandaNovaFullFormValues) => {
      setSalvando(true);
      try {
        await createDemanda(inventarioId, data);
        toast.success('Demanda configurada', {
          description: `${data.enderecoIds.length} endereço(s) vinculado(s).`,
        });
        router.push(returnPath);
      } catch (error) {
        toast.error('Não foi possível criar a demanda', {
          description:
            error instanceof Error ? error.message : 'Verifique os endereços.',
        });
      } finally {
        setSalvando(false);
      }
    },
  );

  return {
    form,
    salvando,
    carregandoEnderecos,
    erroEnderecos,
    centroId,
    filtroCategoria,
    setFiltroCategoria,
    filtroEndereco,
    setFiltroEndereco,
    enderecoIdsSelecionados,
    zonasSelecionadas,
    categoriasSelecionadas,
    responsavelSelecionado,
    enderecosFiltrados,
    enderecosDisponiveis,
    zonasDisponiveis,
    categoriasFiltradas,
    toggleEndereco,
    selecionarTodosFiltrados,
    limparEnderecos,
    selecionarPorZona,
    adicionarCategoria,
    removerCategoria,
    voltarLista,
    confirmarConfiguracao,
    opcoesResponsavel,
  };
}
