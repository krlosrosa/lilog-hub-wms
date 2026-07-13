import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type { EnderecoStatus } from '../../../domain/model/endereco/endereco.model.js';
import {
  resolveEffectiveEnderecoStatus,
  resolveEffectiveOcupacaoPercent,
} from '../../../domain/services/resolve-endereco-ocupacao-from-saldo.js';
import { getMapaCdDb } from '../../../infra/db/endereco/get-mapa-cd.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

export type MapaCdNivelItem = {
  id: string;
  nivel: string;
  tipo: string;
  status: EnderecoStatus;
  ocupacaoPercent: number;
  cargaMaxKg: string;
  enderecoMascarado: string;
};

export type MapaCdPosicao = {
  posicao: string;
  niveis: MapaCdNivelItem[];
};

export type MapaCdRua = {
  rua: string;
  posicoes: MapaCdPosicao[];
};

export type MapaCdZona = {
  zona: string;
  ruas: MapaCdRua[];
};

export type GetMapaCdResult = {
  zonas: MapaCdZona[];
  kpi: {
    total: number;
    disponiveis: number;
    ocupados: number;
    bloqueados: number;
    ocupacaoMediaPercent: number;
  };
};

function compareSegmento(a: string, b: string): number {
  const numA = Number.parseInt(a, 10);
  const numB = Number.parseInt(b, 10);

  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }

  return a.localeCompare(b);
}

@Injectable()
export class GetMapaCdUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  async execute(unidadeId?: string): Promise<GetMapaCdResult> {
    const trimmedUnidadeId = unidadeId?.trim();

    if (!trimmedUnidadeId) {
      throw new BadRequestException(
        'Unidade não informada. Selecione uma unidade para visualizar o mapa.',
      );
    }

    const rows = await getMapaCdDb(this.db, trimmedUnidadeId);

    const zonaMap = new Map<
      string,
      Map<string, Map<string, MapaCdNivelItem[]>>
    >();

    let totalDisponiveis = 0;
    let totalOcupados = 0;
    let totalBloqueados = 0;
    let somaOcupacao = 0;

    for (const row of rows) {
      const totalSaldo = Number(row.totalSaldo ?? 0);
      const status = resolveEffectiveEnderecoStatus(
        row.status as EnderecoStatus,
        totalSaldo,
      );
      const ocupacaoPercent = Number(
        resolveEffectiveOcupacaoPercent(row.ocupacaoPercent, totalSaldo),
      );

      if (status === 'disponivel') {
        totalDisponiveis += 1;
      } else if (status === 'ocupado') {
        totalOcupados += 1;
      } else if (status === 'bloqueado') {
        totalBloqueados += 1;
      }

      somaOcupacao += ocupacaoPercent;

      const nivelItem: MapaCdNivelItem = {
        id: row.id,
        nivel: row.nivel,
        tipo: row.tipo,
        status,
        ocupacaoPercent,
        cargaMaxKg: row.cargaMaxKg,
        enderecoMascarado: row.enderecoMascarado,
      };

      if (!zonaMap.has(row.zona)) {
        zonaMap.set(row.zona, new Map());
      }

      const ruaMap = zonaMap.get(row.zona)!;

      if (!ruaMap.has(row.rua)) {
        ruaMap.set(row.rua, new Map());
      }

      const posicaoMap = ruaMap.get(row.rua)!;

      if (!posicaoMap.has(row.posicao)) {
        posicaoMap.set(row.posicao, []);
      }

      posicaoMap.get(row.posicao)!.push(nivelItem);
    }

    const zonas: MapaCdZona[] = Array.from(zonaMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([zona, ruaMap]) => ({
        zona,
        ruas: Array.from(ruaMap.entries())
          .sort(([a], [b]) => compareSegmento(a, b))
          .map(([rua, posicaoMap]) => ({
            rua,
            posicoes: Array.from(posicaoMap.entries())
              .sort(([a], [b]) => compareSegmento(a, b))
              .map(([posicao, niveis]) => ({
                posicao,
                niveis: [...niveis].sort((a, b) =>
                  compareSegmento(a.nivel, b.nivel),
                ),
              })),
          })),
      }));

    const total = rows.length;
    const ocupacaoMediaPercent =
      total > 0 ? Number((somaOcupacao / total).toFixed(1)) : 0;

    return {
      zonas,
      kpi: {
        total,
        disponiveis: totalDisponiveis,
        ocupados: totalOcupados,
        bloqueados: totalBloqueados,
        ocupacaoMediaPercent,
      },
    };
  }
}
