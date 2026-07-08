import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UsuarioTerceiroResponseDto } from '../../../application/dtos/usuario-terceiro/usuario-terceiro.dto.js';
import { UpdateUsuarioTerceiroUseCase } from '../../../application/usecases/usuario-terceiro/update-usuario-terceiro.usecase.js';
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

const UpdateUsuarioTerceiroBodySchema = z
  .object({
    nome: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: UsuarioTerceiroRoleSchema.optional(),
    status: UsuarioTerceiroStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

class UpdateUsuarioTerceiroBodyDto extends createZodDto(
  UpdateUsuarioTerceiroBodySchema,
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
export class UpdateUsuarioTerceiroController {
  constructor(
    private readonly updateUsuarioTerceiroUseCase: UpdateUsuarioTerceiroUseCase,
  ) {}

  @Auditable({ action: 'update', resource: 'portal-usuario' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza usuário do portal de terceiros',
    operationId: 'updateUsuarioTerceiro',
  })
  @ApiSuccessResponse(UsuarioTerceiroResponseDto)
  async handle(
    @Param('id') id: string,
    @Body() body: UpdateUsuarioTerceiroBodyDto,
  ) {
    const user = await this.updateUsuarioTerceiroUseCase.execute(
      Number(id),
      body,
    );
    return toPublicUsuario(user);
  }
}
