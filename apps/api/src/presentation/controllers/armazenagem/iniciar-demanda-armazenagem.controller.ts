import {
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DemandaArmazenagemDetailResponseDto } from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { IniciarDemandaArmazenagemUseCase } from '../../../application/usecases/armazenagem/iniciar-demanda-armazenagem.usecase.js';
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
export class IniciarDemandaArmazenagemController {
  constructor(
    private readonly iniciarDemandaArmazenagemUseCase: IniciarDemandaArmazenagemUseCase,
  ) {}

  @Post(':id/iniciar')
  @ApiOperation({
    summary: 'Start storage demand',
    operationId: 'iniciarDemandaArmazenagem',
  })
  @ApiSuccessResponse(DemandaArmazenagemDetailResponseDto)
  handle(
    @Param() params: DemandaIdParamDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.iniciarDemandaArmazenagemUseCase.execute({
      demandaId: params.id,
      responsavelId: req.user.id,
    });
  }
}
