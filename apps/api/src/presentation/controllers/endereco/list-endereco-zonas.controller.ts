import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';
import { listDistinctZonasDb } from '../../../infra/db/endereco/list-zonas.drizzle.js';

const ListZonasQuerySchema = z.object({
  centroId: z.uuid().optional(),
});

class ListZonasQueryDto extends createZodDto(ListZonasQuerySchema) {}

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListEnderecoZonasController {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get('zonas')
  @ApiOperation({
    summary: 'List distinct zonas',
    operationId: 'listEnderecoZonas',
  })
  @ApiSuccessResponse(Object)
  async handle(@Query() query: ListZonasQueryDto) {
    const zonas = await listDistinctZonasDb(this.db, query.centroId);
    return zonas.map((zona) => ({ zona }));
  }
}
