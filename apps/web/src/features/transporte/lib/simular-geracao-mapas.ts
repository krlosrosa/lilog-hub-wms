import {
  balancearGrupos,
  estimarOperadores,
  estimarTempoGrupo,
  montarGrupoTrabalho,
  type GrupoTrabalho,
} from '@/features/transporte/lib/balancear-trabalho';
import { gerarLinhasPicking } from '@/features/transporte/lib/gerar-linhas-picking';
import {
  estimarDistancia,
  estimarTempoMinutos,
  otimizarRotaColeta,
} from '@/features/transporte/lib/otimizar-rota-coleta';
import type {
  ConfigGeracaoMapas,
  PedidoPicking,
  ResultadoSimulacao,
  SimulacaoMapa,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

function agruparPorCampo<T extends { id: string }>(
  itens: T[],
  chave: (item: T) => string,
): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  itens.forEach((item) => {
    const k = chave(item);
    const atual = mapa.get(k) ?? [];
    atual.push(item);
    mapa.set(k, atual);
  });
  return mapa;
}

function dividirEmChunks<T>(itens: T[], tamanho: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    chunks.push(itens.slice(i, i + tamanho));
  }
  return chunks;
}

function formatarDataOnda(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}${mes}${dia}`;
}

function criarGruposEstrategia(
  pedidos: PedidoPicking[],
  linhas: ReturnType<typeof gerarLinhasPicking>,
  config: ConfigGeracaoMapas,
): Array<{ titulo: string; pedidoIds: string[]; linhas: typeof linhas; meta?: string }> {
  const { estrategia, configEstrategia } = config;

  switch (estrategia) {
    case 'discreto': {
      const limite = configEstrategia.tipo === 'discreto'
        ? configEstrategia.limiteLinhasPorMapa
        : 30;
      return pedidos.flatMap((pedido) => {
        const linhasPedido = linhas.filter((l) => l.pedidoId === pedido.id);
        const chunks = dividirEmChunks(linhasPedido, limite);
        return chunks.map((chunk, index) => ({
          titulo: `Pedido ${pedido.numeroNF}${chunks.length > 1 ? ` — Parte ${index + 1}` : ''}`,
          pedidoIds: [pedido.id],
          linhas: chunk,
        }));
      });
    }

    case 'batch': {
      const cfg = configEstrategia.tipo === 'batch' ? configEstrategia : null;
      const maxPedidos = cfg?.maxPedidosPorMapa ?? 10;
      const chunks = dividirEmChunks(pedidos, maxPedidos);
      return chunks.map((chunk, index) => {
        const ids = chunk.map((p) => p.id);
        const linhasChunk = linhas.filter((l) => ids.includes(l.pedidoId));
        const agrupamento = cfg?.agrupamento ?? 'sku';
        return {
          titulo: `Batch ${index + 1} — ${chunk.length} pedidos`,
          pedidoIds: ids,
          linhas: linhasChunk,
          meta: `Agrupamento: ${agrupamento}`,
        };
      });
    }

    case 'cluster': {
      const cfg = configEstrategia.tipo === 'cluster' ? configEstrategia : null;
      const porCarrinho = cfg?.pedidosPorCarrinho ?? 6;
      const chunks = dividirEmChunks(pedidos, porCarrinho);
      return chunks.map((chunk, index) => {
        const ids = chunk.map((p) => p.id);
        const linhasChunk = linhas
          .filter((l) => ids.includes(l.pedidoId))
          .map((linha, i) => ({
            ...linha,
            boxDestino: `Box ${(i % porCarrinho) + 1}`,
          }));
        return {
          titulo: `Cluster ${index + 1} — ${chunk.length} pedidos`,
          pedidoIds: ids,
          linhas: linhasChunk,
          meta: cfg?.usarCompartimentos ? 'Com compartimentos' : undefined,
        };
      });
    }

    case 'zone': {
      const cfg = configEstrategia.tipo === 'zone' ? configEstrategia : null;
      const zonasAtivas = cfg?.zonasAtivas ?? [];
      const porZona = agruparPorCampo(linhas, (l) => l.zona);
      return [...porZona.entries()]
        .filter(([zona]) => zonasAtivas.length === 0 || zonasAtivas.includes(zona))
        .map(([zona, linhasZona]) => ({
          titulo: zona,
          pedidoIds: [...new Set(linhasZona.map((l) => l.pedidoId))],
          linhas: linhasZona,
          meta: 'Zone Picking',
        }));
    }

    case 'wave': {
      const cfg = configEstrategia.tipo === 'wave' ? configEstrategia : null;
      const maxPedidos = cfg?.maxPedidos ?? 50;
      const nomeBase = cfg?.nomeOnda || `ONDA-${formatarDataOnda()}`;
      const chunks = dividirEmChunks(pedidos, maxPedidos);
      return chunks.map((chunk, index) => {
        const ids = chunk.map((p) => p.id);
        return {
          titulo: `${nomeBase}-${String(index + 1).padStart(2, '0')}`,
          pedidoIds: ids,
          linhas: linhas.filter((l) => ids.includes(l.pedidoId)),
          meta: `Capacidade: ${chunk.length}/${maxPedidos} pedidos`,
        };
      });
    }

    default:
      return [
        {
          titulo: 'Mapa único',
          pedidoIds: pedidos.map((p) => p.id),
          linhas,
        },
      ];
  }
}

function gruposParaSimulacao(
  grupos: Array<{
    titulo: string;
    pedidoIds: string[];
    linhas: ReturnType<typeof gerarLinhasPicking>;
    meta?: string;
  }>,
  pedidos: PedidoPicking[],
  config: ConfigGeracaoMapas,
): SimulacaoMapa[] {
  const gruposTrabalho: GrupoTrabalho[] = grupos.map((g) =>
    montarGrupoTrabalho(g.pedidoIds, g.linhas, pedidos, config.balanceamento),
  );

  const balanceados = balancearGrupos(gruposTrabalho, config.balanceamento);

  return grupos.map((grupo, index) => {
    const trabalho = balanceados[index];
    const linhasOtimizadas = otimizarRotaColeta(
      grupo.linhas,
      config.otimizacaoRota,
    );
    const distancia = trabalho?.distancia ?? estimarDistancia(linhasOtimizadas);
    const tempo = trabalho
      ? estimarTempoGrupo(trabalho)
      : estimarTempoMinutos(linhasOtimizadas, distancia);

    const pedidosGrupo = pedidos.filter((p) =>
      grupo.pedidoIds.includes(p.id),
    );

    return {
      id: `sim-${index + 1}`,
      titulo: grupo.titulo,
      qtdPedidos: grupo.pedidoIds.length,
      qtdLinhas: linhasOtimizadas.length,
      qtdVolumes: pedidosGrupo.reduce((acc, p) => acc + p.qtdVolumes, 0),
      peso: pedidosGrupo.reduce((acc, p) => acc + p.peso, 0),
      distanciaEstimada: distancia,
      tempoEstimadoMin: tempo,
      operadoresEstimados: 1,
      pedidoIds: grupo.pedidoIds,
    };
  });
}

export function simularGeracaoMapas(
  pedidos: PedidoPicking[],
  config: ConfigGeracaoMapas,
): ResultadoSimulacao {
  if (pedidos.length === 0) {
    return {
      mapas: [],
      totalMapas: 0,
      totalPedidos: 0,
      totalLinhas: 0,
      totalVolumes: 0,
      pesoTotal: 0,
      distanciaTotal: 0,
      tempoTotalMin: 0,
      operadoresNecessarios: 0,
    };
  }

  const linhas = gerarLinhasPicking(pedidos);
  const grupos = criarGruposEstrategia(pedidos, linhas, config);
  const mapas = gruposParaSimulacao(grupos, pedidos, config);

  const gruposTrabalho = grupos.map((g) =>
    montarGrupoTrabalho(g.pedidoIds, g.linhas, pedidos, config.balanceamento),
  );

  return {
    mapas,
    totalMapas: mapas.length,
    totalPedidos: pedidos.length,
    totalLinhas: mapas.reduce((acc, m) => acc + m.qtdLinhas, 0),
    totalVolumes: mapas.reduce((acc, m) => acc + m.qtdVolumes, 0),
    pesoTotal: mapas.reduce((acc, m) => acc + m.peso, 0),
    distanciaTotal: mapas.reduce((acc, m) => acc + m.distanciaEstimada, 0),
    tempoTotalMin: mapas.reduce((acc, m) => acc + m.tempoEstimadoMin, 0),
    operadoresNecessarios: estimarOperadores(
      balancearGrupos(gruposTrabalho, config.balanceamento),
    ),
  };
}
