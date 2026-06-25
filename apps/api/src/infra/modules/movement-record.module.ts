import { Module } from '@nestjs/common';

import { CreateMovementRecordUseCase } from '../../application/usecases/movement-record/create-movement-record.usecase.js';
import { ListItemMovementsUseCase } from '../../application/usecases/movement-record/list-item-movements.usecase.js';
import { MOVEMENT_RECORD_REPOSITORY } from '../../domain/repositories/movement-record/movement-record.repository.js';
import { MovementRecordService } from '../db/movement-record/movement-record.service.js';
import { ListItemMovementsController } from '../../presentation/controllers/movement-record/list-item-movements.controller.js';

@Module({
  controllers: [ListItemMovementsController],
  providers: [
    CreateMovementRecordUseCase,
    ListItemMovementsUseCase,
    {
      provide: MOVEMENT_RECORD_REPOSITORY,
      useClass: MovementRecordService,
    },
  ],
  exports: [CreateMovementRecordUseCase],
})
export class MovementRecordModule {}
