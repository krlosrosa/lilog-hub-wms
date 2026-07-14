import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UserResponseDto } from '../../../application/dtos/user/list-users.dto.js';
import { UpdateUserUseCase } from '../../../application/usecases/user/update-user.usecase.js';
import {
  UserRoleSchema,
  UserStatusSchema,
} from '../../../domain/model/user/user.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const UpdateUserBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: UserRoleSchema.optional(),
    status: UserStatusSchema.optional(),
    funcionarioId: z.number().int().positive().nullable().optional(),
    unidadesIds: z.array(z.string().min(1)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

class UpdateUserBodyDto extends createZodDto(UpdateUserBodySchema) {}

function toPublicUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  mustChangePassword: boolean;
  funcionarioId: number | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    funcionarioId: user.funcionarioId,
    createdAt: user.createdAt,
  };
}

@ApiTags('User')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateUserController {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  @RequirePermissions(USER_PERMISSION.USUARIO_UPDATE)
  @Auditable({ action: 'update', resource: 'user' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    operationId: 'updateUser',
  })
  @ApiSuccessResponse(UserResponseDto)
  async handle(@Param('id') id: string, @Body() body: UpdateUserBodyDto) {
    const user = await this.updateUserUseCase.execute(Number(id), body);
    return toPublicUser(user);
  }
}
