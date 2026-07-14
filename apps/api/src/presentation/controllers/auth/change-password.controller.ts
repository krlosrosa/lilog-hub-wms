import { Body, Controller, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ChangeOwnPasswordUseCase } from '../../../application/usecases/auth/change-own-password.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const ChangePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(6),
    confirmNewPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'A confirmação da senha não confere',
    path: ['confirmNewPassword'],
  });

class ChangePasswordBodyDto extends createZodDto(ChangePasswordBodySchema) {}

@ApiTags('Auth')
@Controller('auth')
@ApiErrorResponses()
export class ChangePasswordController {
  constructor(
    private readonly changeOwnPasswordUseCase: ChangeOwnPasswordUseCase,
  ) {}

  @Auditable({ action: 'change_password', resource: 'auth', capturePayload: false })
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Change own password',
    operationId: 'changeOwnPassword',
  })
  handle(
    @Request() req: FastifyRequest & { user: { id: number } },
    @Body() body: ChangePasswordBodyDto,
  ) {
    return this.changeOwnPasswordUseCase.execute(req.user.id, body);
  }
}
