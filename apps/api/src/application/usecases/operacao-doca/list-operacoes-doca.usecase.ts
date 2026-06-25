import { Inject, Injectable } from '@nestjs/common';

import {
  OPERACAO_DOCA_REPOSITORY,
  type IOperacaoDocaRepository,
  type ListOperacoesDocaFilter,
} from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';

export type ListOperacoesDocaQuery = Omit<
  ListOperacoesDocaFilter,
  'dataPrevistaFrom' | 'dataPrevistaTo'
> & {
  dataPrevistaFrom?: string | Date;
  dataPrevistaTo?: string | Date;
};

@Injectable()
export class ListOperacoesDocaUseCase {
  constructor(
    @Inject(OPERACAO_DOCA_REPOSITORY)
    private readonly operacaoDocaRepository: IOperacaoDocaRepository,
  ) {}

  execute(filter: ListOperacoesDocaQuery) {
    return this.operacaoDocaRepository.list({
      ...filter,
      dataPrevistaFrom: filter.dataPrevistaFrom
        ? new Date(filter.dataPrevistaFrom)
        : undefined,
      dataPrevistaTo: filter.dataPrevistaTo
        ? new Date(filter.dataPrevistaTo)
        : undefined,
    });
  }
}
