import type {
  ConfigBalanceamento,
  LinhaMapaPicking,
  PedidoPicking,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

import {
  estimarDistancia,
  estimarTempoMinutos,
} from '@/features/transporte/lib/otimizar-rota-coleta';

export type GrupoTrabalho = {
  pedidoIds: string[];
  linhas: LinhaMapaPicking[];
  peso: number;
  volumes: number;
  distancia: number;
  score: number;
};

function calcularScore(
  grupo: GrupoTrabalho,
  config: ConfigBalanceamento,
): number {
  let score = 0;
  if (config.considerarLinhas) score += grupo.linhas.length * 2;
  if (config.considerarVolumes) score += grupo.volumes * 1.5;
  if (config.considerarPeso) score += grupo.peso * 0.01;
  if (config.considerarEnderecos) {
    score += new Set(grupo.linhas.map((l) => l.endereco)).size * 3;
  }
  if (config.considerarDistancia) score += grupo.distancia * 0.05;
  return score;
}

export function balancearGrupos(
  grupos: GrupoTrabalho[],
  config: ConfigBalanceamento,
): GrupoTrabalho[] {
  if (!config.ativo || !config.rebalancearAutomatico) {
    return grupos.map((g) => ({ ...g, score: calcularScore(g, config) }));
  }

  const comScore = grupos.map((g) => ({
    ...g,
    score: calcularScore(g, config),
  }));

  const media =
    comScore.reduce((acc, g) => acc + g.score, 0) / Math.max(1, comScore.length);

  return comScore.map((grupo) => {
    const fator = grupo.score > media * 1.3 ? 0.92 : grupo.score < media * 0.7 ? 1.08 : 1;
    return {
      ...grupo,
      score: Math.round(grupo.score * fator),
      distancia: Math.round(grupo.distancia * (2 - fator * 0.5)),
    };
  });
}

export function montarGrupoTrabalho(
  pedidoIds: string[],
  linhas: LinhaMapaPicking[],
  pedidos: PedidoPicking[],
  config: ConfigBalanceamento,
): GrupoTrabalho {
  const pedidosGrupo = pedidos.filter((p) => pedidoIds.includes(p.id));
  const distancia = estimarDistancia(linhas);

  const grupo: GrupoTrabalho = {
    pedidoIds,
    linhas,
    peso: pedidosGrupo.reduce((acc, p) => acc + p.peso, 0),
    volumes: pedidosGrupo.reduce((acc, p) => acc + p.qtdVolumes, 0),
    distancia,
    score: 0,
  };

  grupo.score = calcularScore(grupo, config);
  return grupo;
}

export function estimarOperadores(grupos: GrupoTrabalho[]): number {
  if (grupos.length === 0) return 0;
  const scoreTotal = grupos.reduce((acc, g) => acc + g.score, 0);
  const mediaScore = scoreTotal / grupos.length;
  if (mediaScore > 80) return Math.min(grupos.length, 4);
  if (mediaScore > 50) return Math.min(grupos.length, 3);
  return Math.min(grupos.length, 2);
}

export function estimarTempoGrupo(grupo: GrupoTrabalho): number {
  return estimarTempoMinutos(grupo.linhas, grupo.distancia);
}
