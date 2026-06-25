import {
  Controller,
  Delete,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteEnderecoUseCase } from '../../../application/usecases/endereco/delete-endereco.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteEnderecoController {
  constructor(private readonly deleteEnderecoUseCase: DeleteEnderecoUseCase) {}

  @RequirePermissions(ADDRESS_PERMISSION.UPDATE)
  @Auditable({ action: 'delete', resource: 'endereco', capturePayload: false })
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete endereco',
    operationId: 'deleteEndereco',
  })
  async handle(@Param('id') id: string) {
    await this.deleteEnderecoUseCase.execute(id);
  }
}
