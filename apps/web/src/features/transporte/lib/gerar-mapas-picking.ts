import {
  balancearGrupos,
  montarGrupoTrabalho,
} from '@/features/transporte/lib/balancear-trabalho';
import { gerarLinhasPicking } from '@/features/transporte/lib/gerar-linhas-picking';
import { otimizarRotaColeta } from '@/features/transporte/lib/otimizar-rota-coleta';
import { simularGeracaoMapas } from '@/features/transporte/lib/simular-geracao-mapas';
import type {
  ConfigGeracaoMapas,
  MapaPickingGerado,
  PedidoPicking,
  RegistroAuditoria,
  ResultadoGeracao,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

function gerarCodigoMapa(indice: number): string {
  const agora = new Date();
  const data = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}`;
  return `MAP-${data}-${String(indice + 1).padStart(3, '0')}`;
}

function gerarQrValor(codigo: string): string {
  return `PICKING:${codigo}`;
}

export function gerarMapasPicking(
  pedidos: PedidoPicking[],
  config: ConfigGeracaoMapas,
  usuario: string,
): ResultadoGeracao {
  const simulacao = simularGeracaoMapas(pedidos, config);
  const linhas = gerarLinhasPicking(pedidos);
  const agora = new Date().toISOString();

  const mapas: MapaPickingGerado[] = simulacao.mapas.map((sim, index) => {
    const linhasMapa = linhas.filter((l) => sim.pedidoIds.includes(l.pedidoId));
    const linhasOtimizadas = otimizarRotaColeta(
      linhasMapa,
      config.otimizacaoRota,
    );

    const grupo = montarGrupoTrabalho(
      sim.pedidoIds,
      linhasOtimizadas,
      pedidos,
      config.balanceamento,
    );
    const [balanceado] = balancearGrupos([grupo], config.balanceamento);

    const codigo = gerarCodigoMapa(index);

    return {
      id: `mapa-${index + 1}`,
      codigo,
      titulo: sim.titulo,
      estrategia: config.estrategia,
      status: 'gerado',
      pedidoIds: sim.pedidoIds,
      linhas: linhasOtimizadas,
      qtdPedidos: sim.qtdPedidos,
      qtdLinhas: sim.qtdLinhas,
      qtdVolumes: sim.qtdVolumes,
      peso: sim.peso,
      distanciaEstimada: balanceado?.distancia ?? sim.distanciaEstimada,
      tempoEstimadoMin: sim.tempoEstimadoMin,
      qrCodeValor: gerarQrValor(codigo),
      onda: config.estrategia === 'wave' ? sim.titulo : undefined,
      zona: config.estrategia === 'zone' ? sim.titulo : undefined,
      agrupamento:
        config.estrategia === 'batch' &&
        config.configEstrategia.tipo === 'batch'
          ? config.configEstrategia.agrupamento
          : undefined,
      geradoEm: agora,
      geradoPor: usuario,
    };
  });

  return {
    mapas,
    totalMapas: mapas.length,
    geradoEm: agora,
    geradoPor: usuario,
    estrategia: config.estrategia,
  };
}

export function criarRegistroAuditoriaGeracao(
  resultado: ResultadoGeracao,
  usuario: string,
): RegistroAuditoria {
  return {
    id: `aud-${Date.now()}`,
    tipo: 'geracao',
    descricao: `Geração de ${resultado.totalMapas} mapa(s) — ${resultado.estrategia}`,
    usuario,
    dataHora: resultado.geradoEm,
    detalhes: `${resultado.mapas.reduce((acc, m) => acc + m.qtdPedidos, 0)} pedidos · ${resultado.mapas.reduce((acc, m) => acc + m.qtdLinhas, 0)} linhas`,
  };
}

export function criarRegistroAuditoriaRebalanceamento(
  usuario: string,
): RegistroAuditoria {
  return {
    id: `aud-${Date.now()}`,
    tipo: 'rebalanceamento',
    descricao: 'Rebalanceamento automático antes da geração',
    usuario,
    dataHora: new Date().toISOString(),
    detalhes: 'Distribuição otimizada por linhas, volumes, endereços e distância',
  };
}

export function criarRegistroAuditoriaReimpressao(
  mapa: MapaPickingGerado,
  usuario: string,
): RegistroAuditoria {
  return {
    id: `aud-${Date.now()}`,
    tipo: 'reimpressao',
    descricao: `Reimpressão do mapa ${mapa.codigo}`,
    usuario,
    dataHora: new Date().toISOString(),
    mapaId: mapa.codigo,
  };
}
