import {
  Body,
  Controller,
  Post,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { ImprimirMapasBodyDto } from '../../../application/dtos/expedicao/imprimir-mapas.dto.js';
import { ImprimirMapasUseCase } from '../../../application/usecases/expedicao/imprimir-mapas.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Expedicao')
@Controller('expedicao/mapas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ImprimirMapasController {
  constructor(private readonly imprimirMapasUseCase: ImprimirMapasUseCase) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Post('imprimir')
  @ApiOperation({
    summary: 'Gerar PDF de mapas por tipo (separação, conferência ou todos)',
    operationId: 'imprimirMapas',
  })
  @ApiProduces('application/pdf')
  async handle(
    @Body() body: ImprimirMapasBodyDto,
    @Req() request: FastifyRequest & { user?: RequestUser },
  ) {
    const result = await this.imprimirMapasUseCase.execute({
      ...body,
      impressoPorUserId: getRequestUser(request)?.id ?? null,
    });

    return new StreamableFile(result.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
