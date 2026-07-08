import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import {
  normalizeUpdateEnderecoData,
  UpdateEnderecoInputSchema,
} from '../../../domain/model/endereco/endereco.model.js';
import { ENDERECO_EVENT } from '../../../domain/model/endereco/endereco.events.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import { hasStructuralChanges } from '../../../domain/services/endereco-rules.js';
import { setAuditBefore } from '../../../shared/utils/audit-context.js';
import { EnderecoEventPublisher } from '../../services/endereco-event.publisher.js';

export type UpdateEnderecoUseCaseInput = {
  id: string;
  data: Parameters<typeof UpdateEnderecoInputSchema.parse>[0];
  userId: number | null;
};

@Injectable({ scope: Scope.REQUEST })
export class UpdateEnderecoUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    private readonly enderecoEventPublisher: EnderecoEventPublisher,
    @Inject(REQUEST) private readonly request: unknown,
  ) {}

  async execute({ id, data, userId }: UpdateEnderecoUseCaseInput) {
    const existing = await this.enderecoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    if (existing.status === 'inativo') {
      throw new BadRequestException('Endereço inativo não pode ser alterado');
    }

    const parsed = normalizeUpdateEnderecoData(
      UpdateEnderecoInputSchema.parse(data),
    );

    if (hasStructuralChanges(existing, parsed)) {
      const hasStock = await this.enderecoRepository.hasStock(id);

      if (hasStock) {
        throw new BadRequestException(
          'Não é permitido alterar estrutura de endereço com estoque armazenado',
        );
      }

      if (!parsed.motivoAlteracao) {
        throw new BadRequestException(
          'Motivo da alteração é obrigatório para mudanças estruturais',
        );
      }
    }

    if (parsed.enderecoMascarado) {
      const unidadeId = parsed.unidadeId ?? existing.unidadeId;
      const duplicate = await this.enderecoRepository.findByUnidadeAndCodigo(
        unidadeId,
        parsed.enderecoMascarado,
      );

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Endereço "${parsed.enderecoMascarado}" já existe nesta unidade`,
        );
      }
    }

    setAuditBefore(this.request, {
      ...existing,
      motivoAlteracao: parsed.motivoAlteracao ?? null,
    });

    const { motivoAlteracao, ...updateData } = parsed;
    const updated = await this.enderecoRepository.update(id, updateData);

    if (!updated) {
      throw new NotFoundException(`Endereço "${id}" não encontrado`);
    }

    await this.enderecoEventPublisher.publish({
      type: ENDERECO_EVENT.ATUALIZADO,
      enderecoId: updated.id,
      unidadeId: updated.unidadeId,
      enderecoMascarado: updated.enderecoMascarado,
      userId,
      motivo: motivoAlteracao,
      metadata: {
        before: existing,
        after: updated,
      },
    });

    return updated;
  }
}
