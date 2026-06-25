import { Controller, Delete, HttpCode, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeletarClienteEspecialUseCase } from '../../../application/usecases/expedicao/deletar-cliente-especial.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/clientes-especiais')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeletarClienteEspecialController {
  constructor(
    private readonly deletarClienteEspecialUseCase: DeletarClienteEspecialUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'delete', resource: 'cliente_especial' })
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Excluir cliente especial',
    operationId: 'deletarClienteEspecial',
  })
  async handle(@Param('id') id: string) {
    await this.deletarClienteEspecialUseCase.execute(id);
  }
}
