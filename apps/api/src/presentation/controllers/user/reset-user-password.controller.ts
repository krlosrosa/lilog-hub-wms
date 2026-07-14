import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UserResponseDto } from '../../../application/dtos/user/list-users.dto.js';
import { ResetUserPasswordUseCase } from '../../../application/usecases/user/reset-user-password.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const ResetUserPasswordBodySchema = z.object({
  password: z.string().min(6),
});

class ResetUserPasswordBodyDto extends createZodDto(ResetUserPasswordBodySchema) {}

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
export class ResetUserPasswordController {
  constructor(
    private readonly resetUserPasswordUseCase: ResetUserPasswordUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.USUARIO_UPDATE)
  @Auditable({ action: 'reset_password', resource: 'user', capturePayload: false })
  @Post(':id/reset-password')
  @ApiOperation({
    summary: 'Reset user password with temporary password',
    operationId: 'resetUserPassword',
  })
  @ApiSuccessResponse(UserResponseDto)
  async handle(@Param('id') id: string, @Body() body: ResetUserPasswordBodyDto) {
    const user = await this.resetUserPasswordUseCase.execute(Number(id), body);
    return toPublicUser(user);
  }
}
