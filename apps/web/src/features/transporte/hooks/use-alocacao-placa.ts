'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';
import type { ItinerarioImportResultado } from '@/features/transporte/components/itinerario-import-modal';
import type { PrioridadeTransporteConfirmPayload } from '@/features/transporte/components/prioridade-transporte-modal';
import type { RemessaUploadConfirmPayload } from '@/features/transporte/components/remessa-upload-modal';
import type { RoteirizacaoImportResultado } from '@/features/transporte/components/roteirizacao-import-modal';
import {
  atualizarPrioridadeTransporte,
  atualizarItinerarioRemessas,
  deleteTransporte,
  desvincularNfsDevolucaoTransporte,
  excluirMapaConferenciaReentregaTransporte,
  listTransportes,
  parseUploadConflitoBody,
  salvarAlocacoesTransportes,
  uploadLoteRemessas,
  type RotaConflitanteUpload,
} from '@/features/transporte/lib/expedicao-api';
import { mapTransportesApiToGrupos } from '@/features/transporte/lib/map-transporte-api';
import {
  buildPerfilTarifaMap,
  buildPlacaCadastroMap,
  buildVeiculoAlocadoFromVeiculo,
  mapAllPlacasToVeiculos,
} from '@/features/transporte/lib/map-placa-to-veiculo';
import {
  buscarPlacasUnidadePorPlacas,
  listAllPlacasUnidade,
} from '@/features/transporte/lib/placas-api';
import {
  listAllTransportadorasUnidade,
} from '@/features/transporte/lib/transportadoras-api';
import {
  listPerfisTarifas,
  mapPerfilTarifaToItem,
} from '@/features/transporte/lib/perfis-tarifas-api';
import {
  ParseRoteirizacaoError,
  mapearVeiculoRoteirizado,
  normalizarPlaca,
  parseRoteirizacaoXlsx,
  stripLeadingZeros,
} from '@/features/transporte/lib/parse-roteirizacao-xlsx';
import {
  ParseItinerarioError,
  parseItinerarioXlsx,
} from '@/features/transporte/lib/parse-itinerario-xlsx';
import { imprimirMapasApi, imprimirMapaConferenciaReentregaApi, type TipoMapaImpressao } from '@/features/transporte/lib/imprimir-mapas-api';
import { saveMapaSelecao, saveMapaTransportes } from '@/features/transporte/storage/mapa-impressao-storage';
import { persistUploadLoteAtivo } from '@/features/expedicao/storage/upload-lote-ativo-storage';
import {
  buildTorreControleExpedicaoHref,
  resolverUploadLoteIdTransportes,
} from '@/features/torre-controle-expedicao/lib/torre-controle-routes';
import {
  calcularMetricasResumoTransportes,
  resolverCustoPrevistoExibicao,
  resolverCustoPrevistoPorPerfil,
} from '@/features/transporte/lib/calcular-custo-frete';
import {
  contarTransportesPorFiltroRapido,
  filtrarTransportesExpedicao,
} from '@/features/transporte/lib/filtrar-transportes-expedicao';
import {
  criarIntervaloPadraoHoje,
  filtrarTransportesPorIntervalo,
  normalizarIntervaloData,
  type IntervaloData,
} from '@/features/torre-controle-expedicao/lib/intervalo-data';
import type {
  FiltroRapidoTransporte,
  FiltroStatusTransporte,
  PagamentoAlocacao,
  RemessaItem,
  TipoVeiculo,
  TransporteGrupo,
  TransporteSummary,
  Veiculo,
  VeiculoAlocado,
} from '@/features/transporte/types/transporte.schema';
import type { PerfilTarifaItem } from '@/features/transporte/types/perfil-tarifa.schema';

function filtrarPorStatus(
  items: TransporteGrupo[],
  filtro: FiltroStatusTransporte,
): TransporteGrupo[] {
  if (filtro === 'todos') {
    return items;
  }

  return items.filter((item) => item.status === filtro);
}

function filtrarPorRegiao(
  items: TransporteGrupo[],
  regiao: string,
): TransporteGrupo[] {
  if (!regiao.trim() || regiao === 'todas') {
    return items;
  }

  return items.filter((item) => item.regiao === regiao);
}

function intervaloDataPreenchido(intervalo: IntervaloData): boolean {
  return Boolean(intervalo.dataInicio.trim() && intervalo.dataFim.trim());
}

function filtrarPorIntervalo(
  items: TransporteGrupo[],
  intervalo: IntervaloData,
): TransporteGrupo[] {
  if (!intervaloDataPreenchido(intervalo)) {
    return [];
  }

  return filtrarTransportesPorIntervalo(items, intervalo);
}

function formatarRotuloIntervalo(intervalo: IntervaloData): string {
  const { dataInicio, dataFim } = normalizarIntervaloData(intervalo);
  return dataInicio === dataFim ? dataInicio : `${dataInicio} — ${dataFim}`;
}

function calcularSummary(
  transportes: TransporteGrupo[],
  perfisTarifas: PerfilTarifaItem[],
): TransporteSummary {
  const totalRemessas = transportes.reduce(
    (acc, transporte) => acc + transporte.quantidadeRemessas,
    0,
  );
  const transportesPendentes = transportes.filter(
    (transporte) =>
      transporte.status === 'PENDENTE' || transporte.status === 'PARCIAL',
  ).length;
  const placasAlocadas = transportes.filter(
    (transporte) => transporte.status === 'ALOCADO',
  ).length;
  const transportesComPlaca = transportes.filter(
    (transporte) => Boolean(transporte.veiculoAlocado?.placa?.trim()),
  );
  const custoPrevistoTotal = transportes.reduce((acc, transporte) => {
    const custo = resolverCustoPrevistoExibicao(transporte, perfisTarifas);
    return acc + (custo ?? 0);
  }, 0);
  const custoPrevistoAlocado = transportesComPlaca.reduce((acc, transporte) => {
    const custo = resolverCustoPrevistoExibicao(transporte, perfisTarifas);
    return acc + (custo ?? 0);
  }, 0);
  const metricas = calcularMetricasResumoTransportes(
    transportes,
    custoPrevistoAlocado,
  );

  return {
    totalTransportes: transportes.length,
    totalRemessas,
    transportesPendentes,
    placasAlocadas,
    custoPrevistoTotal,
    ...metricas,
  };
}

