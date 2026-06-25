import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListItemMovementsQueryDto,
  ListItemMovementsResponseDto,
} from '../../../application/dtos/movement-record/list-item-movements.dto.js';
import { ListItemMovementsUseCase } from '../../../application/usecases/movement-record/list-item-movements.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Movement Record')
@Controller('movement-records')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ListItemMovementsController {
  constructor(
    private readonly listItemMovementsUseCase: ListItemMovementsUseCase,
  ) {}

  @Get('items/:itemId')
  @ApiOperation({
    summary: 'List movement records for an item',
    operationId: 'listItemMovements',
  })
  @ApiSuccessResponse(ListItemMovementsResponseDto)
  handle(
    @Param('itemId') itemId: string,
    @Query() query: ListItemMovementsQueryDto,
  ) {
    return this.listItemMovementsUseCase.execute({
      itemId,
      ...query,
    });
  }
}
