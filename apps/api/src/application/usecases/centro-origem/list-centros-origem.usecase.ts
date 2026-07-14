import { Inject, Injectable } from '@nestjs/common';

import {
  CENTRO_ORIGEM_REPOSITORY,
  type ICentroOrigemRepository,
  type ListCentrosOrigemFilter,
} from '../../../domain/repositories/centro-origem/centro-origem.repository.js';

@Injectable()
export class ListCentrosOrigemUseCase {
  constructor(
    @Inject(CENTRO_ORIGEM_REPOSITORY)
    private readonly centroOrigemRepository: ICentroOrigemRepository,
  ) {}

  execute(filter: ListCentrosOrigemFilter) {
    return this.centroOrigemRepository.list(filter);
  }
}
