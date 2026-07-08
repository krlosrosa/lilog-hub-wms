import { Inject, Injectable } from '@nestjs/common';

import { CNC_EVENTO, type CncResponsavel } from '../../../domain/model/cnc/cnc.model.js';
import type { CreateCncItemInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import {
  inferFromAvariaNatureza,
  inferResponsavelId,
} from '../../../domain/services/cnc-responsavel.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import type { CriarCncJobData } from '../../../infra/queues/cnc-queue.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';

function buildCncNumero(year: number, sequence: number): string {
  return `CNC-${year}-${String(sequence).padStart(5, '0')}`;
}

function inferCncResponsavelFromItens(
  itens: CreateCncItemInput[],
): CncResponsavel {
  const responsaveis = new Set<CncResponsavel>();

  for (const item of itens) {
    if (item.responsavelSugerido) {
      responsaveis.add(item.responsavelSugerido);
      continue;
    }

    if (item.tipo === 'avaria' && item.naturezaAvaria) {
      responsaveis.add(inferFromAvariaNatureza(item.naturezaAvaria));
    } else {
      responsaveis.add('fornecedor');
    }
  }

  if (responsaveis.size === 1) {
    return [...responsaveis][0]!;
  }

  return 'indeterminado';
}

@Injectable()
export class CriarCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute(data: CriarCncJobData) {
    const existing = await this.cncRepository.findByOrigem(
      'recebimento',
      data.recebimentoId,
    );

    if (existing) {
      return existing;
    }

    const responsavel = inferCncResponsavelFromItens(data.itens);

    const responsavelId = inferResponsavelId(
      responsavel,
      data.transportadoraId,
    );

    const year = new Date().getFullYear();
    const count = await this.cncRepository.countByYear(year);
    const numero = buildCncNumero(year, count + 1);

    const cnc = await this.cncRepository.create({
      numero,
      origem: 'recebimento',
      origemId: data.recebimentoId,
      unidadeId: data.unidadeId,
      responsavel,
      responsavelId,
      descricao: data.descricao,
      solicitanteId: data.responsavelOperacaoId,
      itens: data.itens,
    });

    await this.cncEventPublisher.publishRegistrarEvento({
      cncId: cnc.id,
      tipoEvento: CNC_EVENTO.CNC_CRIADA,
      situacaoNova: 'pendente',
      descricao: `CNC ${cnc.numero} criada automaticamente a partir do recebimento ${data.recebimentoId}`,
      metadata: {
        recebimentoId: data.recebimentoId,
        preRecebimentoId: data.preRecebimentoId,
        quantidadeItens: data.itens.length,
      },
      criadoPorUserId: data.userId,
    });

    return cnc;
  }
}
