import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListSessoesQueryDto,
  ListSessoesResponseDto,
} from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { ListSessoesUseCase } from '../../../application/usecases/sessao-operacao/list-sessoes.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListSessoesController {
  constructor(private readonly listSessoesUseCase: ListSessoesUseCase) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_VIEW)
  @Get()
  @ApiOperation({ summary: 'List sessoes de trabalho', operationId: 'listSessoes' })
  @ApiSuccessResponse(ListSessoesResponseDto)
  handle(@Query() query: ListSessoesQueryDto) {
    return this.listSessoesUseCase.execute(query);
  }
}
