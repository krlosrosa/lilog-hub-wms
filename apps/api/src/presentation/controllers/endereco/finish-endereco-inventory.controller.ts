import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  EnderecoActionBodyDto,
  EnderecoResponseDto,
} from '../../../application/dtos/endereco/endereco.dto.js';
import { FinishEnderecoInventoryUseCase } from '../../../application/usecases/endereco/finish-endereco-inventory.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class FinishEnderecoInventoryController {
  constructor(
    private readonly finishEnderecoInventoryUseCase: FinishEnderecoInventoryUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.INVENTORY)
  @Auditable({ action: 'inventory-finish', resource: 'endereco' })
  @Post(':id/inventory/finish')
  @ApiOperation({
    summary: 'Finish endereco inventory',
    operationId: 'finishEnderecoInventory',
  })
  @ApiSuccessResponse(EnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: EnderecoActionBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.finishEnderecoInventoryUseCase.execute({
      id,
      motivo: body.motivo,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
