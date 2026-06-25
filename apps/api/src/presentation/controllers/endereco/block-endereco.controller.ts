import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  BlockEnderecoBodyDto,
  EnderecoResponseDto,
} from '../../../application/dtos/endereco/endereco.dto.js';
import { BlockEnderecoUseCase } from '../../../application/usecases/endereco/block-endereco.usecase.js';
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
export class BlockEnderecoController {
  constructor(private readonly blockEnderecoUseCase: BlockEnderecoUseCase) {}

  @RequirePermissions(ADDRESS_PERMISSION.BLOCK)
  @Auditable({ action: 'block', resource: 'endereco' })
  @Post(':id/block')
  @ApiOperation({
    summary: 'Block endereco',
    operationId: 'blockEndereco',
  })
  @ApiSuccessResponse(EnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: BlockEnderecoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.blockEnderecoUseCase.execute({
      id,
      motivo: body.motivo,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
