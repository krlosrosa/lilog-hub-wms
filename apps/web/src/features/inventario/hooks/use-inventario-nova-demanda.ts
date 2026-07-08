'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { listEnderecoIdsComSaldoPorSku } from '@/features/estoque/lib/estoque-api';
import { listCentros, listEnderecos } from '@/features/enderecos/lib/endereco-api';
import type { EnderecoTipo } from '@/features/enderecos/types/enderecos-gestao.schema';
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
import { listGruposEnderecos } from '@/features/produto-endereco/lib/produto-endereco-api';
import type { GrupoComEnderecosApi } from '@/features/produto-endereco/types/produto-endereco.api';

export type EnderecoContagemOption = {
  id: string;
  enderecoMascarado: string;
  zona: string;
  rua: string;
  nivel: string;
  tipo: EnderecoTipo;
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
  skuBusca: '',
  responsavelId: '',
  observacoes: '',
  alertaFragilidade: false,
};

export function useInventarioNovaDemanda(inventarioId: string) {
  const router = useRouter();
  const returnPath = `/inventario/${inventarioId}/demandas`;
  const [salvando, setSalvando] = useState(false);
  const [filtroEndereco, setFiltroEndereco] = useState('');
  const [filtroZonas, setFiltroZonas] = useState<string[]>([]);
  const [filtroNiveis, setFiltroNiveis] = useState<string[]>([]);
  const [filtroRuas, setFiltroRuas] = useState<string[]>([]);
  const [filtroRuaTexto, setFiltroRuaTexto] = useState('');
  const [filtroTipos, setFiltroTipos] = useState<EnderecoTipo[]>([]);
  const [filtroGrupos, setFiltroGrupos] = useState<string[]>([]);
  const [centroId, setCentroId] = useState<string | null>(null);
  const [unidadeId, setUnidadeId] = useState<string | null>(null);
  const [enderecosBase, setEnderecosBase] = useState<EnderecoContagemOption[]>(
    [],
  );
  const [enderecosDisponiveis, setEnderecosDisponiveis] = useState<
    EnderecoContagemOption[]
  >([]);
  const [gruposComEnderecos, setGruposComEnderecos] = useState<
    GrupoComEnderecosApi[]
  >([]);
  const [zonasDisponiveis, setZonasDisponiveis] = useState<string[]>([]);
  const [opcoesResponsavel, setOpcoesResponsavel] = useState<
    ResponsavelGestorOption[]
  >([]);
  const [carregandoEnderecos, setCarregandoEnderecos] = useState(true);
  const [filtrandoSku, setFiltrandoSku] = useState(false);
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

        const centros = await listCentros();
        const centroInventario = centros.find(
          (centro) => centro.id === inventario.centroId,
        );
        const resolvedUnidadeId = centroInventario?.unidadeId ?? null;

        const pageSize = 100;
        const enderecosCarregados: EnderecoContagemOption[] = [];
        let page = 1;
        let total = 0;

        do {
          const enderecosResp = await listEnderecos({
            unidadeId: resolvedUnidadeId ?? undefined,
            limit: pageSize,
            page,
          });
          total = enderecosResp.total;
          enderecosCarregados.push(
            ...enderecosResp.items.map((item) => ({
              id: item.id,
              enderecoMascarado: item.enderecoMascarado,
              zona: item.zona,
              rua: item.rua,
              nivel: item.nivel,
              tipo: item.tipo,
            })),
          );
          page += 1;
        } while (enderecosCarregados.length < total);

        const [zonas, operadores, grupos] = await Promise.all([
          resolvedUnidadeId ? listZonas(resolvedUnidadeId) : Promise.resolve([]),
          listOperators(),
          listGruposEnderecos(inventario.centroId),
        ]);

        setEnderecosBase(enderecosCarregados);
        setEnderecosDisponiveis(enderecosCarregados);
        setUnidadeId(resolvedUnidadeId);
        setZonasDisponiveis(zonas.map((item) => item.zona));
        setOpcoesResponsavel(operadores);
        setGruposComEnderecos(grupos);

        if (enderecosCarregados.length === 0) {
          toast.warning('Nenhum endereço cadastrado para esta unidade', {
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
  const responsavelId = form.watch('responsavelId');
  const skuBusca = form.watch('skuBusca');
  const tipo = form.watch('tipo');

  const skuFiltroAtivo =
    tipo === 'validacao' && skuBusca.trim().length >= 2;

  useEffect(() => {
    if (carregandoEnderecos || !unidadeId || enderecosBase.length === 0) {
      return;
    }

    if (tipo !== 'validacao' || skuBusca.trim().length < 2) {
      setEnderecosDisponiveis(enderecosBase);
      setFiltrandoSku(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      void (async () => {
        setFiltrandoSku(true);
        try {
          const enderecoIdsComSku = await listEnderecoIdsComSaldoPorSku({
            unidadeId,
            search: skuBusca.trim(),
            natureza: 'fisico',
          });
          setEnderecosDisponiveis(
            enderecosBase.filter((endereco) =>
              enderecoIdsComSku.has(endereco.id),
            ),
          );

          const selecionados = form.getValues('enderecoIds');
          const selecionadosValidos = selecionados.filter((id) =>
            enderecoIdsComSku.has(id),
          );
          if (selecionadosValidos.length !== selecionados.length) {
            void form.setValue('enderecoIds', selecionadosValidos, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        } catch (error) {
          setEnderecosDisponiveis([]);
          toast.error('Não foi possível filtrar endereços pelo SKU', {
            description:
              error instanceof Error
                ? error.message
                : 'Verifique o SKU e tente novamente.',
          });
        } finally {
          setFiltrandoSku(false);
        }
      })();
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [
    carregandoEnderecos,
    enderecosBase,
    form,
    skuBusca,
    tipo,
    unidadeId,
  ]);

  const responsavelSelecionado = useMemo(
    () => opcoesResponsavel.find((r) => r.value === responsavelId),
    [opcoesResponsavel, responsavelId],
  );

  const gruposDisponiveis = useMemo(
    () => gruposComEnderecos.map((item) => item.grupo),
    [gruposComEnderecos],
  );

  const enderecoIdsPorGrupo = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const item of gruposComEnderecos) {
      map.set(item.grupo, new Set(item.enderecoIds));
    }
    return map;
  }, [gruposComEnderecos]);

  const niveisDisponiveis = useMemo(
    () =>
      [...new Set(enderecosDisponiveis.map((e) => e.nivel))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [enderecosDisponiveis],
  );

  const ruasDisponiveis = useMemo(
    () =>
      [...new Set(enderecosDisponiveis.map((e) => e.rua))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [enderecosDisponiveis],
  );

  const tiposDisponiveis = useMemo(
    () => [...new Set(enderecosDisponiveis.map((e) => e.tipo))],
    [enderecosDisponiveis],
  );

  const temFiltrosAtivos =
    filtroZonas.length > 0 ||
    filtroNiveis.length > 0 ||
    filtroRuas.length > 0 ||
    filtroRuaTexto.trim().length > 0 ||
    filtroTipos.length > 0 ||
    filtroGrupos.length > 0;

  const enderecosFiltrados = useMemo(() => {
    const termo = filtroEndereco.trim().toLowerCase();
    const enderecoIdsGrupo = new Set<string>();

    if (filtroGrupos.length > 0) {
      for (const grupo of filtroGrupos) {
        const ids = enderecoIdsPorGrupo.get(grupo);
        if (ids) {
          for (const id of ids) {
            enderecoIdsGrupo.add(id);
          }
        }
      }
    }

    return enderecosDisponiveis.filter((endereco) => {
      const matchTexto =
        termo === '' ||
        endereco.enderecoMascarado.toLowerCase().includes(termo) ||
        endereco.zona.toLowerCase().includes(termo) ||
        endereco.rua.toLowerCase().includes(termo) ||
        endereco.nivel.toLowerCase().includes(termo);
      const matchZona =
        filtroZonas.length === 0 || filtroZonas.includes(endereco.zona);
      const matchNivel =
        filtroNiveis.length === 0 || filtroNiveis.includes(endereco.nivel);
      const matchRuaPorChip =
        filtroRuas.length === 0 || filtroRuas.includes(endereco.rua);
      const matchRuaPorTexto =
        filtroRuaTexto.trim() === '' ||
        endereco.rua.toLowerCase().includes(filtroRuaTexto.trim().toLowerCase());
      const matchRua = matchRuaPorChip && matchRuaPorTexto;
      const matchTipo =
        filtroTipos.length === 0 || filtroTipos.includes(endereco.tipo);
      const matchGrupo =
        filtroGrupos.length === 0 || enderecoIdsGrupo.has(endereco.id);
      return (
        matchTexto &&
        matchZona &&
        matchNivel &&
        matchRua &&
        matchTipo &&
        matchGrupo
      );
    });
  }, [
    enderecosDisponiveis,
    enderecoIdsPorGrupo,
    filtroEndereco,
    filtroZonas,
    filtroNiveis,
    filtroRuas,
    filtroRuaTexto,
    filtroTipos,
    filtroGrupos,
  ]);

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

  const toggleFiltroZona = useCallback((zona: string) => {
    setFiltroZonas((atuais) =>
      atuais.includes(zona)
        ? atuais.filter((item) => item !== zona)
        : [...atuais, zona],
    );
  }, []);

  const toggleFiltroNivel = useCallback((nivel: string) => {
    setFiltroNiveis((atuais) =>
      atuais.includes(nivel)
        ? atuais.filter((item) => item !== nivel)
        : [...atuais, nivel],
    );
  }, []);

  const toggleFiltroRua = useCallback((rua: string) => {
    setFiltroRuas((atuais) =>
      atuais.includes(rua)
        ? atuais.filter((item) => item !== rua)
        : [...atuais, rua],
    );
  }, []);

  const toggleFiltroTipo = useCallback((tipo: EnderecoTipo) => {
    setFiltroTipos((atuais) =>
      atuais.includes(tipo)
        ? atuais.filter((item) => item !== tipo)
        : [...atuais, tipo],
    );
  }, []);

  const toggleFiltroGrupo = useCallback((grupo: string) => {
    setFiltroGrupos((atuais) =>
      atuais.includes(grupo)
        ? atuais.filter((item) => item !== grupo)
        : [...atuais, grupo],
    );
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltroZonas([]);
    setFiltroNiveis([]);
    setFiltroRuas([]);
    setFiltroRuaTexto('');
    setFiltroTipos([]);
    setFiltroGrupos([]);
  }, []);

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
    filtrandoSku,
    skuFiltroAtivo,
    erroEnderecos,
    centroId,
    unidadeId,
    filtroEndereco,
    setFiltroEndereco,
    filtroZonas,
    filtroNiveis,
    filtroRuas,
    filtroRuaTexto,
    setFiltroRuaTexto,
    filtroTipos,
    filtroGrupos,
    temFiltrosAtivos,
    niveisDisponiveis,
    ruasDisponiveis,
    tiposDisponiveis,
    gruposDisponiveis,
    toggleFiltroZona,
    toggleFiltroNivel,
    toggleFiltroRua,
    toggleFiltroTipo,
    toggleFiltroGrupo,
    limparFiltros,
    enderecoIdsSelecionados,
    zonasSelecionadas,
    responsavelSelecionado,
    enderecosFiltrados,
    enderecosDisponiveis,
    zonasDisponiveis,
    toggleEndereco,
    selecionarTodosFiltrados,
    limparEnderecos,
    voltarLista,
    confirmarConfiguracao,
    opcoesResponsavel,
  };
}
