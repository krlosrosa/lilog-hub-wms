import type { IEnderecoRepository } from '../../../domain/repositories/endereco/endereco.repository.js';

export async function buscarEnderecoProximoProduto(
  enderecoRepository: IEnderecoRepository,
  produtoId: string,
  unidadeId: string,
  excludeIds: string[],
): Promise<string | null> {
  return enderecoRepository.findEnderecoProximoDisponivel({
    produtoId,
    unidadeId,
    excludeIds,
  });
}
