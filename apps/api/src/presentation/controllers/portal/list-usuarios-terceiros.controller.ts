import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListUsuariosTerceirosQueryDto,
  ListUsuariosTerceirosResponseDto,
} from '../../../application/dtos/usuario-terceiro/usuario-terceiro.dto.js';
import { ListUsuariosTerceirosUseCase } from '../../../application/usecases/usuario-terceiro/list-usuarios-terceiros.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { PortalAdminGuard } from '../../../shared/guards/portal-admin.guard.js';
import { PortalJwtAuthGuard } from '../../../shared/guards/portal-jwt-auth.guard.js';

function toPublicUsuario(user: {
  id: number;
  nome: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@ApiTags('Portal Usuarios')
@Controller('portal/usuarios')
@UseGuards(PortalJwtAuthGuard, PortalAdminGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListUsuariosTerceirosController {
  constructor(
    private readonly listUsuariosTerceirosUseCase: ListUsuariosTerceirosUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista usuários do portal de terceiros',
    operationId: 'listUsuariosTerceiros',
  })
  @ApiSuccessResponse(ListUsuariosTerceirosResponseDto)
  async handle(@Query() query: ListUsuariosTerceirosQueryDto) {
    const result = await this.listUsuariosTerceirosUseCase.execute({
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
    });

    return {
      items: result.items.map(toPublicUsuario),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
