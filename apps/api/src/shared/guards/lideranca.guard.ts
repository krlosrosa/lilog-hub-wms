import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import {
  canAccessLiderancaPwa,
  LIDERANCA_PWA_CLIENT_APP,
} from '../constants/lideranca-permissions.js';

type AuthenticatedUser = {
  role: string;
};

@Injectable()
export class LiderancaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      FastifyRequest & { user?: AuthenticatedUser }
    >();

    const clientApp = request.headers['x-client-app'];
    if (clientApp !== LIDERANCA_PWA_CLIENT_APP) {
      return true;
    }

    const role = request.user?.role;
    if (!role || !canAccessLiderancaPwa(role)) {
      throw new ForbiddenException('Acesso restrito ao painel de liderança');
    }

    return true;
  }
}
