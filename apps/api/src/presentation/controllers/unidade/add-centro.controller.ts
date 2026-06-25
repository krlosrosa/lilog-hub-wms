import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CentroResponseDto } from '../../../application/dtos/unidade/list-unidades.dto.js';
import { AddCentroUseCase } from '../../../application/usecases/unidade/add-centro.usecase.js';
import { EmpresaSchema } from '../../../domain/model/unidade/unidade.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
const AddCentroBodySchema = z.object({
  centro: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'Centro deve conter exatamente 4 dígitos'),
  empresa: EmpresaSchema,
  nome: z.string().min(1),
});

class AddCentroBodyDto extends createZodDto(AddCentroBodySchema) {}

@ApiTags('Unidade')
@Controller('unidades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AddCentroController {
  constructor(private readonly addCentroUseCase: AddCentroUseCase) {}

  @Auditable({ action: 'create', resource: 'centro' })
  @Post(':id/centros')
  @ApiOperation({
    summary: 'Add centro to unidade',
    operationId: 'addCentro',
  })
  @ApiSuccessResponse(CentroResponseDto, 'created')
  handle(@Param('id') id: string, @Body() body: AddCentroBodyDto) {
    return this.addCentroUseCase.execute(id, body);
  }
}
