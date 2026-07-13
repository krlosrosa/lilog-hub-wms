import { Inject, Injectable } from '@nestjs/common';

import type { ListCncItensFilter } from '../../../domain/repositories/cnc/cnc.repository.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';

@Injectable()
export class ListCncItensUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  execute(filter: ListCncItensFilter) {
    return this.cncRepository.listItens(filter);
  }
}
