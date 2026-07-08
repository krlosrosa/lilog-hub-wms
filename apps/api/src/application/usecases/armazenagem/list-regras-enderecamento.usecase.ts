import { Inject, Injectable } from '@nestjs/common';

import {
  REGRA_ENDERECAMENTO_REPOSITORY,
  type IRegraEnderecamentoRepository,
  type ListRegrasEnderecamentoFilter,
} from '../../../domain/repositories/armazenagem/regra-enderecamento.repository.js';

@Injectable()
export class ListRegrasEnderecamentoUseCase {
  constructor(
    @Inject(REGRA_ENDERECAMENTO_REPOSITORY)
    private readonly regraEnderecamentoRepository: IRegraEnderecamentoRepository,
  ) {}

  execute(filter: ListRegrasEnderecamentoFilter) {
    return this.regraEnderecamentoRepository.list(filter);
  }
}
