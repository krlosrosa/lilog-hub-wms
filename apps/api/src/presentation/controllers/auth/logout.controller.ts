import { Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { OptionalJwtAuthGuard } from '../../../shared/guards/optional-jwt-auth.guard.js';
import { getSessionCookieClearOptions } from '../../../shared/auth/session-cookie.options.js';

@ApiTags('Auth')
@Controller('auth')
@ApiErrorResponses()
@UseGuards(OptionalJwtAuthGuard)
export class LogoutController {
  @Auditable({ action: 'logout', resource: 'auth', capturePayload: false })
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Logout — limpa o cookie de sessão', operationId: 'logout' })
  handle(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie('access_token', getSessionCookieClearOptions());
  }
}
