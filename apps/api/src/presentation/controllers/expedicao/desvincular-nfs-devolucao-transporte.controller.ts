import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  DesvincularNfsDevolucaoBodyDto,
  DesvincularNfsDevolucaoResponseDto,
} from '../../../application/dtos/expedicao/nfs-devolucao-transporte.dto.js';
import { DesvincularNfsDevolucaoTransporteUseCase } from '../../../application/usecases/expedicao/desvincular-nfs-devolucao-transporte.usecase.js';
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
export class DesvincularNfsDevolucaoTransporteController {
  constructor(
    private readonly desvincularNfsDevolucaoTransporteUseCase: DesvincularNfsDevolucaoTransporteUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Post(':transporteId/desvincular-nfs-devolucao')
  @ApiOperation({
    summary: 'Desvincular remessas de reentrega do transporte',
    operationId: 'desvincularNfsDevolucaoTransporte',
  })
  @ApiSuccessResponse(DesvincularNfsDevolucaoResponseDto, 'updated')
  handle(
    @Param('transporteId') transporteId: string,
    @Body() body: DesvincularNfsDevolucaoBodyDto,
  ) {
    return this.desvincularNfsDevolucaoTransporteUseCase.execute({
      ...body,
      transporteId,
    });
  }
}
