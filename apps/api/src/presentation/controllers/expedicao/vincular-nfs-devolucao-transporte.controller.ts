import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  VincularNfsDevolucaoBodyDto,
  VincularNfsDevolucaoResponseDto,
} from '../../../application/dtos/expedicao/nfs-devolucao-transporte.dto.js';
import { VincularNfsDevolucaoTransporteUseCase } from '../../../application/usecases/expedicao/vincular-nfs-devolucao-transporte.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/transportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class VincularNfsDevolucaoTransporteController {
  constructor(
    private readonly vincularNfsDevolucaoTransporteUseCase: VincularNfsDevolucaoTransporteUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Post(':transporteId/vincular-nfs-devolucao')
  @ApiOperation({
    summary: 'Vincular NFs de devolução como remessas de reentrega no transporte',
    operationId: 'vincularNfsDevolucaoTransporte',
  })
  @ApiSuccessResponse(VincularNfsDevolucaoResponseDto, 'created')
  handle(
    @Param('transporteId') transporteId: string,
    @Body() body: VincularNfsDevolucaoBodyDto,
  ) {
    return this.vincularNfsDevolucaoTransporteUseCase.execute({
      ...body,
      transporteId,
    });
  }
}
