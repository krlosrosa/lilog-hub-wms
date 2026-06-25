import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { EnderecoResponseDto } from '../../../application/dtos/endereco/endereco.dto.js';
import { GetEnderecoUseCase } from '../../../application/usecases/endereco/get-endereco.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetEnderecoController {
  constructor(private readonly getEnderecoUseCase: GetEnderecoUseCase) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get(':id')
  @ApiOperation({
    summary: 'Get endereco by id',
    operationId: 'getEndereco',
  })
  @ApiSuccessResponse(EnderecoResponseDto)
  handle(@Param('id') id: string) {
    return this.getEnderecoUseCase.execute(id);
  }
}
