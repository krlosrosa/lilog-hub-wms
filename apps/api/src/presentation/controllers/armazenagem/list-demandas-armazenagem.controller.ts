import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListDemandasArmazenagemQueryDto,
  ListDemandasArmazenagemResponseDto,
} from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { ListDemandasArmazenagemUseCase } from '../../../application/usecases/armazenagem/list-demandas-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ListDemandasArmazenagemController {
  constructor(
    private readonly listDemandasArmazenagemUseCase: ListDemandasArmazenagemUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List storage demands',
    operationId: 'listDemandasArmazenagem',
  })
  @ApiSuccessResponse(ListDemandasArmazenagemResponseDto)
  handle(@Query() query: ListDemandasArmazenagemQueryDto) {
    return this.listDemandasArmazenagemUseCase.execute(query);
  }
}
