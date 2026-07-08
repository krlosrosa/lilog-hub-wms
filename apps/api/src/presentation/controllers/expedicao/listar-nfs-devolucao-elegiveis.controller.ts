import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListarNfsDevolucaoElegiveisQueryDto,
  ListarNfsDevolucaoElegiveisResponseDto,
} from '../../../application/dtos/expedicao/nfs-devolucao-transporte.dto.js';
import { ListarNfsDevolucaoElegiveisUseCase } from '../../../application/usecases/expedicao/listar-nfs-devolucao-elegiveis.usecase.js';
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
export class ListarNfsDevolucaoElegiveisController {
  constructor(
    private readonly listarNfsDevolucaoElegiveisUseCase: ListarNfsDevolucaoElegiveisUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get(':transporteId/nfs-devolucao-elegiveis')
  @ApiOperation({
    summary: 'Listar NFs de devolução elegíveis (reentrega e devolução total)',
    operationId: 'listarNfsDevolucaoElegiveis',
  })
  @ApiSuccessResponse(ListarNfsDevolucaoElegiveisResponseDto)
  handle(
    @Param('transporteId') transporteId: string,
    @Query() query: ListarNfsDevolucaoElegiveisQueryDto,
  ) {
    return this.listarNfsDevolucaoElegiveisUseCase.execute({
      ...query,
      transporteId,
    });
  }
}
