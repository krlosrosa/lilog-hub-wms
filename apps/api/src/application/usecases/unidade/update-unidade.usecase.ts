import {
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import type { UpdateUnidadeInput } from '../../../domain/model/unidade/unidade.model.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { setAuditBefore } from '../../../shared/utils/audit-context.js';

@Injectable({ scope: Scope.REQUEST })
export class UpdateUnidadeUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    @Inject(REQUEST) private readonly request: unknown,
  ) {}

  async execute(id: string, data: UpdateUnidadeInput) {
    const existing = await this.unidadeRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Unidade "${id}" não encontrada`);
    }

    setAuditBefore(this.request, existing);

    const updated = await this.unidadeRepository.update(id, data);

    if (!updated) {
      throw new NotFoundException(`Unidade "${id}" não encontrada`);
    }

    const unidade = await this.unidadeRepository.findById(id);

    if (!unidade) {
      throw new NotFoundException(`Unidade "${id}" não encontrada`);
    }

    return unidade;
  }
}
