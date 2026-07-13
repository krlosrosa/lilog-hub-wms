import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  GetProductsDatasetQueryDto,
} from '../../../application/dtos/sync/get-products-dataset.dto.js';
import { GetProductsDatasetUseCase } from '../../../application/usecases/sync/get-products-dataset.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Sync')
@Controller('sync/datasets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetProductsDatasetController {
  constructor(
    private readonly getProductsDatasetUseCase: GetProductsDatasetUseCase,
  ) {}

  @Get('products')
  @ApiOperation({
    summary: 'Catálogo de produtos para sincronização offline',
    operationId: 'getProductsDataset',
  })
  handle(
    @Query() query: GetProductsDatasetQueryDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.getProductsDatasetUseCase.execute({
      unidadeId: query.unidadeId,
      cursor: query.cursor,
      limit: query.limit,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