function resolverTipoVeiculoPlaca(
  perfilTarifaNome?: string | null,
  tipoVeiculoNome?: string | null,
): TipoVeiculo {
  return (
    mapearVeiculoRoteirizado(perfilTarifaNome) ??
    mapearVeiculoRoteirizado(tipoVeiculoNome) ??
    'Toco'
  );
}

function buildVeiculoAlocadoFromPlaca(
  placaRegistro: {
    id: string;
    placa: string;
    transportadoraNome?: string | null;
    perfilTarifaId?: string | null;
    perfilTarifaNome?: string | null;
    tipoVeiculoNome?: string | null;
  },
): VeiculoAlocado {
  return {
    veiculoId: placaRegistro.id,
    placa: normalizarPlaca(placaRegistro.placa),
    tipo: resolverTipoVeiculoPlaca(
      placaRegistro.perfilTarifaNome,
      placaRegistro.tipoVeiculoNome,
    ),
    motorista: '',
    transportadora: placaRegistro.transportadoraNome?.trim() ?? '',
    perfilTarifaId: placaRegistro.perfilTarifaId ?? null,
    perfilTarifaNome: placaRegistro.perfilTarifaNome?.trim() ?? null,
  };
}

async function enriquecerTransportesComPlacas(
  unidadeId: string,
  items: TransporteGrupo[],
): Promise<TransporteGrupo[]> {
  const placasNecessarias = [
    ...new Set(
      items
        .map((transporte) => transporte.veiculoAlocado?.placa)
        .filter((placa): placa is string => Boolean(placa?.trim())),
    ),
  ];

  if (!placasNecessarias.length) {
    return items;
  }

  const placasCadastroLista = await buscarPlacasUnidadePorPlacas(
    unidadeId,
    placasNecessarias,
  );
  const placasCadastro = buildPlacaCadastroMap(placasCadastroLista);

  return items.map((transporte) => {
    const placa = transporte.veiculoAlocado?.placa;
    if (!placa) {
      return transporte;
    }

    const placaRegistro = placasCadastro.get(normalizarPlaca(placa));
    if (!placaRegistro) {
      return transporte;
    }

    return {
      ...transporte,
      veiculoAlocado: buildVeiculoAlocadoFromPlaca(placaRegistro),
    };
  });
}

function enriquecerTransportesComCustoPrevisto(
  items: TransporteGrupo[],
  perfisTarifas: PerfilTarifaItem[],
): TransporteGrupo[] {
  if (!perfisTarifas.length) {
    return items;
  }

  return items.map((transporte) => {
    const custoPrevisto = resolverCustoPrevistoPorPerfil(transporte, perfisTarifas);

    if (custoPrevisto == null || transporte.custoPrevisto === custoPrevisto) {
      return transporte;
    }

    return {
      ...transporte,
      custoPrevisto,
    };
  });
}

