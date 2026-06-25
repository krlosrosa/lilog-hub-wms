import { MOCK_TRANSPORTES } from '@/features/transporte/mocks/transporte.mock';
import type {
  IndicadoresOperacionais,
  PedidoPicking,
  PrioridadePedido,
  RegistroAuditoria,
  TipoPedido,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

function hashString(valor: string): number {
  let hash = 0;
  for (let i = 0; i < valor.length; i += 1) {
    hash = (hash << 5) - hash + valor.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const PRIORIDADES: PrioridadePedido[] = ['urgente', 'alta', 'normal', 'baixa'];
const TIPOS_PEDIDO: TipoPedido[] = [
  'venda',
  'transferencia',
  'reentrega',
  'bonificacao',
];

const CENTROS = ['CD São Paulo', 'CD Campinas', 'CD Guarulhos'];

function definirPrioridade(remessaId: string): PrioridadePedido {
  const indice = hashString(remessaId) % PRIORIDADES.length;
  return PRIORIDADES[indice] ?? 'normal';
}

function definirTipoPedido(
  remessaId: string,
  motivoReentrega?: string,
): TipoPedido {
  if (motivoReentrega) return 'reentrega';
  const indice = hashString(remessaId) % TIPOS_PEDIDO.length;
  return TIPOS_PEDIDO[indice] ?? 'venda';
}

function definirQtdLinhas(remessaId: string, peso: number): number {
  const base = 3 + (hashString(remessaId) % 4);
  return Math.min(base, Math.max(3, Math.ceil(peso / 120)));
}

export const MOCK_PEDIDOS_PICKING: PedidoPicking[] = MOCK_TRANSPORTES.flatMap(
  (transporte) =>
    transporte.remessas.map((remessa) => {
      const qtdLinhas = definirQtdLinhas(remessa.id, remessa.peso);
      const qtdVolumes = Math.max(1, Math.ceil(remessa.volume * 2));

      return {
        id: remessa.id,
        numeroNF: remessa.remessa,
        cliente: remessa.cliente,
        rota: transporte.rota,
        transportadora:
          transporte.transportadoraAtribuida ??
          transporte.veiculoAlocado?.transportadora ??
          'Não atribuída',
        prioridade: definirPrioridade(remessa.id),
        dataExpedicao: transporte.dataTransporte ?? '2026-06-05',
        tipoPedido: definirTipoPedido(remessa.id, remessa.motivoReentrega),
        centroDistribuicao:
          (CENTROS[hashString(transporte.cidade) % CENTROS.length] as string) ??
          CENTROS[0],
        peso: remessa.peso,
        volume: remessa.volume,
        qtdLinhas,
        qtdVolumes,
        transporteId: transporte.id,
        transporteRota: transporte.rota,
      };
    }),
);

export const MOCK_INDICADORES_OPERACIONAIS: IndicadoresOperacionais = {
  mapasGeradosPeriodo: 142,
  linhasSeparadasPorMapa: 18.4,
  tempoMedioExecucaoMin: 24,
  produtividadeOperador: 46.2,
  produtividadePorEstrategia: {
    discreto: 38,
    batch: 52,
    cluster: 48,
    zone: 44,
    wave: 55,
  },
  taxaConclusao: 94.2,
  taxaDivergencias: 2.1,
  distanciaMediaPorMapa: 186,
};

export const MOCK_AUDITORIA_INICIAL: RegistroAuditoria[] = [
  {
    id: 'aud-001',
    tipo: 'geracao',
    descricao: 'Geração de 12 mapas — estratégia Batch Picking',
    usuario: 'João Silva',
    dataHora: '2026-06-05T08:30:00',
    detalhes: '42 pedidos · 186 linhas',
  },
  {
    id: 'aud-002',
    tipo: 'rebalanceamento',
    descricao: 'Rebalanceamento automático antes da geração',
    usuario: 'Sistema',
    dataHora: '2026-06-05T08:28:00',
    detalhes: 'Distribuição otimizada por distância e peso',
  },
  {
    id: 'aud-003',
    tipo: 'reimpressao',
    descricao: 'Reimpressão do mapa MAP-20260605-003',
    usuario: 'Maria Santos',
    dataHora: '2026-06-04T16:45:00',
    mapaId: 'MAP-20260605-003',
  },
];

export function listarRotasDisponiveis(): string[] {
  return [...new Set(MOCK_PEDIDOS_PICKING.map((p) => p.rota))].sort();
}

export function listarTransportadorasDisponiveis(): string[] {
  return [
    ...new Set(MOCK_PEDIDOS_PICKING.map((p) => p.transportadora)),
  ].sort();
}

export function listarClientesDisponiveis(): string[] {
  return [...new Set(MOCK_PEDIDOS_PICKING.map((p) => p.cliente))].sort();
}

export function listarCentrosDisponiveis(): string[] {
  return [
    ...new Set(MOCK_PEDIDOS_PICKING.map((p) => p.centroDistribuicao)),
  ].sort();
}
