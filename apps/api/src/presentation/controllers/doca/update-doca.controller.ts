import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DocaResponseDto } from '../../../application/dtos/doca/doca.dto.js';
import { UpdateDocaUseCase } from '../../../application/usecases/doca/update-doca.usecase.js';
import { DocaTipoSchema } from '../../../domain/model/doca/doca.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCA_PERMISSION } from '../../../shared/constants/doca-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const UpdateDocaBodySchema = z.object({
  codigo: z.string().min(1).max(50).optional(),
  nome: z.string().min(1).max(255).optional(),
  tipo: DocaTipoSchema.optional(),
  capacidadeVeiculos: z.number().int().positive().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

class UpdateDocaBodyDto extends createZodDto(UpdateDocaBodySchema) {}

@ApiTags('Doca')
@Controller('docas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateDocaController {
  constructor(private readonly updateDocaUseCase: UpdateDocaUseCase) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_UPDATE)
  @Auditable({ action: 'update', resource: 'doca' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update doca',
    operationId: 'updateDoca',
  })
  @ApiSuccessResponse(DocaResponseDto)
  handle(@Param('id') id: string, @Body() body: UpdateDocaBodyDto) {
    return this.updateDocaUseCase.execute({ id, data: body });
  }
}
