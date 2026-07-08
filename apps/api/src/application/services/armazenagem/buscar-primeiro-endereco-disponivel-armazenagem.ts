import { TIPOS_ENDERECO_SUGESTAO_AUTOMATICA_ARMAZENAGEM } from '../../../domain/model/armazenagem/armazenagem.model.js';
import type { IEnderecoRepository } from '../../../domain/repositories/endereco/endereco.repository.js';

export async function buscarPrimeiroEnderecoDisponivelArmazenagem(
  enderecoRepository: IEnderecoRepository,
  unidadeId: string,
  excludeIds: string[],
): Promise<string | null> {
  const { items } = await enderecoRepository.list({
    unidadeId,
    status: 'disponivel',
    tipos: [...TIPOS_ENDERECO_SUGESTAO_AUTOMATICA_ARMAZENAGEM],
    sortBy: 'armazenagem',
    page: 1,
    limit: 1,
    excludeIds,
  });

  return items[0]?.id ?? null;
}
