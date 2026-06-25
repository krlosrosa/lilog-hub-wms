import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DemandaArmazenagemDetailResponseDto,
  ListDemandasArmazenagemQueryDto,
  ListDemandasArmazenagemResponseDto,
} from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { GetDemandaArmazenagemUseCase } from '../../../application/usecases/armazenagem/list-demandas-armazenagem.usecase.js';
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
export class GetDemandaArmazenagemController {
  constructor(
    private readonly getDemandaArmazenagemUseCase: GetDemandaArmazenagemUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get storage demand details',
    operationId: 'getDemandaArmazenagem',
  })
  @ApiSuccessResponse(DemandaArmazenagemDetailResponseDto)
  handle(@Param() params: DemandaIdParamDto) {
    return this.getDemandaArmazenagemUseCase.execute(params.id);
  }
}
