import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CentroOrigemResponseDto } from '../../../application/dtos/centro-origem/centro-origem.dto.js';
import { UpdateCentroOrigemUseCase } from '../../../application/usecases/centro-origem/update-centro-origem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const UpdateCentroOrigemBodySchema = z.object({
  nome: z.string().min(1).max(255).optional(),
});

class UpdateCentroOrigemBodyDto extends createZodDto(
  UpdateCentroOrigemBodySchema,
) {}

@ApiTags('Centro de Origem')
@Controller('centros-origem')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateCentroOrigemController {
  constructor(
    private readonly updateCentroOrigemUseCase: UpdateCentroOrigemUseCase,
  ) {}

  @Auditable({ action: 'update', resource: 'centro_origem' })
  @Patch(':centro')
  @ApiOperation({
    summary: 'Update centro de origem',
    operationId: 'updateCentroOrigem',
  })
  @ApiSuccessResponse(CentroOrigemResponseDto)
  handle(
    @Param('centro') centro: string,
    @Body() body: UpdateCentroOrigemBodyDto,
  ) {
    return this.updateCentroOrigemUseCase.execute(centro, body);
  }
}
