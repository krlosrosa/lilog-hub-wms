import { Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { getSessionCookieClearOptions } from '../../../shared/auth/session-cookie.options.js';

@ApiTags('Portal Auth')
@Controller('portal/auth')
@ApiErrorResponses()
export class LogoutPortalController {
  @Auditable({
    action: 'logout',
    resource: 'portal-auth',
    capturePayload: false,
  })
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Logout do portal de terceiros',
    operationId: 'logoutPortal',
  })
  handle(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie('portal_access_token', getSessionCookieClearOptions());
  }
}
