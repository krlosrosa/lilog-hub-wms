import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { FuncionarioEquipeResponseDto } from '../../../application/dtos/sessao-operacao/equipe.dto.js';
import { GetFuncionarioEquipeUseCase } from '../../../application/usecases/sessao-operacao/get-funcionario-equipe.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/equipes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetFuncionarioEquipeController {
  constructor(
    private readonly getFuncionarioEquipeUseCase: GetFuncionarioEquipeUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.FUNCIONARIO_VIEW)
  @Get('by-funcionario/:funcionarioId')
  @ApiOperation({
    summary: 'Get equipe of funcionario',
    operationId: 'getFuncionarioEquipe',
  })
  @ApiSuccessResponse(FuncionarioEquipeResponseDto)
  handle(@Param('funcionarioId', ParseIntPipe) funcionarioId: number) {
    return this.getFuncionarioEquipeUseCase.execute(funcionarioId);
  }
}
