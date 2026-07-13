import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { GetMapaCdResponseDto } from '../../../application/dtos/endereco/endereco.dto.js';
import { GetMapaCdUseCase } from '../../../application/usecases/endereco/get-mapa-cd.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const GetMapaCdQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50).optional(),
});

class GetMapaCdQueryDto extends createZodDto(GetMapaCdQuerySchema) {}

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetMapaCdController {
  constructor(private readonly getMapaCdUseCase: GetMapaCdUseCase) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get('mapa-cd')
  @ApiOperation({
    summary: 'Get warehouse map data grouped by zone, street and position',
    operationId: 'getMapaCd',
  })
  @ApiSuccessResponse(GetMapaCdResponseDto)
  handle(@Query() query: GetMapaCdQueryDto) {
    return this.getMapaCdUseCase.execute(query.unidadeId);
  }
}
