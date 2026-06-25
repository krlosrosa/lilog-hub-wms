import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ClienteEspecialResponseDto } from '../../../application/dtos/expedicao/cliente-especial.dto.js';
import { ObterClienteEspecialUseCase } from '../../../application/usecases/expedicao/obter-cliente-especial.usecase.js';
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
export class ObterClienteEspecialController {
  constructor(
    private readonly obterClienteEspecialUseCase: ObterClienteEspecialUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get(':id')
  @ApiOperation({
    summary: 'Obter cliente especial por ID',
    operationId: 'obterClienteEspecial',
  })
  @ApiSuccessResponse(ClienteEspecialResponseDto)
  handle(@Param('id') id: string) {
    return this.obterClienteEspecialUseCase.execute(id);
  }
}
