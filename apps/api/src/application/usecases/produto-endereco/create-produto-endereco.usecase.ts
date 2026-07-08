import {
  BadRequestException,
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
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
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
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute({ data }: CreateProdutoEnderecoUseCaseInput) {
    const parsed: CreateProdutoEnderecoData =
      CreateProdutoEnderecoInputSchema.parse(data);
    const mutation = resolveCreateMutation(parsed);

    const centroUnidadeId = await this.resolveCentroUnidadeId(mutation.centroId);

    const endereco = await this.enderecoRepository.findById(
      mutation.enderecoId,
    );

    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado');
    }

    assertEnderecoCompativelComAlocacao(
      endereco,
      centroUnidadeId,
      mutation.papel,
    );

    try {
      return await this.produtoEnderecoRepository.create(parsed);
    } catch (error) {
      mapProdutoEnderecoConstraintError(error);
    }
  }

  private async resolveCentroUnidadeId(centroId: string): Promise<string> {
    const centros = await this.unidadeRepository.listCentros();
    const centro = centros.find((item) => item.id === centroId);

    if (!centro) {
      throw new BadRequestException('Centro informado não encontrado');
    }

    return centro.unidadeId;
  }
}
