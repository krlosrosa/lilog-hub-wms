import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DemandaArmazenagemDetailResponseDto } from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { ConcluirDemandaArmazenagemUseCase } from '../../../application/usecases/armazenagem/concluir-demanda-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const DemandaIdParamSchema = z.object({
  id: z.uuid(),
});

class DemandaIdParamDto extends createZodDto(DemandaIdParamSchema) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ConcluirDemandaArmazenagemController {
  constructor(
    private readonly concluirDemandaArmazenagemUseCase: ConcluirDemandaArmazenagemUseCase,
  ) {}

  @Post(':id/concluir')
  @ApiOperation({
    summary: 'Complete storage demand',
    operationId: 'concluirDemandaArmazenagem',
  })
  @ApiSuccessResponse(DemandaArmazenagemDetailResponseDto)
  handle(@Param() params: DemandaIdParamDto) {
    return this.concluirDemandaArmazenagemUseCase.execute(params.id);
  }
}
