import { Inject, Injectable } from '@nestjs/common';

import {
  PRODUTO_ENDERECO_REPOSITORY,
  type GrupoComEnderecosRecord,
  type IProdutoEnderecoRepository,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';

@Injectable()
export class ListGruposEnderecosUseCase {
  constructor(
    @Inject(PRODUTO_ENDERECO_REPOSITORY)
    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,
  ) {}

  execute(centroId: string): Promise<GrupoComEnderecosRecord[]> {
    return this.produtoEnderecoRepository.listGruposComEnderecos(centroId);
  }
}
