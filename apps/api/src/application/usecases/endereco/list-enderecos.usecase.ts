import { Inject, Injectable } from '@nestjs/common';

import type {
  EnderecoKpiFilter,
  ListEnderecosFilter,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';

@Injectable()
export class ListEnderecosUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  execute(filter: ListEnderecosFilter) {
    return this.enderecoRepository.list(filter);
  }
}

@Injectable()
export class GetEnderecoKpiUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  execute(filter?: EnderecoKpiFilter) {
    return this.enderecoRepository.getKpi(filter);
  }
}
