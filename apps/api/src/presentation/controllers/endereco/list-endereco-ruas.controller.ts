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
import { listDistinctRuasDb } from '../../../infra/db/endereco/list-ruas.drizzle.js';

const ListRuasQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50).optional(),
  zona: z.string().min(1).max(100).optional(),
});

class ListRuasQueryDto extends createZodDto(ListRuasQuerySchema) {}

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListEnderecoRuasController {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get('ruas')
  @ApiOperation({
    summary: 'List distinct ruas (corredores)',
    operationId: 'listEnderecoRuas',
  })
  @ApiSuccessResponse(Object)
  async handle(@Query() query: ListRuasQueryDto) {
    const ruas = await listDistinctRuasDb(this.db, query);
    return ruas.map((rua) => ({ rua }));
  }
}
