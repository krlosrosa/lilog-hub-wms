import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UserResponseDto } from '../../../application/dtos/user/list-users.dto.js';
import { CreateUserUseCase } from '../../../application/usecases/user/create-user.usecase.js';
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

const CreateUserBodySchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  password: z.string().min(6),
  role: UserRoleSchema.default('operator'),
  status: UserStatusSchema.default('pendente'),
  funcionarioId: z.number().int().positive(),
  unidadesIds: z.array(z.string().min(1)).optional(),
});

class CreateUserBodyDto extends createZodDto(CreateUserBodySchema) {}

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
export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @RequirePermissions(USER_PERMISSION.USUARIO_CREATE)
  @Auditable({ action: 'create', resource: 'user' })
  @Post()
  @ApiOperation({
    summary: 'Create user',
    operationId: 'createUser',
  })
  @ApiSuccessResponse(UserResponseDto, 'created')
  async handle(@Body() body: CreateUserBodyDto) {
    const user = await this.createUserUseCase.execute(body);
    return toPublicUser(user);
  }
}
