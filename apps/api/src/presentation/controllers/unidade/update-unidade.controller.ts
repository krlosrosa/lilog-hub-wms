import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UnidadeResponseDto } from '../../../application/dtos/unidade/list-unidades.dto.js';
import { UpdateUnidadeUseCase } from '../../../application/usecases/unidade/update-unidade.usecase.js';
import { ClusterSchema } from '../../../domain/model/unidade/unidade.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
const UpdateUnidadeBodySchema = z.object({
  nome: z.string().min(1).optional(),
  cluster: ClusterSchema.optional(),
  nomeFilial: z.string().min(1).optional(),
});

class UpdateUnidadeBodyDto extends createZodDto(UpdateUnidadeBodySchema) {}

@ApiTags('Unidade')
@Controller('unidades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateUnidadeController {
  constructor(private readonly updateUnidadeUseCase: UpdateUnidadeUseCase) {}

  @Auditable({ action: 'update', resource: 'unidade' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update unidade',
    operationId: 'updateUnidade',
  })
  @ApiSuccessResponse(UnidadeResponseDto)
  handle(@Param('id') id: string, @Body() body: UpdateUnidadeBodyDto) {
    return this.updateUnidadeUseCase.execute(id, body);
  }
}
