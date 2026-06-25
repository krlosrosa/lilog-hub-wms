import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  CreateEscalaBodyDto,
  CreateEscalaResponseDto,
} from '../../../application/dtos/sessao-operacao/escala.dto.js';
import { CreateEscalaUseCase } from '../../../application/usecases/sessao-operacao/create-escala.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/escalas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateEscalaController {
  constructor(private readonly createEscalaUseCase: CreateEscalaUseCase) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Post()
  @Auditable({ action: 'create', resource: 'escala_trabalho' })
  @ApiOperation({ summary: 'Create escala with equipe', operationId: 'createEscala' })
  @ApiSuccessResponse(CreateEscalaResponseDto, 'created')
  handle(@Body() body: CreateEscalaBodyDto) {
    return this.createEscalaUseCase.execute(body);
  }
}