export function useAlocacaoPlaca() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const [transportes, setTransportes] = useState<TransporteGrupo[]>([]);
  const [veiculosBase, setVeiculosBase] = useState<Veiculo[]>([]);
  const [perfisTarifas, setPerfisTarifas] = useState<PerfilTarifaItem[]>([]);
  const perfisTarifasRef = useRef(perfisTarifas);
  perfisTarifasRef.current = perfisTarifas;
  const [transportadorasOpcoes, setTransportadorasOpcoes] = useState<string[]>([]);
  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatusTransporte>('todos');
  const [filtroRegiao, setFiltroRegiao] = useState('todas');
  const [intervaloData, setIntervaloData] = useState<IntervaloData>(() =>
    criarIntervaloPadraoHoje(),
  );
  const [filtroRapido, setFiltroRapido] =
    useState<FiltroRapidoTransporte>('todos');
  const [carregandoTransportes, setCarregandoTransportes] = useState(false);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set());
  const [expandidos, setExpandidos] = useState<Set<string>>(() => new Set());
  const [processando, setProcessando] = useState(false);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [modalRoteirizacaoAberto, setModalRoteirizacaoAberto] = useState(false);
  const [modalItinerarioAberto, setModalItinerarioAberto] = useState(false);
  const [modalAlocarAberto, setModalAlocarAberto] = useState(false);
  const [modalPrioridadeAberto, setModalPrioridadeAberto] = useState(false);
  const [modalImprimirAberto, setModalImprimirAberto] = useState(false);
  const [modalAdicionarNfAberto, setModalAdicionarNfAberto] = useState(false);
  const [gerandoPdfMapas, setGerandoPdfMapas] = useState(false);
  const [transporteSelecionado, setTransporteSelecionado] =
    useState<TransporteGrupo | null>(null);
  const [transportePrioridadeSelecionado, setTransportePrioridadeSelecionado] =
    useState<TransporteGrupo | null>(null);
  const [transporteAdicionarNfSelecionado, setTransporteAdicionarNfSelecionado] =
    useState<TransporteGrupo | null>(null);
  const [alocacoesPendentesSalvar, setAlocacoesPendentesSalvar] = useState<
    Set<string>
  >(() => new Set());
  const [uploadLoteIdAtivo, setUploadLoteIdAtivo] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    target: TransporteGrupo | null;
  }>({ open: false, target: null });
  const [desalocarReentregaDialog, setDesalocarReentregaDialog] = useState<{
    open: boolean;
    transporte: TransporteGrupo | null;
    remessa: RemessaItem | null;
  }>({ open: false, transporte: null, remessa: null });
  const [excluirMapaConfReentregaDialog, setExcluirMapaConfReentregaDialog] =
    useState<{
      open: boolean;
      transporte: TransporteGrupo | null;
    }>({ open: false, transporte: null });
  const [uploadConflitoDialog, setUploadConflitoDialog] = useState<{
    open: boolean;
    rotas: RotaConflitanteUpload[];
  }>({ open: false, rotas: [] });

  const carregarTransportes = useCallback(async () => {
    if (!unidadeSelecionada?.id) {
      setTransportes([]);
      setAlocacoesPendentesSalvar(new Set());
      return;
    }

    setCarregandoTransportes(true);

    try {
      const resultado = await listTransportes(unidadeSelecionada.id);
      const grupos = mapTransportesApiToGrupos(resultado.transportes);
      const enriquecidosComPlacas = await enriquecerTransportesComPlacas(
        unidadeSelecionada.id,
        grupos,
      );
      setTransportes(
        enriquecerTransportesComCustoPrevisto(
          enriquecidosComPlacas,
          perfisTarifasRef.current,
        ),
      );
      setAlocacoesPendentesSalvar(new Set());
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os transportes.';
      toast.error(message);
      setTransportes([]);
    } finally {
      setCarregandoTransportes(false);
    }
  }, [unidadeSelecionada?.id]);

  useEffect(() => {
    void carregarTransportes();
  }, [carregarTransportes]);

  useEffect(() => {
    if (!perfisTarifas.length) {
      return;
    }

    setTransportes((prev) => {
      if (!prev.length) {
        return prev;
      }

      return enriquecerTransportesComCustoPrevisto(prev, perfisTarifas);
    });
  }, [perfisTarifas]);

  const carregarVeiculos = useCallback(async () => {
    if (!unidadeSelecionada?.id) {
      setVeiculosBase([]);
      setPerfisTarifas([]);
      setTransportadorasOpcoes([]);
      return;
    }

    setCarregandoVeiculos(true);

    try {
      const [placasResultado, perfisResultado, transportadorasResultado] =
        await Promise.allSettled([
          listAllPlacasUnidade(unidadeSelecionada.id),
          listPerfisTarifas({ unidadeId: unidadeSelecionada.id }),
          listAllTransportadorasUnidade(unidadeSelecionada.id),
        ]);

      if (placasResultado.status === 'rejected') {
        throw placasResultado.reason;
      }

      const perfisPorId =
        perfisResultado.status === 'fulfilled'
          ? buildPerfilTarifaMap(
              perfisResultado.value.items.map(mapPerfilTarifaToItem),
            )
          : new Map();

      if (perfisResultado.status === 'fulfilled') {
        setPerfisTarifas(
          perfisResultado.value.items.map(mapPerfilTarifaToItem),
        );
      } else {
        setPerfisTarifas([]);
      }

      if (perfisResultado.status === 'rejected') {
        const message =
          perfisResultado.reason instanceof ApiClientError
            ? perfisResultado.reason.message
            : 'Não foi possível carregar os perfis de tarifa.';
        toast.error(message);
      }

      const veiculosMapeados = mapAllPlacasToVeiculos(
        placasResultado.value,
        perfisPorId,
      );
      setVeiculosBase(veiculosMapeados);

      const nomes = new Set<string>();

      if (transportadorasResultado.status === 'fulfilled') {
        transportadorasResultado.value.forEach((transportadora) => {
          if (transportadora.nome.trim()) {
            nomes.add(transportadora.nome.trim());
          }
        });
      } else {
        const message =
          transportadorasResultado.reason instanceof ApiClientError
            ? transportadorasResultado.reason.message
            : 'Não foi possível carregar as transportadoras.';
        toast.error(message);
      }

      veiculosMapeados.forEach((veiculo) => {
        if (veiculo.transportadora.trim()) {
          nomes.add(veiculo.transportadora.trim());
        }
      });
      setTransportadorasOpcoes([...nomes].sort((a, b) => a.localeCompare(b)));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as placas.';
      toast.error(message);
      setVeiculosBase([]);
      setPerfisTarifas([]);
      setTransportadorasOpcoes([]);
    } finally {
      setCarregandoVeiculos(false);
    }
  }, [unidadeSelecionada?.id]);

  useEffect(() => {
    void carregarVeiculos();
  }, [carregarVeiculos]);

  const veiculos = useMemo(() => {
    const alocadosIds = new Set(
      transportes
        .map((transporte) => transporte.veiculoAlocado?.veiculoId)
        .filter((id): id is string => Boolean(id)),
    );

    const pesoPorVeiculo = new Map<string, number>();
    transportes.forEach((transporte) => {
      const veiculoId = transporte.veiculoAlocado?.veiculoId;
      if (!veiculoId) {
        return;
      }

      pesoPorVeiculo.set(
        veiculoId,
        (pesoPorVeiculo.get(veiculoId) ?? 0) + transporte.pesoTotal,
      );
    });

    return veiculosBase.map((veiculo) => ({
      ...veiculo,
      disponivel: !alocadosIds.has(veiculo.id),
      pesoAlocado: pesoPorVeiculo.get(veiculo.id) ?? 0,
    }));
  }, [transportes, veiculosBase]);

  const transportesPorIntervalo = useMemo(
    () => filtrarPorIntervalo(transportes, intervaloData),
    [transportes, intervaloData],
  );

  const summary = useMemo(
    () => calcularSummary(transportesPorIntervalo, perfisTarifas),
    [transportesPorIntervalo, perfisTarifas],
  );

  const baseFiltrada = useMemo(() => {
    let items = transportesPorIntervalo;
    items = filtrarPorStatus(items, filtroStatus);
    items = filtrarPorRegiao(items, filtroRegiao);
    return items;
  }, [transportesPorIntervalo, filtroStatus, filtroRegiao]);

  const contadoresFiltroRapido = useMemo(
    () => contarTransportesPorFiltroRapido(baseFiltrada),
    [baseFiltrada],
  );

  const filtrados = useMemo(() => {
    return filtrarTransportesExpedicao(baseFiltrada, filtroRapido);
  }, [baseFiltrada, filtroRapido]);

  const uploadLoteIdTorre = useMemo(() => {
    const fromTransportes = resolverUploadLoteIdTransportes(filtrados);
    return fromTransportes ?? uploadLoteIdAtivo;
  }, [filtrados, uploadLoteIdAtivo]);

  const torreControleHref = uploadLoteIdTorre
    ? buildTorreControleExpedicaoHref(
        uploadLoteIdTorre,
        unidadeSelecionada?.id,
        intervaloDataPreenchido(intervaloData)
          ? normalizarIntervaloData(intervaloData)
          : criarIntervaloPadraoHoje(),
      )
    : null;

  const regioes = useMemo(
    () =>
      [
        ...new Set(
          transportesPorIntervalo
            .map((transporte) => transporte.regiao)
            .filter((regiao) => regiao.trim().length > 0),
        ),
      ],
    [transportesPorIntervalo],
  );

  const transportesPendentes = useMemo(
    () =>
      transportesPorIntervalo.filter(
        (transporte) =>
          transporte.status === 'PENDENTE' || transporte.status === 'PARCIAL',
      ),
    [transportesPorIntervalo],
  );

  const transportesSelecionados = useMemo(
    () => transportes.filter((transporte) => selecionados.has(transporte.id)),
    [transportes, selecionados],
  );

  const transportesSemMapaSalvo = useMemo(
    () =>
      transportesSelecionados.filter(
        (transporte) => transporte.ultimoMapaLoteId == null,
      ),
    [transportesSelecionados],
  );

  const todosSelecionados =
    filtrados.length > 0 && filtrados.every((item) => selecionados.has(item.id));

  const toggleSelecionado = useCallback((id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelecionarTodos = useCallback(() => {
    setSelecionados((prev) => {
      if (todosSelecionados) {
        const next = new Set(prev);
        filtrados.forEach((item) => next.delete(item.id));
        return next;
      }

      const next = new Set(prev);
      filtrados.forEach((item) => next.add(item.id));
      return next;
    });
  }, [filtrados, todosSelecionados]);

  const toggleExpandido = useCallback((id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const abrirModalUpload = useCallback(() => {
    setModalUploadAberto(true);
  }, []);

  const fecharModalUpload = useCallback(() => {
    setModalUploadAberto(false);
  }, []);

  const abrirModalRoteirizacao = useCallback(() => {
    setModalRoteirizacaoAberto(true);
  }, []);

  const fecharModalRoteirizacao = useCallback(() => {
    setModalRoteirizacaoAberto(false);
  }, []);

  const abrirModalItinerario = useCallback(() => {
    setModalItinerarioAberto(true);
  }, []);

  const fecharModalItinerario = useCallback(() => {
    setModalItinerarioAberto(false);
  }, []);

  const abrirModalAlocar = useCallback((transporte: TransporteGrupo) => {
    setTransporteSelecionado(transporte);
    setModalAlocarAberto(true);
  }, []);

  const fecharModalAlocar = useCallback(() => {
    setModalAlocarAberto(false);
    setTransporteSelecionado(null);
  }, []);

  const abrirModalPrioridade = useCallback((transporte: TransporteGrupo) => {
    setTransportePrioridadeSelecionado(transporte);
    setModalPrioridadeAberto(true);
  }, []);

  const fecharModalPrioridade = useCallback(() => {
    setModalPrioridadeAberto(false);
    setTransportePrioridadeSelecionado(null);
  }, []);

  const abrirModalAdicionarNf = useCallback((transporte: TransporteGrupo) => {
    setTransporteAdicionarNfSelecionado(transporte);
    setModalAdicionarNfAberto(true);
  }, []);

  const fecharModalAdicionarNf = useCallback(() => {
    setModalAdicionarNfAberto(false);
    setTransporteAdicionarNfSelecionado(null);
  }, []);

  const abrirModalImprimir = useCallback(() => {
    setModalImprimirAberto(true);
  }, []);

  const fecharModalImprimir = useCallback(() => {
    setModalImprimirAberto(false);
  }, []);

  const imprimirMapas = useCallback(
    async (configuracaoImpressaoId: string, tipoMapa: TipoMapaImpressao) => {
      if (!unidadeSelecionada?.id) {
        toast.error('Selecione uma unidade antes de imprimir os mapas.');
        return;
      }

      const transporteIds = transportesSelecionados.map(
        (transporte) => transporte.id,
      );

      if (!transporteIds.length) {
        toast.error('Selecione ao menos um transporte.');
        return;
      }

      const transportesSemRemessaReentrega = transportesSelecionados.filter(
        (transporte) =>
          !transporte.remessas.some((remessa) => remessa.origem === 'reentrega'),
      );

      if (tipoMapa === 'conferencia_reentrega') {
        if (transportesSemRemessaReentrega.length > 0) {
          toast.error('Nenhuma remessa de reentrega nos transportes selecionados.', {
            description: transportesSemRemessaReentrega
              .map((transporte) => transporte.rota)
              .join(', '),
          });
          return;
        }
      } else if (transportesSemMapaSalvo.length > 0) {
        toast.error('Salve os mapas antes de imprimir.', {
          description: transportesSemMapaSalvo
            .map((transporte) => transporte.rota)
            .join(', '),
        });
        return;
      }

      setGerandoPdfMapas(true);

      try {
        const { filename } =
          tipoMapa === 'conferencia_reentrega'
            ? await imprimirMapaConferenciaReentregaApi({
                unidadeId: unidadeSelecionada.id,
                transporteIds,
                configuracaoImpressaoId,
              })
            : await imprimirMapasApi({
                unidadeId: unidadeSelecionada.id,
                transporteIds,
                configuracaoImpressaoId,
                tipoMapa,
              });

        setModalImprimirAberto(false);
        toast.success('PDF gerado com sucesso', {
          description: filename,
        });
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível gerar o PDF dos mapas.';
        toast.error(message);
      } finally {
        setGerandoPdfMapas(false);
      }
    },
    [
      transportesSelecionados,
      transportesSemMapaSalvo,
      unidadeSelecionada?.id,
    ],
  );

  const confirmarAlocacao = useCallback(
    (veiculoId: string, pagamento: PagamentoAlocacao) => {
      const veiculo = veiculos.find((item) => item.id === veiculoId);
      if (!transporteSelecionado || !veiculo) {
        return;
      }

      if (!veiculo.perfilTarifaId || !veiculo.perfilTarifaNome?.trim()) {
        toast.error('Placa sem perfil de tarifa', {
          description:
            'Cadastre o perfil de tarifa desta placa antes de alocar.',
        });
        return;
      }

      if (!pagamento.semCusto && !pagamento.perfilPagamentoId) {
        toast.error('Informe o perfil de pagamento', {
          description:
            'Selecione um perfil de tarifa para pagamento ou marque como transporte sem custo.',
        });
        return;
      }

      const alocado = buildVeiculoAlocadoFromVeiculo(veiculo);
      const custoPrevisto = resolverCustoPrevistoPorPerfil(
        transporteSelecionado,
        perfisTarifas,
        {
          perfilTarifaId: veiculo.perfilTarifaId ?? null,
          perfilPagamentoId: pagamento.semCusto
            ? null
            : pagamento.perfilPagamentoId,
          semCusto: pagamento.semCusto,
        },
      );

      setTransportes((prev) =>
        prev.map((item) =>
          item.id !== transporteSelecionado.id
            ? item
            : {
                ...item,
                status: 'ALOCADO',
                veiculoAlocado: alocado,
                perfilPagamentoId: pagamento.semCusto
                  ? null
                  : pagamento.perfilPagamentoId,
                perfilPagamentoNome: pagamento.semCusto
                  ? null
                  : pagamento.perfilPagamentoNome,
                freteSemCusto: pagamento.semCusto,
                ...(custoPrevisto != null ? { custoPrevisto } : {}),
              },
        ),
      );
      setAlocacoesPendentesSalvar((prev) =>
        new Set(prev).add(transporteSelecionado.id),
      );
      setModalAlocarAberto(false);
      setTransporteSelecionado(null);

      const descricaoPagamento = pagamento.semCusto
        ? 'Transporte sem custo'
        : pagamento.perfilPagamentoId !== veiculo.perfilTarifaId
          ? `Pago como ${pagamento.perfilPagamentoNome}`
          : `Perfil ${veiculo.perfilTarifaNome}`;

      toast.success(`Placa ${veiculo.placa} alocada`, {
        description: `${transporteSelecionado.rota} · ${descricaoPagamento}. Clique em "Salvar Alocações" para persistir.`,
      });
    },
    [transporteSelecionado, veiculos, perfisTarifas],
  );

  const confirmarUpload = useCallback(
    async (payload: RemessaUploadConfirmPayload) => {
      if (!unidadeSelecionada?.id) {
        toast.error('Selecione uma unidade antes de importar remessas.');
        return;
      }

      setProcessando(true);

      try {
        const resultado = await uploadLoteRemessas({
          unidadeId: unidadeSelecionada.id,
          arquivo: payload.arquivo,
          dataReferencia: payload.dataReferencia,
          horarioExpectativaSaida: payload.horarioExpectativaSaida,
        });

        setUploadLoteIdAtivo(resultado.loteId);
        persistUploadLoteAtivo(unidadeSelecionada.id, resultado.loteId);
        setIntervaloData({
          dataInicio: payload.dataReferencia,
          dataFim: payload.dataReferencia,
        });
        await carregarTransportes();

        setProcessando(false);
        setModalUploadAberto(false);
        toast.success('Remessas importadas com sucesso', {
          description: `${resultado.totalRemessas} remessa${resultado.totalRemessas !== 1 ? 's' : ''} em ${resultado.totalTransportes} transporte${resultado.totalTransportes !== 1 ? 's' : ''} (${resultado.nomeArquivo}).`,
        });
      } catch (error) {
        setProcessando(false);

        if (error instanceof ApiClientError && error.status === 409) {
          const rotasConflitantes = parseUploadConflitoBody(error.body);

          if (rotasConflitantes && rotasConflitantes.length > 0) {
            setUploadConflitoDialog({ open: true, rotas: rotasConflitantes });
            return;
          }
        }

        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível importar as remessas.';
        toast.error(message);
      }
    },
    [carregarTransportes, unidadeSelecionada],
  );

  const importarRoteirizacao = useCallback(
    async (arquivo: File): Promise<RoteirizacaoImportResultado> => {
      if (!unidadeSelecionada?.id) {
        toast.error('Selecione uma unidade antes de importar a roteirização.');
        return { alocados: 0, naoEncontrados: 0, placasNaoCadastradas: 0, placasSemPerfil: 0 };
      }

      setProcessando(true);

      try {
        const linhas = await parseRoteirizacaoXlsx(arquivo);

        const placasNecessarias = [
          ...new Set(
            linhas
              .map((linha) => normalizarPlaca(linha.placa))
              .filter((placa) => placa.length > 0),
          ),
        ];

        const placasCadastroLista = await buscarPlacasUnidadePorPlacas(
          unidadeSelecionada.id,
          placasNecessarias,
        );

        const placasCadastro = buildPlacaCadastroMap(placasCadastroLista);

        const transportesDoUpload = intervaloDataPreenchido(intervaloData)
          ? filtrarTransportesPorIntervalo(transportes, intervaloData)
          : transportes;

        const transportesPorRota = new Map(
          transportesDoUpload.map((transporte) => [
            stripLeadingZeros(transporte.rota),
            transporte,
          ]),
        );

        let alocados = 0;
        let naoEncontrados = 0;
        let placasNaoCadastradas = 0;
        let placasSemPerfil = 0;
        const atualizacoes = new Map<string, TransporteGrupo>();

        for (const linha of linhas) {
          const transporte = transportesPorRota.get(linha.numeroTransporte);

          if (!transporte) {
            naoEncontrados += 1;
            continue;
          }

          const placaNormalizada = normalizarPlaca(linha.placa);
          const placaRegistro = placasCadastro.get(placaNormalizada);

          if (!placaRegistro) {
            placasNaoCadastradas += 1;
            continue;
          }

          if (!placaRegistro.perfilTarifaId || !placaRegistro.perfilTarifaNome?.trim()) {
            placasSemPerfil += 1;
            continue;
          }

          const custoPrevisto = resolverCustoPrevistoPorPerfil(
            transporte,
            perfisTarifas,
            {
              perfilTarifaId: placaRegistro.perfilTarifaId ?? null,
              perfilPagamentoId: placaRegistro.perfilTarifaId ?? null,
            },
          );

          atualizacoes.set(transporte.id, {
            ...transporte,
            status: 'ALOCADO',
            veiculoAlocado: buildVeiculoAlocadoFromPlaca(placaRegistro),
            perfilPagamentoId: placaRegistro.perfilTarifaId,
            perfilPagamentoNome: placaRegistro.perfilTarifaNome?.trim() ?? null,
            freteSemCusto: false,
            ...(linha.itinerario ? { itinerario: linha.itinerario } : {}),
            ...(linha.nivelPrioridade
              ? {
                  nivelPrioridade: linha.nivelPrioridade,
                  isPrioridade:
                    linha.nivelPrioridade === 'urgente' ||
                    linha.nivelPrioridade === 'prioritaria',
                }
              : {}),
            ...(linha.largada
              ? { horarioExpectativaSaida: linha.largada.toISOString() }
              : {}),
            ...(linha.cidade ? { cidade: linha.cidade } : {}),
            ...(linha.bairro ? { bairro: linha.bairro } : {}),
            ...(custoPrevisto != null ? { custoPrevisto } : {}),
          });
          alocados += 1;
        }

        if (atualizacoes.size > 0) {
          setTransportes((prev) =>
            prev.map((item) => atualizacoes.get(item.id) ?? item),
          );
          setAlocacoesPendentesSalvar((prev) => {
            const next = new Set(prev);
            for (const id of atualizacoes.keys()) {
              next.add(id);
            }
            return next;
          });
        }

        if (alocados > 0) {
          const avisos: string[] = [];
          if (naoEncontrados > 0) {
            avisos.push(
              `${naoEncontrados} transporte${naoEncontrados !== 1 ? 's' : ''} não encontrado${naoEncontrados !== 1 ? 's' : ''}`,
            );
          }
          if (placasNaoCadastradas > 0) {
            avisos.push(
              `${placasNaoCadastradas} transporte${placasNaoCadastradas !== 1 ? 's' : ''} com placa não cadastrada`,
            );
          }
          if (placasSemPerfil > 0) {
            avisos.push(
              `${placasSemPerfil} transporte${placasSemPerfil !== 1 ? 's' : ''} com placa sem perfil de tarifa`,
            );
          }

          toast.success('Roteirização importada', {
            description:
              avisos.length > 0
                ? `${alocados} alocado${alocados !== 1 ? 's' : ''}. ${avisos.join('. ')}. Clique em "Salvar Alocações" para persistir.`
                : `${alocados} transporte${alocados !== 1 ? 's' : ''} alocado${alocados !== 1 ? 's' : ''}. Clique em "Salvar Alocações" para persistir.`,
          });
        } else {
          const partes: string[] = [];

          if (naoEncontrados > 0) {
            partes.push(
              `${naoEncontrados} transporte${naoEncontrados !== 1 ? 's' : ''} da planilha não encontrado${naoEncontrados !== 1 ? 's' : ''} no upload${intervaloDataPreenchido(intervaloData) ? ` do período ${formatarRotuloIntervalo(intervaloData)}` : ''}`,
            );
          }

          if (placasNaoCadastradas > 0) {
            partes.push(
              `${placasNaoCadastradas} transporte${placasNaoCadastradas !== 1 ? 's' : ''} com placa não cadastrada`,
            );
          }

          if (placasSemPerfil > 0) {
            partes.push(
              `${placasSemPerfil} transporte${placasSemPerfil !== 1 ? 's' : ''} com placa cadastrada sem perfil de tarifa`,
            );
          }

          if (partes.length > 0) {
            toast.warning('Nenhum transporte alocado', {
              description: partes.join('. ') + '.',
            });
          }
        }

        return { alocados, naoEncontrados, placasNaoCadastradas, placasSemPerfil };
      } catch (error) {
        const message =
          error instanceof ParseRoteirizacaoError
            ? error.message
            : error instanceof ApiClientError
              ? error.message
              : 'Não foi possível importar a roteirização.';
        toast.error(message);
        return {
          alocados: 0,
          naoEncontrados: 0,
          placasNaoCadastradas: 0,
          placasSemPerfil: 0,
        };
      } finally {
        setProcessando(false);
      }
    },
    [transportes, unidadeSelecionada?.id, intervaloData, perfisTarifas],
  );

  const importarItinerario = useCallback(
    async (arquivo: File): Promise<ItinerarioImportResultado> => {
      if (!unidadeSelecionada?.id) {
        toast.error('Selecione uma unidade antes de importar o itinerário.');
        return { atualizados: 0, naoEncontrados: 0 };
      }

      const uploadLoteId = resolverUploadLoteIdTransportes(transportes);

      if (!uploadLoteId) {
        toast.error('Nenhum upload ativo encontrado para importar o itinerário.');
        return { atualizados: 0, naoEncontrados: 0 };
      }

      setProcessando(true);

      try {
        const linhas = await parseItinerarioXlsx(arquivo);
        const resultado = await atualizarItinerarioRemessas(uploadLoteId, {
          itinerarios: linhas,
        });

        await carregarTransportes();

        if (resultado.atualizados > 0) {
          const avisos: string[] = [];

          if (resultado.naoEncontrados > 0) {
            avisos.push(
              `${resultado.naoEncontrados} remessa${resultado.naoEncontrados !== 1 ? 's' : ''} não encontrada${resultado.naoEncontrados !== 1 ? 's' : ''}`,
            );
          }

          toast.success('Itinerário importado', {
            description:
              avisos.length > 0
                ? `${resultado.atualizados} remessa${resultado.atualizados !== 1 ? 's' : ''} atualizada${resultado.atualizados !== 1 ? 's' : ''}. ${avisos.join('. ')}.`
                : `${resultado.atualizados} remessa${resultado.atualizados !== 1 ? 's' : ''} atualizada${resultado.atualizados !== 1 ? 's' : ''}.`,
          });
        } else if (resultado.naoEncontrados > 0) {
          toast.warning('Nenhuma remessa atualizada', {
            description: `${resultado.naoEncontrados} remessa${resultado.naoEncontrados !== 1 ? 's' : ''} da planilha não encontrada${resultado.naoEncontrados !== 1 ? 's' : ''} no upload.`,
          });
        }

        return resultado;
      } catch (error) {
        const message =
          error instanceof ParseItinerarioError
            ? error.message
            : error instanceof ApiClientError
              ? error.message
              : 'Não foi possível importar o itinerário.';
        toast.error(message);
        return { atualizados: 0, naoEncontrados: 0 };
      } finally {
        setProcessando(false);
      }
    },
    [carregarTransportes, transportes, unidadeSelecionada?.id],
  );

  const salvarAlocacoes = useCallback(async () => {
    if (!unidadeSelecionada?.id) {
      toast.error('Selecione uma unidade antes de salvar as alocações.');
      return;
    }

    const transportesPendentes = transportes.filter(
      (transporte) =>
        alocacoesPendentesSalvar.has(transporte.id) &&
        transporte.veiculoAlocado?.placa &&
        transporte.veiculoAlocado.transportadora,
    );

    const transportesParaSalvar = transportesPendentes.filter(
      (transporte) =>
        transporte.freteSemCusto || Boolean(transporte.perfilPagamentoId),
    );

    const puladosLocalmente =
      transportesPendentes.length - transportesParaSalvar.length;

    if (puladosLocalmente > 0) {
      toast.warning(
        `${puladosLocalmente} transporte${puladosLocalmente !== 1 ? 's' : ''} sem perfil de pagamento`,
        {
          description:
            'Informe o perfil de pagamento ou marque como sem custo antes de salvar.',
        },
      );
    }

    if (!transportesParaSalvar.length) {
      toast.error('Nenhuma alocação pendente para salvar.');
      return;
    }

    setProcessando(true);

    try {
      const resultado = await salvarAlocacoesTransportes({
        unidadeId: unidadeSelecionada.id,
        alocacoes: transportesParaSalvar.map((transporte) => {
          const custoPrevisto = resolverCustoPrevistoPorPerfil(
            transporte,
            perfisTarifas,
          );

          return {
            transporteId: transporte.id,
            placaTransportadoraId: transporte.veiculoAlocado!.veiculoId,
            placa: transporte.veiculoAlocado!.placa,
            transportadora: transporte.veiculoAlocado!.transportadora,
            motorista: transporte.veiculoAlocado!.motorista || null,
            perfilTarifaId: transporte.veiculoAlocado!.perfilTarifaId ?? null,
            perfilTarifaNome: transporte.veiculoAlocado!.perfilTarifaNome ?? null,
            perfilPagamentoId: transporte.freteSemCusto
              ? null
              : transporte.perfilPagamentoId ?? null,
            perfilPagamentoNome: transporte.freteSemCusto
              ? null
              : transporte.perfilPagamentoNome ?? null,
            semCusto: transporte.freteSemCusto ?? false,
            itinerario: transporte.itinerario ?? null,
            nivelPrioridade: transporte.nivelPrioridade ?? null,
            horarioExpectativaSaida: transporte.horarioExpectativaSaida ?? null,
            cidade: transporte.cidade,
            bairro: transporte.bairro || null,
            isPrioridade: transporte.isPrioridade ?? false,
            custoPrevisto,
          };
        }),
      });

      await carregarTransportes();

      const totalPulados = (resultado.pulados ?? 0) + puladosLocalmente;
      const descricaoAtualizados = `${resultado.atualizados} transporte${resultado.atualizados !== 1 ? 's' : ''} atualizado${resultado.atualizados !== 1 ? 's' : ''} no banco.`;
      const descricaoPulados =
        totalPulados > 0
          ? ` ${totalPulados} pulado${totalPulados !== 1 ? 's' : ''} por falta de perfil de pagamento.`
          : '';

      toast.success('Alocações salvas', {
        description: descricaoAtualizados + descricaoPulados,
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar as alocações.';
      toast.error(message);
    } finally {
      setProcessando(false);
    }
  }, [
    alocacoesPendentesSalvar,
    carregarTransportes,
    perfisTarifas,
    transportes,
    unidadeSelecionada?.id,
  ]);

  const navegarParaGerarMapas = useCallback(() => {
    const ids =
      selecionados.size > 0
        ? Array.from(selecionados)
        : filtrados.map((transporte) => transporte.id);
    const grupos = filtrados.filter((transporte) => ids.includes(transporte.id));

    saveMapaSelecao(ids);
    saveMapaTransportes(grupos);
    router.push('/transporte/gerar-mapas');
  }, [filtrados, router, selecionados]);

  const navegarParaImpressaoMapaSeparacao = useCallback(() => {
    const id =
      selecionados.size > 0
        ? Array.from(selecionados)[0]
        : filtrados[0]?.id;

    if (!id) {
      router.push('/transporte/impressao-mapa-separacao');
      return;
    }

    router.push(`/transporte/impressao-mapa-separacao?id=${id}`);
  }, [filtrados, router, selecionados]);

  const abrirDeleteDialog = useCallback((transporte: TransporteGrupo) => {
    setDeleteDialog({ open: true, target: transporte });
  }, []);

  const fecharDeleteDialog = useCallback(() => {
    if (processando) {
      return;
    }

    setDeleteDialog({ open: false, target: null });
  }, [processando]);

  const fecharUploadConflitoDialog = useCallback(() => {
    setUploadConflitoDialog({ open: false, rotas: [] });
  }, []);

  const confirmarExclusaoTransporte = useCallback(async () => {
    const target = deleteDialog.target;

    if (!target || !unidadeSelecionada?.id) {
      return;
    }

    setProcessando(true);

    try {
      await deleteTransporte(target.id, unidadeSelecionada.id);
      setDeleteDialog({ open: false, target: null });
      setSelecionados((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
      await carregarTransportes();
      toast.success(`Transporte ${target.rota} excluído.`);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível excluir o transporte.';
      toast.error(message);
    } finally {
      setProcessando(false);
    }
  }, [carregarTransportes, deleteDialog.target, unidadeSelecionada?.id]);

  const abrirDesalocarReentregaDialog = useCallback(
    (transporte: TransporteGrupo, remessa: RemessaItem) => {
      setDesalocarReentregaDialog({ open: true, transporte, remessa });
    },
    [],
  );

  const fecharDesalocarReentregaDialog = useCallback(() => {
    if (processando) {
      return;
    }

    setDesalocarReentregaDialog({ open: false, transporte: null, remessa: null });
  }, [processando]);

  const confirmarDesalocarReentrega = useCallback(async () => {
    const { transporte, remessa } = desalocarReentregaDialog;

    if (!transporte || !remessa || !unidadeSelecionada?.id) {
      return;
    }

    setProcessando(true);

    try {
      await desvincularNfsDevolucaoTransporte(transporte.id, {
        unidadeId: unidadeSelecionada.id,
        remessaIds: [remessa.id],
      });
      setDesalocarReentregaDialog({ open: false, transporte: null, remessa: null });
      await carregarTransportes();
      toast.success(`NF ${remessa.remessa} desalocada do transporte ${transporte.rota}.`);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível desalocar a reentrega.';
      toast.error(message);
    } finally {
      setProcessando(false);
    }
  }, [
    carregarTransportes,
    desalocarReentregaDialog,
    unidadeSelecionada?.id,
  ]);

  const abrirExcluirMapaConfReentregaDialog = useCallback(
    (transporte: TransporteGrupo) => {
      setExcluirMapaConfReentregaDialog({ open: true, transporte });
    },
    [],
  );

  const fecharExcluirMapaConfReentregaDialog = useCallback(() => {
    if (processando) {
      return;
    }

    setExcluirMapaConfReentregaDialog({ open: false, transporte: null });
  }, [processando]);

  const confirmarExcluirMapaConfReentrega = useCallback(async () => {
    const target = excluirMapaConfReentregaDialog.transporte;

    if (!target || !unidadeSelecionada?.id) {
      return;
    }

    setProcessando(true);

    try {
      await excluirMapaConferenciaReentregaTransporte(
        target.id,
        unidadeSelecionada.id,
      );
      setExcluirMapaConfReentregaDialog({ open: false, transporte: null });
      await carregarTransportes();
      toast.success(
        `Mapa de conferência reentrega excluído do transporte ${target.rota}.`,
      );
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível excluir o mapa de conferência reentrega.';
      toast.error(message);
    } finally {
      setProcessando(false);
    }
  }, [
    carregarTransportes,
    excluirMapaConfReentregaDialog.transporte,
    unidadeSelecionada?.id,
  ]);

  const confirmarPrioridade = useCallback(
    async (payload: PrioridadeTransporteConfirmPayload) => {
      const target = transportePrioridadeSelecionado;

      if (!target || !unidadeSelecionada?.id) {
        return;
      }

      setProcessando(true);

      try {
        await atualizarPrioridadeTransporte(target.id, {
          unidadeId: unidadeSelecionada.id,
          isPrioridade: payload.isPrioridade,
          nivelPrioridade: payload.nivelPrioridade,
        });
        fecharModalPrioridade();
        await carregarTransportes();
        toast.success(
          payload.isPrioridade
            ? `Prioridade ${payload.nivelPrioridade ?? 'normal'} definida para rota ${target.rota}.`
            : `Prioridade removida da rota ${target.rota}.`,
        );
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível atualizar a prioridade do transporte.';
        toast.error(message);
      } finally {
        setProcessando(false);
      }
    },
    [
      carregarTransportes,
      fecharModalPrioridade,
      transportePrioridadeSelecionado,
      unidadeSelecionada?.id,
    ],
  );

  return {
    summary,
    transportes: filtrados,
    transportesTodos: transportes,
    veiculos,
    perfisTarifas,
    transportadorasOpcoes,
    regioes,
    transportesPendentes,
    filtroStatus,
    setFiltroStatus,
    filtroRegiao,
    setFiltroRegiao,
    intervaloData,
    setIntervaloData,
    filtroRapido,
    setFiltroRapido,
    contadoresFiltroRapido,
    intervaloDataPreenchido: intervaloDataPreenchido(intervaloData),
    selecionados,
    expandidos,
    processando,
    carregandoTransportes,
    carregandoVeiculos,
    todosSelecionados,
    modalUploadAberto,
    modalRoteirizacaoAberto,
    modalItinerarioAberto,
    modalAlocarAberto,
    modalPrioridadeAberto,
    modalImprimirAberto,
    modalAdicionarNfAberto,
    transporteSelecionado,
    transportePrioridadeSelecionado,
    transporteAdicionarNfSelecionado,
    deleteDialog,
    desalocarReentregaDialog,
    excluirMapaConfReentregaDialog,
    uploadConflitoDialog,
    transportesSelecionados,
    transportesSemMapaSalvo,
    gerandoPdfMapas,
    unidadeId: unidadeSelecionada?.id ?? null,
    uploadLoteIdTorre,
    torreControleHref,
    alocacoesPendentesSalvar,
    temAlocacoesPendentesSalvar: alocacoesPendentesSalvar.size > 0,
    toggleSelecionado,
    toggleSelecionarTodos,
    toggleExpandido,
    abrirModalUpload,
    fecharModalUpload,
    abrirModalRoteirizacao,
    fecharModalRoteirizacao,
    abrirModalItinerario,
    fecharModalItinerario,
    abrirModalAlocar,
    fecharModalAlocar,
    abrirModalPrioridade,
    fecharModalPrioridade,
    abrirModalAdicionarNf,
    fecharModalAdicionarNf,
    abrirModalImprimir,
    fecharModalImprimir,
    imprimirMapas,
    confirmarUpload,
    importarRoteirizacao,
    importarItinerario,
    confirmarAlocacao,
    confirmarPrioridade,
    salvarAlocacoes,
    navegarParaGerarMapas,
    navegarParaImpressaoMapaSeparacao,
    abrirDeleteDialog,
    fecharDeleteDialog,
    confirmarExclusaoTransporte,
    abrirDesalocarReentregaDialog,
    fecharDesalocarReentregaDialog,
    confirmarDesalocarReentrega,
    abrirExcluirMapaConfReentregaDialog,
    fecharExcluirMapaConfReentregaDialog,
    confirmarExcluirMapaConfReentrega,
    fecharUploadConflitoDialog,
    recarregarTransportes: carregarTransportes,
  };
}
