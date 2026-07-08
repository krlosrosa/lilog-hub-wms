import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { EnderecoResponseDto } from '../../../application/dtos/endereco/endereco.dto.js';
import { UpdateEnderecoUseCase } from '../../../application/usecases/endereco/update-endereco.usecase.js';
import { UpdateEnderecoInputSchema } from '../../../domain/model/endereco/endereco.model.js';
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

class UpdateEnderecoBodyDto extends createZodDto(UpdateEnderecoInputSchema) {}

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateEnderecoController {
  constructor(private readonly updateEnderecoUseCase: UpdateEnderecoUseCase) {}

  @RequirePermissions(ADDRESS_PERMISSION.UPDATE)
  @Auditable({ action: 'update', resource: 'endereco' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update endereco',
    operationId: 'updateEndereco',
  })
  @ApiSuccessResponse(EnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateEnderecoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.updateEnderecoUseCase.execute({
      id,
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
