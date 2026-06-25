import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateProdutoEnderecoInputSchema,
  type UpdateProdutoEnderecoData,
} from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import {
  PRODUTO_ENDERECO_REPOSITORY,
  type IProdutoEnderecoRepository,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import {
  assertEnderecoCompativelComAlocacao,
  mapProdutoEnderecoConstraintError,
  resolveUpdateMutation,
} from '../../services/produto-endereco-validation.js';

export type UpdateProdutoEnderecoUseCaseInput = {
  id: string;
  data: Parameters<typeof UpdateProdutoEnderecoInputSchema.parse>[0];
};

@Injectable()
export class UpdateProdutoEnderecoUseCase {
  constructor(
    @Inject(PRODUTO_ENDERECO_REPOSITORY)
    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute({ id, data }: UpdateProdutoEnderecoUseCaseInput) {
    const parsed: UpdateProdutoEnderecoData =
      UpdateProdutoEnderecoInputSchema.parse(data);

    const existing = await this.produtoEnderecoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Alocação "${id}" não encontrada`);
    }

    const mutation = resolveUpdateMutation(
      {
        centroId: existing.centroId,
        produtoId: existing.produtoId,
        enderecoId: existing.enderecoId,
        papel: existing.papel,
        ordem: existing.ordem,
        ativo: existing.ativo,
      },
      parsed,
    );

    const endereco = await this.enderecoRepository.findById(
      mutation.enderecoId,
    );

    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado');
    }

    assertEnderecoCompativelComAlocacao(
      endereco,
      mutation.centroId,
      mutation.papel,
    );

    try {
      const updated = await this.produtoEnderecoRepository.update(id, parsed);

      if (!updated) {
        throw new NotFoundException(`Alocação "${id}" não encontrada`);
      }

      return updated;
    } catch (error) {
      mapProdutoEnderecoConstraintError(error);
    }
  }
}
