import { Inject, Injectable } from '@nestjs/common';

import {
  inferCncResponsavel,
  inferResponsavelId,
} from '../../../domain/services/cnc-responsavel.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import type { CriarCncJobData } from '../../../infra/queues/cnc-queue.js';

function buildCncNumero(year: number, sequence: number): string {
  return `CNC-${year}-${String(sequence).padStart(5, '0')}`;
}

@Injectable()
export class CriarCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  async execute(data: CriarCncJobData) {
    const existing = await this.cncRepository.findByOrigem(
      'recebimento',
      data.recebimentoId,
    );

    if (existing) {
      return existing;
    }

    const responsavel = inferCncResponsavel({
      divergencias: data.divergencias,
      avarias: data.avarias,
    });

    const responsavelId = inferResponsavelId(
      responsavel,
      data.transportadoraId,
    );

    const year = new Date().getFullYear();
    const count = await this.cncRepository.countByYear(year);
    const numero = buildCncNumero(year, count + 1);

    const itens = [
      ...data.divergencias.map((divergencia) => ({
        tipo: 'divergencia' as const,
        referenciaId: divergencia.id,
      })),
      ...data.avarias.map((avaria) => ({
        tipo: 'avaria' as const,
        referenciaId: avaria.id,
      })),
    ];

    return this.cncRepository.create({
      numero,
      origem: 'recebimento',
      origemId: data.recebimentoId,
      unidadeId: data.unidadeId,
      responsavel,
      responsavelId,
      descricao: `CNC gerada automaticamente para recebimento ${data.recebimentoId}`,
      solicitanteId: data.responsavelOperacaoId,
      itens,
    });
  }
}
