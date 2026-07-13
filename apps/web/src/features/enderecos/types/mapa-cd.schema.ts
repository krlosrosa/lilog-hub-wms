import { z } from 'zod';

import {
  enderecoStatusSchema,
  enderecoTipoSchema,
  type EnderecoStatus,
} from '@/features/enderecos/types/enderecos-gestao.schema';

export const mapaCdNivelSchema = z.object({
  id: z.string(),
  nivel: z.string(),
  tipo: enderecoTipoSchema,
  status: enderecoStatusSchema,
  ocupacaoPercent: z.number(),
  cargaMaxKg: z.string(),
  enderecoMascarado: z.string(),
});

export type MapaCdNivel = z.infer<typeof mapaCdNivelSchema>;

export const mapaCdPosicaoSchema = z.object({
  posicao: z.string(),
  niveis: z.array(mapaCdNivelSchema),
});

export type MapaCdPosicao = z.infer<typeof mapaCdPosicaoSchema>;

export const mapaCdRuaSchema = z.object({
  rua: z.string(),
  posicoes: z.array(mapaCdPosicaoSchema),
});

export type MapaCdRua = z.infer<typeof mapaCdRuaSchema>;

export const mapaCdZonaSchema = z.object({
  zona: z.string(),
  ruas: z.array(mapaCdRuaSchema),
});

export type MapaCdZona = z.infer<typeof mapaCdZonaSchema>;

export const mapaCdKpiSchema = z.object({
  total: z.number().int(),
  disponiveis: z.number().int(),
  ocupados: z.number().int(),
  bloqueados: z.number().int(),
  ocupacaoMediaPercent: z.number(),
});

export type MapaCdKpi = z.infer<typeof mapaCdKpiSchema>;

export const getMapaCdResponseSchema = z.object({
  zonas: z.array(mapaCdZonaSchema),
  kpi: mapaCdKpiSchema,
});

export type GetMapaCdResponse = z.infer<typeof getMapaCdResponseSchema>;

export type PosicaoSelecionada = {
  zona: string;
  rua: string;
  posicao: string;
  niveis: MapaCdNivel[];
};

export type CorOcupacao = {
  bg: string;
  border: string;
  text: string;
  pulse?: boolean;
};

export function resolverCorOcupacao(
  status: EnderecoStatus,
  ocupacaoPercent: number,
): CorOcupacao {
  if (status === 'bloqueado') {
    return {
      bg: 'bg-muted',
      border: 'border-outline-variant',
      text: 'text-muted-foreground',
    };
  }

  if (status === 'inativo') {
    return {
      bg: 'bg-surface-highest/60',
      border: 'border-outline-variant/40',
      text: 'text-muted-foreground/70',
    };
  }

  if (status === 'inventario') {
    return {
      bg: 'bg-secondary/25',
      border: 'border-secondary/40',
      text: 'text-secondary',
    };
  }

  if (ocupacaoPercent <= 0) {
    return {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/30',
      text: 'text-emerald-400',
    };
  }

  if (ocupacaoPercent <= 40) {
    return {
      bg: 'bg-emerald-600/35',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
    };
  }

  if (ocupacaoPercent <= 70) {
    return {
      bg: 'bg-amber-500/35',
      border: 'border-amber-400/30',
      text: 'text-amber-200',
    };
  }

  if (ocupacaoPercent <= 90) {
    return {
      bg: 'bg-orange-500/40',
      border: 'border-orange-400/35',
      text: 'text-orange-100',
    };
  }

  return {
    bg: 'bg-destructive/55',
    border: 'border-destructive/40',
    text: 'text-destructive-foreground',
    pulse: true,
  };
}

