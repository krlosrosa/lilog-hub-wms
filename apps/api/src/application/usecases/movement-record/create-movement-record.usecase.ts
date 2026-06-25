import { Inject, Injectable } from '@nestjs/common';

import type { CreateMovementRecordInput } from '../../../domain/model/movement-record/movement-record.model.js';
import {
  MOVEMENT_RECORD_REPOSITORY,
  type IMovementRecordRepository,
} from '../../../domain/repositories/movement-record/movement-record.repository.js';

@Injectable()
export class CreateMovementRecordUseCase {
  constructor(
    @Inject(MOVEMENT_RECORD_REPOSITORY)
    private readonly movementRecordRepository: IMovementRecordRepository,
  ) {}

  execute(data: CreateMovementRecordInput) {
    return this.movementRecordRepository.create(data);
  }
}
