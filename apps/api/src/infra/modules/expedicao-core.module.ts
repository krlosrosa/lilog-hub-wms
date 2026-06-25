import { Module } from '@nestjs/common';

import { TRANSPORTE_REPOSITORY } from '../../domain/repositories/expedicao/transporte.repository.js';
import { TransporteService } from '../db/expedicao/transporte.service.js';

@Module({
  providers: [
    {
      provide: TRANSPORTE_REPOSITORY,
      useClass: TransporteService,
    },
  ],
  exports: [TRANSPORTE_REPOSITORY],
})
export class ExpedicaoCoreModule {}
