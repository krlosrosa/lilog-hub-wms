import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateProdutoEnderecoInputSchema,
  type CreateProdutoEnderecoData,
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
  resolveCreateMutation,
} from '../../services/produto-endereco-validation.js';

export type CreateProdutoEnderecoUseCaseInput = {
  data: Parameters<typeof CreateProdutoEnderecoInputSchema.parse>[0];
};

@Injectable()
export class CreateProdutoEnderecoUseCase {
  constructor(
    @Inject(PRODUTO_ENDERECO_REPOSITORY)
    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute({ data }: CreateProdutoEnderecoUseCaseInput) {
    const parsed: CreateProdutoEnderecoData =
      CreateProdutoEnderecoInputSchema.parse(data);
    const mutation = resolveCreateMutation(parsed);

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
      return await this.produtoEnderecoRepository.create(parsed);
    } catch (error) {
      mapProdutoEnderecoConstraintError(error);
    }
  }
}
