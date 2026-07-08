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

import { ImprimirMapaConferenciaReentregaBodyDto } from '../../../application/dtos/expedicao/nfs-devolucao-transporte.dto.js';
import { ImprimirMapaConferenciaReentregaUseCase } from '../../../application/usecases/expedicao/imprimir-mapa-conferencia-reentrega.usecase.js';
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
export class ImprimirMapaConferenciaReentregaController {
  constructor(
    private readonly imprimirMapaConferenciaReentregaUseCase: ImprimirMapaConferenciaReentregaUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Post('conferencia-reentrega')
  @ApiOperation({
    summary: 'Gerar PDF de mapa de conferência apenas para remessas de reentrega',
    operationId: 'imprimirMapaConferenciaReentrega',
  })
  @ApiProduces('application/pdf')
  async handle(
    @Body() body: ImprimirMapaConferenciaReentregaBodyDto,
    @Req() request: FastifyRequest & { user?: RequestUser },
  ) {
    const result = await this.imprimirMapaConferenciaReentregaUseCase.execute({
      ...body,
      impressoPorUserId: getRequestUser(request)?.id ?? null,
    });

    return new StreamableFile(result.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
