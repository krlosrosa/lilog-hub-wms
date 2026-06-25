import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CentroResponseDto } from '../../../application/dtos/unidade/list-unidades.dto.js';
import { UpdateCentroUseCase } from '../../../application/usecases/unidade/update-centro.usecase.js';
import { EmpresaSchema } from '../../../domain/model/unidade/unidade.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
const UpdateCentroBodySchema = z.object({
  centro: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'Centro deve conter exatamente 4 dígitos')
    .optional(),
  empresa: EmpresaSchema.optional(),
  nome: z.string().min(1).optional(),
});

class UpdateCentroBodyDto extends createZodDto(UpdateCentroBodySchema) {}

@ApiTags('Unidade')
@Controller('unidades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateCentroController {
  constructor(private readonly updateCentroUseCase: UpdateCentroUseCase) {}

  @Auditable({ action: 'update', resource: 'centro' })
  @Patch(':id/centros/:centroId')
  @ApiOperation({
    summary: 'Update centro',
    operationId: 'updateCentro',
  })
  @ApiSuccessResponse(CentroResponseDto)
  handle(
    @Param('id') id: string,
    @Param('centroId') centroId: string,
    @Body() body: UpdateCentroBodyDto,
  ) {
    return this.updateCentroUseCase.execute(id, centroId, body);
  }
}
