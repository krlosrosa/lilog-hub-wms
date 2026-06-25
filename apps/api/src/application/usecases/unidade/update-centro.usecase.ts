import {
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import type { UpdateCentroInput } from '../../../domain/model/unidade/unidade.model.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { setAuditBefore } from '../../../shared/utils/audit-context.js';

@Injectable({ scope: Scope.REQUEST })
export class UpdateCentroUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    @Inject(REQUEST) private readonly request: unknown,
  ) {}

  async execute(
    unidadeId: string,
    centroId: string,
    data: UpdateCentroInput,
  ) {
    const unidade = await this.unidadeRepository.findById(unidadeId);

    if (!unidade) {
      throw new NotFoundException(`Unidade "${unidadeId}" não encontrada`);
    }

    const existingCentro = unidade.centros.find(
      (centro) => centro.id === centroId,
    );

    if (!existingCentro) {
      throw new NotFoundException(
        `Centro "${centroId}" não encontrado para a unidade "${unidadeId}"`,
      );
    }

    setAuditBefore(this.request, existingCentro);

    const updated = await this.unidadeRepository.updateCentro(
      centroId,
      unidadeId,
      data,
    );

    if (!updated) {
      throw new NotFoundException(
        `Centro "${centroId}" não encontrado para a unidade "${unidadeId}"`,
      );
    }

    return updated;
  }
}
