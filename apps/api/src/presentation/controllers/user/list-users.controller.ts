import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListUsersQueryDto,
  ListUsersResponseDto,
} from '../../../application/dtos/user/list-users.dto.js';
import { ListUsersUseCase } from '../../../application/usecases/user/list-users.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
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
export class ListUsersController {
  constructor(private readonly listUsersUseCase: ListUsersUseCase) {}

  @RequirePermissions(USER_PERMISSION.USUARIO_VIEW)
  @Get()
  @ApiOperation({
    summary: 'List users',
    operationId: 'listUsers',
  })
  @ApiSuccessResponse(ListUsersResponseDto)
  async handle(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsersUseCase.execute(query);

    return {
      ...result,
      items: result.items.map(toPublicUser),
    };
  }
}