export function resolverCorPosicao(niveis: MapaCdNivel[]): CorOcupacao {
  if (niveis.length === 0) {
    return {
      bg: 'bg-surface-highest',
      border: 'border-outline-variant/30',
      text: 'text-muted-foreground',
    };
  }

  const prioridade: EnderecoStatus[] = [
    'bloqueado',
    'inventario',
    'inativo',
    'ocupado',
    'disponivel',
  ];

  const statusDominante =
    prioridade.find((status) => niveis.some((nivel) => nivel.status === status)) ??
    'disponivel';

  const ocupacaoMedia =
    niveis.reduce((acc, nivel) => acc + nivel.ocupacaoPercent, 0) / niveis.length;

  return resolverCorOcupacao(statusDominante, ocupacaoMedia);
}

export function buildPosicaoLabel(zona: string, rua: string, posicao: string) {
  return `${zona} ${rua} ${posicao}`;
}

export function parsePosicaoNumero(posicao: string): number {
  const digits = posicao.replace(/\D/g, '');
  const parsed = Number.parseInt(digits || posicao, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Lado A = posições ímpares (1, 3, 5…) */
export function isPosicaoLadoA(posicao: string): boolean {
  const numero = parsePosicaoNumero(posicao);
  return numero % 2 === 1;
}

export function splitPosicoesPorLado(posicoes: MapaCdPosicao[]): {
  ladoA: MapaCdPosicao[];
  ladoB: MapaCdPosicao[];
} {
  const ladoA: MapaCdPosicao[] = [];
  const ladoB: MapaCdPosicao[] = [];

  for (const posicao of posicoes) {
    if (isPosicaoLadoA(posicao.posicao)) {
      ladoA.push(posicao);
    } else {
      ladoB.push(posicao);
    }
  }

  const sortByNumero = (a: MapaCdPosicao, b: MapaCdPosicao) =>
    parsePosicaoNumero(a.posicao) - parsePosicaoNumero(b.posicao);

  return {
    ladoA: ladoA.sort(sortByNumero),
    ladoB: ladoB.sort(sortByNumero),
  };
}

export type GalpaoKpi = MapaCdKpi & {
  totalRuas: number;
  totalPosicoes: number;
};

export function calcularKpiZona(zona: MapaCdZona): GalpaoKpi {
  let disponiveis = 0;
  let ocupados = 0;
  let bloqueados = 0;
  let somaOcupacao = 0;
  let total = 0;
  let totalPosicoes = 0;

  for (const rua of zona.ruas) {
    totalPosicoes += rua.posicoes.length;

    for (const posicao of rua.posicoes) {
      for (const nivel of posicao.niveis) {
        total += 1;
        somaOcupacao += nivel.ocupacaoPercent;

        if (nivel.status === 'disponivel') {
          disponiveis += 1;
        } else if (nivel.status === 'ocupado') {
          ocupados += 1;
        } else if (nivel.status === 'bloqueado') {
          bloqueados += 1;
        }
      }
    }
  }

  return {
    total,
    disponiveis,
    ocupados,
    bloqueados,
    ocupacaoMediaPercent:
      total > 0 ? Number((somaOcupacao / total).toFixed(1)) : 0,
    totalRuas: zona.ruas.length,
    totalPosicoes,
  };
}

export function calcularOcupacaoMediaRua(rua: MapaCdRua): number {
  const niveis = rua.posicoes.flatMap((posicao) => posicao.niveis);

  if (niveis.length === 0) {
    return 0;
  }

  return (
    niveis.reduce((acc, nivel) => acc + nivel.ocupacaoPercent, 0) / niveis.length
  );
}

export function resolverStatusDominanteRua(rua: MapaCdRua): EnderecoStatus {
  const niveis = rua.posicoes.flatMap((posicao) => posicao.niveis);

  if (niveis.length === 0) {
    return 'disponivel';
  }

  const prioridade: EnderecoStatus[] = [
    'bloqueado',
    'inventario',
    'inativo',
    'ocupado',
    'disponivel',
  ];

  return (
    prioridade.find((status) => niveis.some((nivel) => nivel.status === status)) ??
    'disponivel'
  );
}
