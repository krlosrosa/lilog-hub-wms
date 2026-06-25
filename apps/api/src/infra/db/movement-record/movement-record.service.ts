import { Inject, Injectable } from '@nestjs/common';

import type { CreateMovementRecordInput } from '../../../domain/model/movement-record/movement-record.model.js';
import type {
  IMovementRecordRepository,
  ListItemMovementsFilter,
} from '../../../domain/repositories/movement-record/movement-record.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import {
  createMovementRecordDb,
  listItemMovementsDb,
} from './create-movement-record.drizzle.js';

@Injectable()
export class MovementRecordService implements IMovementRecordRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  create(data: CreateMovementRecordInput) {
    return createMovementRecordDb(this.db, data);
  }

  listByItem(filter: ListItemMovementsFilter) {
    return listItemMovementsDb(this.db, filter);
  }
}