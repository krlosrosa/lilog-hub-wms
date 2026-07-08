import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DemandaArmazenagemDetailResponseDto } from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { ValidarDemandaArmazenagemUseCase } from '../../../application/usecases/armazenagem/validar-demanda-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const DemandaIdParamSchema = z.object({
  id: z.uuid(),
});

class DemandaIdParamDto extends createZodDto(DemandaIdParamSchema) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ValidarDemandaArmazenagemController {
  constructor(
    private readonly validarDemandaArmazenagemUseCase: ValidarDemandaArmazenagemUseCase,
  ) {}

  @Post(':id/validar')
  @ApiOperation({
    summary: 'Validar demanda de armazenagem (liberar paletes para movimentação)',
    operationId: 'validarDemandaArmazenagem',
  })
  @ApiSuccessResponse(DemandaArmazenagemDetailResponseDto)
  handle(
    @Param() params: DemandaIdParamDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.validarDemandaArmazenagemUseCase.execute({
      demandaId: params.id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
