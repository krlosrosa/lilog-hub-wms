import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListarProcessosDebitoQueryDto,
  ListarProcessosDebitoResponseDto,
} from '../../../application/dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { ListarProcessosDebitoUseCase } from '../../../application/usecases/cobranca-transportadora/listar-processos-debito.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/processos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarProcessosDebitoController {
  constructor(
    private readonly listarProcessosDebitoUseCase: ListarProcessosDebitoUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar processos de débito de transportadora',
    operationId: 'listarProcessosDebito',
  })
  @ApiSuccessResponse(ListarProcessosDebitoResponseDto)
  handle(@Query() query: ListarProcessosDebitoQueryDto) {
    return this.listarProcessosDebitoUseCase.execute(query);
  }
}
