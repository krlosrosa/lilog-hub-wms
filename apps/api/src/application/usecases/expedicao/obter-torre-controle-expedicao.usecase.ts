import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { TorreControleSnapshotDto } from '../../dtos/expedicao/torre-controle.dto.js';
import { montarSnapshotTorreControle } from '../../services/expedicao/torre-controle/montar-snapshot-torre-controle.js';
import {
  TORRE_CONTROLE_REPOSITORY,
  type ITorreControleRepository,
} from '../../../domain/repositories/expedicao/torre-controle.repository.js';

type ObterTorreControleInput = {
  unidadeId: string;
  uploadLoteId: string;
  sessaoId?: string;
};

@Injectable()
export class ObterTorreControleExpedicaoUseCase {
  constructor(
    @Inject(TORRE_CONTROLE_REPOSITORY)
    private readonly torreControleRepository: ITorreControleRepository,
  ) {}

  async execute(input: ObterTorreControleInput): Promise<TorreControleSnapshotDto> {
    const readModel = await this.torreControleRepository.obterReadModel({
      unidadeId: input.unidadeId,
      uploadLoteId: input.uploadLoteId,
    });

    if (!readModel.turno) {
      throw new NotFoundException(
        'Turno de expedição não encontrado para o lote informado.',
      );
    }

    return montarSnapshotTorreControle(readModel, input.sessaoId);
  }
}
