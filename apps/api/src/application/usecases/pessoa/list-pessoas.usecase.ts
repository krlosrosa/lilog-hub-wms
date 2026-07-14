import { Inject, Injectable } from '@nestjs/common';

import {
  PESSOA_REPOSITORY,
  type IPessoaRepository,
  type ListPessoasFilter,
} from '../../../domain/repositories/pessoa/pessoa.repository.js';

@Injectable()
export class ListPessoasUseCase {
  constructor(
    @Inject(PESSOA_REPOSITORY)
    private readonly pessoaRepository: IPessoaRepository,
  ) {}

  execute(filter: ListPessoasFilter) {
    return this.pessoaRepository.list(filter);
  }
}
