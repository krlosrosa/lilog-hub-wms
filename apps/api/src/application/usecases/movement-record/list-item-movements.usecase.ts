import { Inject, Injectable } from '@nestjs/common';

import {
  MOVEMENT_RECORD_REPOSITORY,
  type IMovementRecordRepository,
  type ListItemMovementsFilter,
} from '../../../domain/repositories/movement-record/movement-record.repository.js';

@Injectable()
export class ListItemMovementsUseCase {
  constructor(
    @Inject(MOVEMENT_RECORD_REPOSITORY)
    private readonly movementRecordRepository: IMovementRecordRepository,
  ) {}

  execute(filter: ListItemMovementsFilter) {
    return this.movementRecordRepository.listByItem(filter);
  }
}
