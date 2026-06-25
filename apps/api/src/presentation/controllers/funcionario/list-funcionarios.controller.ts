import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListFuncionariosQueryDto,
  ListFuncionariosResponseDto,
} from '../../../application/dtos/funcionario/list-funcionarios.dto.js';
import { ListFuncionariosUseCase } from '../../../application/usecases/funcionario/list-funcionarios.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Funcionario')
@Controller('funcionarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListFuncionariosController {
  constructor(
    private readonly listFuncionariosUseCase: ListFuncionariosUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.FUNCIONARIO_VIEW)
  @Get()
  @ApiOperation({
    summary: 'List funcionarios',
    operationId: 'listFuncionarios',
  })
  @ApiSuccessResponse(ListFuncionariosResponseDto)
  handle(@Query() query: ListFuncionariosQueryDto) {
    return this.listFuncionariosUseCase.execute(query);
  }
}
