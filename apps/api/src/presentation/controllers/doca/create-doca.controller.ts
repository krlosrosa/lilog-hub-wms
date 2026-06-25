import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DocaResponseDto } from '../../../application/dtos/doca/doca.dto.js';
import { CreateDocaUseCase } from '../../../application/usecases/doca/create-doca.usecase.js';
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
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const CreateDocaBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  codigo: z.string().min(1).max(50),
  nome: z.string().min(1).max(255),
  tipo: DocaTipoSchema,
  capacidadeVeiculos: z.number().int().positive().optional(),
  observacao: z.string().optional(),
});

class CreateDocaBodyDto extends createZodDto(CreateDocaBodySchema) {}

@ApiTags('Doca')
@Controller('docas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateDocaController {
  constructor(private readonly createDocaUseCase: CreateDocaUseCase) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_CREATE)
  @Auditable({ action: 'create', resource: 'doca' })
  @Post()
  @ApiOperation({
    summary: 'Create doca',
    operationId: 'createDoca',
  })
  @ApiSuccessResponse(DocaResponseDto, 'created')
  handle(
    @Body() body: CreateDocaBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.createDocaUseCase.execute({
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
