import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListConfiguracoesImpressaoQueryDto,
  ListConfiguracoesImpressaoResponseDto,
} from '../../../application/dtos/configuracao-impressao/list-configuracoes-impressao.dto.js';
import { ListarConfiguracoesImpressaoUseCase } from '../../../application/usecases/configuracao-impressao/listar-configuracoes-impressao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/configuracoes-impressao')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarConfiguracoesImpressaoController {
  constructor(
    private readonly listarConfiguracoesImpressaoUseCase: ListarConfiguracoesImpressaoUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar configurações de impressão da unidade',
    operationId: 'listarConfiguracoesImpressao',
  })
  @ApiSuccessResponse(ListConfiguracoesImpressaoResponseDto)
  handle(@Query() query: ListConfiguracoesImpressaoQueryDto) {
    return this.listarConfiguracoesImpressaoUseCase.execute(query);
  }
}
