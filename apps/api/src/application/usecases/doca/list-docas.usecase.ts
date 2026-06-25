import { Inject, Injectable } from '@nestjs/common';

import {
  DOCA_REPOSITORY,
  type IDocaRepository,
  type ListDocasFilter,
} from '../../../domain/repositories/doca/doca.repository.js';

@Injectable()
export class ListDocasUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
  ) {}

  execute(filter: ListDocasFilter) {
    return this.docaRepository.list(filter);
  }
}
