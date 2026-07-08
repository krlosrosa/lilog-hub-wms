import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { LoginUseCase } from '../../../application/usecases/auth/login.usecase.js';
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
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { token, user } = await this.loginUseCase.execute(body);

    reply.setCookie('access_token', token, getSessionCookieOptions());

    return { user };
  }
}
