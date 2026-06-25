import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ChecklistRecebimentoResponseDto } from '../../../application/dtos/recebimento/checklist-recebimento.dto.js';
import { GetChecklistRecebimentoUseCase } from '../../../application/usecases/recebimento/get-checklist-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetChecklistRecebimentoController {
  constructor(
    private readonly getChecklistRecebimentoUseCase: GetChecklistRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Get(':id/checklist')
  @ApiOperation({
    summary: 'Consultar checklist de entrada do veículo',
    operationId: 'getChecklistRecebimento',
  })
  @ApiSuccessResponse(ChecklistRecebimentoResponseDto)
  handle(@Param('id') id: string) {
    return this.getChecklistRecebimentoUseCase.execute(id);
  }
}
