import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import {
  CreateSessaoResponseDto,
} from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { CreateSessaoUseCase } from '../../../application/usecases/sessao-operacao/create-sessao.usecase.js';
import { CreateSessaoInputSchema } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

class CreateSessaoBodyDto extends createZodDto(CreateSessaoInputSchema) {}

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateSessaoController {
  constructor(private readonly createSessaoUseCase: CreateSessaoUseCase) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Post()
  @Auditable({ action: 'create', resource: 'sessao_trabalho' })
  @ApiOperation({ summary: 'Create sessao de trabalho', operationId: 'createSessao' })
  @ApiSuccessResponse(CreateSessaoResponseDto, 'created')
  handle(@Body() body: CreateSessaoBodyDto) {
    return this.createSessaoUseCase.execute(body);
  }
}
