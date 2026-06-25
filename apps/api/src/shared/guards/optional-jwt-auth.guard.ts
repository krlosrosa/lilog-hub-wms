import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { catchError, of } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);

    if (result instanceof Promise) {
      return result.catch(() => true);
    }

    if (typeof result === 'boolean') {
      return result;
    }

    return result.pipe(catchError(() => of(true)));
  }

  override handleRequest<TUser>(
    _err: Error | null,
    user: TUser,
  ): TUser | null {
    return user ?? null;
  }
}
