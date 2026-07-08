import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { LoginPortalUseCase } from '../../../application/usecases/usuario-terceiro/login-portal.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { getSessionCookieOptions } from '../../../shared/auth/session-cookie.options.js';

const LoginPortalBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

class LoginPortalBodyDto extends createZodDto(LoginPortalBodySchema) {}

@ApiTags('Portal Auth')
@Controller('portal/auth')
@ApiErrorResponses()
export class LoginPortalController {
  constructor(private readonly loginPortalUseCase: LoginPortalUseCase) {}

  @Auditable({
    action: 'login',
    resource: 'portal-auth',
    capturePayload: false,
  })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login do portal de terceiros',
    operationId: 'loginPortal',
  })
  async handle(
    @Body() body: LoginPortalBodyDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { token, user } = await this.loginPortalUseCase.execute(body);

    reply.setCookie('portal_access_token', token, getSessionCookieOptions());

    return { user };
  }
}
