import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UsuarioTerceiroResponseDto } from '../../../application/dtos/usuario-terceiro/usuario-terceiro.dto.js';
import { BlockUsuarioTerceiroUseCase } from '../../../application/usecases/usuario-terceiro/block-usuario-terceiro.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
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
export class BlockUsuarioTerceiroController {
  constructor(
    private readonly blockUsuarioTerceiroUseCase: BlockUsuarioTerceiroUseCase,
  ) {}

  @Auditable({ action: 'block', resource: 'portal-usuario' })
  @Patch(':id/block')
  @ApiOperation({
    summary: 'Bloqueia usuário do portal de terceiros',
    operationId: 'blockUsuarioTerceiro',
  })
  @ApiSuccessResponse(UsuarioTerceiroResponseDto)
  async handle(@Param('id') id: string) {
    const user = await this.blockUsuarioTerceiroUseCase.execute(Number(id));
    return toPublicUsuario(user);
  }
}
