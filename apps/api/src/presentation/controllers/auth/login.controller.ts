import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { LoginUseCase } from '../../../application/usecases/auth/login.usecase.js';
import { WEB_CLIENT_APP } from '../../../shared/constants/client-apps.js';
import { LIDERANCA_PWA_CLIENT_APP } from '../../../shared/constants/lideranca-permissions.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import {
  getSessionCookieClearOptions,
  getSessionCookieOptions,
} from '../../../shared/auth/session-cookie.options.js';

const LoginBodySchema = z.object({
  id: z.coerce.number().int().positive(),
  password: z.string().min(1),
});

class LoginBodyDto extends createZodDto(LoginBodySchema) {}

@ApiTags('Auth')
@Controller('auth')
@ApiErrorResponses()
export class LoginController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Auditable({ action: 'login', resource: 'auth', capturePayload: false })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login com ID e senha', operationId: 'login' })
  async handle(
    @Body() body: LoginBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const clientAppHeader = request.headers['x-client-app'];
    const clientApp =
      typeof clientAppHeader === 'string' &&
      (clientAppHeader === LIDERANCA_PWA_CLIENT_APP ||
        clientAppHeader === WEB_CLIENT_APP)
        ? clientAppHeader
        : undefined;

    const { token, user } = await this.loginUseCase.execute({
      ...body,
      clientApp,
    });

    reply.setCookie('access_token', token, getSessionCookieOptions());

    return { user };
  }
}
