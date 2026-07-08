import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class PortalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const role = request.user?.role;

    if (role !== 'admin') {
      throw new ForbiddenException('Acesso restrito a administradores do portal');
    }

    return true;
  }
}
