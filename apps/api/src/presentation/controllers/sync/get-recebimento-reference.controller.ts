import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  GetRecebimentoReferenceQueryDto,
} from '../../../application/dtos/sync/get-recebimento-reference.dto.js';
import { GetRecebimentoReferenceDataUseCase } from '../../../application/usecases/sync/get-recebimento-reference-data.usecase.js';
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
export class GetRecebimentoReferenceController {
  constructor(
    private readonly getReferenceDataUseCase: GetRecebimentoReferenceDataUseCase,
  ) {}

  @Get('recebimento-reference')
  @ApiOperation({
    summary: 'Dados de referência para recebimento offline (docas, config)',
    operationId: 'getRecebimentoReferenceData',
  })
  handle(
    @Query() query: GetRecebimentoReferenceQueryDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.getReferenceDataUseCase.execute({
      unidadeId: query.unidadeId,
      cursor: query.cursor,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
