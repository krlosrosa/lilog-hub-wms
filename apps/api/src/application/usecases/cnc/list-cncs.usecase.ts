import { Inject, Injectable } from '@nestjs/common';

import type { ListCncsFilter } from '../../../domain/repositories/cnc/cnc.repository.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';

@Injectable()
export class ListCncsUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  execute(filter: ListCncsFilter) {
    return this.cncRepository.list(filter);
  }
}
