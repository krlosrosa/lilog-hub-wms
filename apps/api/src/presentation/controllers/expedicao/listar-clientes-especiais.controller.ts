import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListClientesEspeciaisQueryDto,
  ListClientesEspeciaisResponseDto,
} from '../../../application/dtos/expedicao/cliente-especial.dto.js';
import { ListarClientesEspeciaisUseCase } from '../../../application/usecases/expedicao/listar-clientes-especiais.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/clientes-especiais')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarClientesEspeciaisController {
  constructor(
    private readonly listarClientesEspeciaisUseCase: ListarClientesEspeciaisUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar clientes especiais da expedição',
    operationId: 'listarClientesEspeciais',
  })
  @ApiSuccessResponse(ListClientesEspeciaisResponseDto)
  handle(@Query() query: ListClientesEspeciaisQueryDto) {
    return this.listarClientesEspeciaisUseCase.execute(query);
  }
}
