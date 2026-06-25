import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserResponseDto } from '../../../application/dtos/user/list-users.dto.js';
import { UnblockUserUseCase } from '../../../application/usecases/user/unblock-user.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

function toPublicUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  funcionarioId: number | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    funcionarioId: user.funcionarioId,
    createdAt: user.createdAt,
  };
}

@ApiTags('User')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UnblockUserController {
  constructor(private readonly unblockUserUseCase: UnblockUserUseCase) {}

  @RequirePermissions(USER_PERMISSION.USUARIO_UNBLOCK)
  @Auditable({ action: 'unblock', resource: 'user' })
  @Patch(':id/unblock')
  @ApiOperation({
    summary: 'Unblock user',
    operationId: 'unblockUser',
  })
  @ApiSuccessResponse(UserResponseDto)
  async handle(@Param('id') id: string) {
    const user = await this.unblockUserUseCase.execute(Number(id));
    return toPublicUser(user);
  }
}
