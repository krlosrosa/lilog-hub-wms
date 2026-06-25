import {
  Controller,
  Delete,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteProdutoEnderecoUseCase } from '../../../application/usecases/produto-endereco/delete-produto-endereco.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('ProdutoEndereco')
@Controller('produto-enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteProdutoEnderecoController {
  constructor(
    private readonly deleteProdutoEnderecoUseCase: DeleteProdutoEnderecoUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.UPDATE)
  @Auditable({
    action: 'delete',
    resource: 'produto_endereco',
    capturePayload: false,
  })
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete produto endereco allocation',
    operationId: 'deleteProdutoEndereco',
  })
  async handle(@Param('id') id: string) {
    await this.deleteProdutoEnderecoUseCase.execute(id);
  }
}
