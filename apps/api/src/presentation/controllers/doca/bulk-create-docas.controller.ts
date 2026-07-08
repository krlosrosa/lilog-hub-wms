import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { BulkCreateDocasResponseDto } from '../../../application/dtos/doca/doca.dto.js';
import { BulkCreateDocasUseCase } from '../../../application/usecases/doca/bulk-create-docas.usecase.js';
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

const BulkCreateDocasBodySchema = z
  .object({
    unidadeId: z.string().min(1).max(50),
    numeroInicial: z.number().int().positive(),
    numeroFinal: z.number().int().positive(),
    codigoPrefixo: z.string().min(1).max(20).default('D'),
    nomePrefixo: z.string().min(1).max(50).default('Doca '),
    tipo: DocaTipoSchema,
    capacidadeVeiculos: z.number().int().positive().optional(),
    observacao: z.string().optional(),
  })
  .refine((data) => data.numeroInicial <= data.numeroFinal, {
    message: 'Número inicial deve ser menor ou igual ao final',
    path: ['numeroFinal'],
  })
  .refine((data) => data.numeroFinal - data.numeroInicial + 1 <= 100, {
    message: 'Intervalo máximo de 100 docas por operação',
    path: ['numeroFinal'],
  });

class BulkCreateDocasBodyDto extends createZodDto(BulkCreateDocasBodySchema) {}

@ApiTags('Doca')
@Controller('docas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BulkCreateDocasController {
  constructor(
    private readonly bulkCreateDocasUseCase: BulkCreateDocasUseCase,
  ) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_CREATE)
  @Auditable({ action: 'create', resource: 'doca' })
  @Post('em-massa')
  @ApiOperation({
    summary: 'Create docas in bulk by numeric interval',
    operationId: 'bulkCreateDocas',
  })
  @ApiSuccessResponse(BulkCreateDocasResponseDto, 'created')
  handle(
    @Body() body: BulkCreateDocasBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.bulkCreateDocasUseCase.execute({
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
