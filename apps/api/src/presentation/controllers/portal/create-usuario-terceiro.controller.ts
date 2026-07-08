import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UsuarioTerceiroResponseDto } from '../../../application/dtos/usuario-terceiro/usuario-terceiro.dto.js';
import { CreateUsuarioTerceiroUseCase } from '../../../application/usecases/usuario-terceiro/create-usuario-terceiro.usecase.js';
import {
  UsuarioTerceiroRoleSchema,
  UsuarioTerceiroStatusSchema,
} from '../../../domain/model/usuario-terceiro/usuario-terceiro.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { PortalAdminGuard } from '../../../shared/guards/portal-admin.guard.js';
import { PortalJwtAuthGuard } from '../../../shared/guards/portal-jwt-auth.guard.js';

const CreateUsuarioTerceiroBodySchema = z.object({
  nome: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: UsuarioTerceiroRoleSchema.default('viewer'),
  status: UsuarioTerceiroStatusSchema.default('ativo'),
});

class CreateUsuarioTerceiroBodyDto extends createZodDto(
  CreateUsuarioTerceiroBodySchema,
) {}

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
export class CreateUsuarioTerceiroController {
  constructor(
    private readonly createUsuarioTerceiroUseCase: CreateUsuarioTerceiroUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'portal-usuario' })
  @Post()
  @ApiOperation({
    summary: 'Cria usuário do portal de terceiros',
    operationId: 'createUsuarioTerceiro',
  })
  @ApiSuccessResponse(UsuarioTerceiroResponseDto, 'created')
  async handle(@Body() body: CreateUsuarioTerceiroBodyDto) {
    const user = await this.createUsuarioTerceiroUseCase.execute(body);
    return toPublicUsuario(user);
  }
}
